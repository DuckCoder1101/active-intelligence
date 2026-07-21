import { toast } from 'react-toastify';

export function buildPublicGuideUrl(guideId: string): string {
  const appUrl = import.meta.env.VITE_APP_URL ?? 'http://localhost:3001/';
  return `${appUrl.replace(/\/$/, '')}/g/${guideId}`;
}

export async function copyPublicGuideLink(guideId: string): Promise<void> {
  const url = buildPublicGuideUrl(guideId);
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  } catch {
    toast.error('Não foi possível copiar o link.');
  }
}

export async function sharePublicGuideLink(
  guideId: string,
  name: string,
): Promise<void> {
  const url = buildPublicGuideUrl(guideId);

  if (navigator.share) {
    try {
      await navigator.share({ title: name, url });
    } catch {
      // Usuário cancelou o compartilhamento — nada a fazer.
    }
    return;
  }

  await copyPublicGuideLink(guideId);
}
