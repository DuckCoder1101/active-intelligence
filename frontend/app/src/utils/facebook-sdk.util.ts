const FB_SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js';
const GRAPH_API_VERSION = 'v23.0';

const FB_LOGIN_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_metadata',
  'leads_retrieval',
  'business_management',
].join(',');

interface FacebookAuthResponse {
  accessToken: string;
  userID: string;
}

interface FacebookLoginResponse {
  authResponse: FacebookAuthResponse | null;
  status: 'connected' | 'not_authorized' | 'unknown';
}

declare global {
  interface Window {
    FB?: {
      init: (params: {
        appId: string;
        cookie?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: FacebookLoginResponse) => void,
        params?: { scope: string; return_scopes?: boolean },
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

let sdkPromise: Promise<void> | null = null;

function loadFacebookSdk(): Promise<void> {
  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB?.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false,
        version: GRAPH_API_VERSION,
      });
      resolve();
    };

    if (document.getElementById('facebook-jssdk')) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = FB_SDK_SRC;
    script.async = true;
    script.defer = true;
    script.onerror = () =>
      reject(new Error('Falha ao carregar o SDK do Facebook.'));
    document.body.appendChild(script);
  });

  return sdkPromise;
}

/**
 * Abre o popup de login do Facebook (FB.login) e devolve o short-lived user
 * access token, já com os escopos exigidos pela integração de Lead Ads. O
 * backend (connectFacebookAdsHandler) troca esse token por um de longa
 * duração e nunca recebe as credenciais do Facebook diretamente do usuário.
 */
export async function connectFacebookAccount(): Promise<string> {
  await loadFacebookSdk();

  if (!window.FB) {
    throw new Error(
      'SDK do Facebook não carregou. Verifique se algum bloqueador de anúncios está ativo.',
    );
  }

  return new Promise((resolve, reject) => {
    window.FB!.login(
      (response) => {
        if (response.status === 'connected' && response.authResponse) {
          resolve(response.authResponse.accessToken);
          return;
        }
        reject(new Error('Login com o Facebook cancelado ou não autorizado.'));
      },
      { scope: FB_LOGIN_SCOPES, return_scopes: true },
    );
  });
}
