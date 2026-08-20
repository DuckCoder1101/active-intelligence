const FB_SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js';
const GRAPH_API_VERSION = 'v23.0';

const FB_LOGIN_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'leads_retrieval',
  'business_management',
  'ads_read',
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
        params?: {
          scope: string;
          return_scopes?: boolean;
        },
      ) => void;
    };

    fbAsyncInit?: () => void;
  }
}

let sdkPromise: Promise<void> | null = null;
let sdkInitialized = false;

const FB_LOGIN_TIMEOUT_MS = 120_000;

function initializeFacebookSdk(): void {
  if (!window.FB) {
    throw new Error(
      'SDK do Facebook carregou, mas window.FB não está disponível.',
    );
  }

  if (sdkInitialized) {
    return;
  }

  window.FB.init({
    appId: import.meta.env.VITE_FACEBOOK_APP_ID,
    cookie: true,
    xfbml: false,
    version: GRAPH_API_VERSION,
  });

  sdkInitialized = true;
}

function loadFacebookSdk(): Promise<void> {
  // SDK já carregado e inicializado
  if (window.FB && sdkInitialized) {
    return Promise.resolve();
  }

  // SDK já carregado, mas ainda não inicializado
  if (window.FB) {
    initializeFacebookSdk();
    return Promise.resolve();
  }

  // Já existe uma tentativa de carregamento em andamento
  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise<void>((resolve, reject) => {
    let settled = false;

    const resolveOnce = () => {
      if (settled) {
        return;
      }

      settled = true;

      try {
        initializeFacebookSdk();
        resolve();
      } catch (error) {
        sdkPromise = null;
        reject(error);
      }
    };

    const rejectOnce = (error: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      sdkPromise = null;
      reject(error);
    };

    // O Facebook chama essa função quando termina de carregar o SDK.
    window.fbAsyncInit = resolveOnce;

    // Pode ter sido carregado entre as verificações acima.
    if (window.FB) {
      resolveOnce();
      return;
    }

    const existingScript = document.getElementById('facebook-jssdk');

    if (existingScript) {
      /*
       * Se chegamos aqui, window.FB ainda não existe e não há
       * nenhum carregamento em andamento (sdkPromise é null) — ou
       * seja, essa tag é órfã de uma tentativa anterior que falhou
       * (script.onerror). Removemos e recriamos para não deixar
       * essa Promise pendurada para sempre.
       */
      existingScript.remove();
    }

    const script = document.createElement('script');

    script.id = 'facebook-jssdk';
    script.src = FB_SDK_SRC;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      rejectOnce(new Error('Falha ao carregar o SDK do Facebook.'));
    };

    document.head.appendChild(script);
  });

  return sdkPromise;
}

/**
 * Abre o popup de login do Facebook e devolve o access token
 * do usuário.
 *
 * O backend deve ser responsável por validar/trocar o token
 * e realizar as operações necessárias na Graph API.
 */
export async function connectFacebookAccount(): Promise<string> {
  await loadFacebookSdk();

  if (!window.FB) {
    throw new Error('SDK do Facebook não está disponível.');
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    /*
     * O callback do FB.login() depende de um bridge via cookies/postMessage
     * entre connect.facebook.net e essa página. Com bloqueio de cookies de
     * terceiros (Safari, Chrome em rollout), o usuário pode concluir o
     * popup e o callback nunca disparar. Sem esse timeout, a Promise fica
     * pendurada para sempre, sem erro.
     */
    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      reject(
        new Error(
          'O Facebook não respondeu ao login. Ative os cookies de terceiros nas configurações do navegador e tente novamente.',
        ),
      );
    }, FB_LOGIN_TIMEOUT_MS);

    window.FB!.login(
      (response) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeoutId);

        if (response.status === 'connected' && response.authResponse) {
          resolve(response.authResponse.accessToken);
          return;
        }

        reject(new Error('Login com o Facebook cancelado ou não autorizado.'));
      },
      {
        scope: FB_LOGIN_SCOPES,
        return_scopes: true,
      },
    );
  });
}
