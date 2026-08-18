import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { MdOutlineCampaign } from 'react-icons/md';
import { toast } from 'react-toastify';

import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { Badge } from '@/components/ui/badge.component';
import { Spinner } from '@/components/ui/spinner.component';
import { formatDateLong } from '@/formatters/formatDate';
import {
  facebookAdsSettingsQueryOptions,
  useConnectFacebookAdsMutation,
  useDisconnectFacebookAdsMutation,
} from '@/queries/meta-integration.queries';
import { connectFacebookAccount } from '@/utils/facebook-sdk.util';

export const Route = createFileRoute(
  '/_private/company/$companyId/integrations',
)({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      facebookAdsSettingsQueryOptions(params.companyId),
    ),
  component: CompanyAdAccounts,
  beforeLoad: ({ context, params }) => {
    // ---- ROTA EM DESENVOLVIMENTO ----
    if (context.sessionUser.accessLevel === 'user') {
      redirect({
        to: '/company/$companyId',
        params: {
          companyId: params.companyId,
        },
      });
    }
  },
  ssr: false,
});

function CompanyAdAccounts() {
  const { companyId } = Route.useParams();
  const { data: settings } = useSuspenseQuery(
    facebookAdsSettingsQueryOptions(companyId),
  );
  const connectFacebookAds = useConnectFacebookAdsMutation(companyId);
  const disconnectFacebookAds = useDisconnectFacebookAdsMutation(companyId);
  const [connecting, setConnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const accessToken = await connectFacebookAccount();
      await connectFacebookAds.mutateAsync(accessToken);
      toast.success('Conta do Facebook Ads conectada!');
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Não foi possível conectar com o Facebook.',
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectFacebookAds.mutateAsync();
      toast.success('Conta do Facebook Ads desconectada.');
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Não foi possível desconectar a conta do Facebook.',
      );
    } finally {
      setShowDisconnectModal(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-text">
          Contas de anúncios
        </h1>
        <p className="mt-1.5 text-[13px] text-text-sub">
          Métricas e resultados das campanhas.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MdOutlineCampaign size={22} className="text-text-muted" />
            <h2 className="text-[14px] font-bold text-text">Facebook Ads</h2>
          </div>
          <Badge variant={settings?.connected ? 'success' : 'default'}>
            {settings?.connected ? 'Conectado' : 'Não conectado'}
          </Badge>
        </div>

        {settings?.connected ? (
          <div className="space-y-1 text-[12px] text-text-sub">
            <p>
              Conta:{' '}
              <span className="font-semibold text-text">
                {settings.fbUserName}
              </span>
            </p>
            <p>
              {settings.pages.length} página(s) do Facebook conectada(s) ·
              Atualizado em {formatDateLong(settings.updatedAt)}
            </p>
          </div>
        ) : (
          <p className="text-[12px] text-text-sub">
            Conecte a conta do Facebook Ads da empresa para receber os leads dos
            formulários de Lead Ads automaticamente no CRM.
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting || connectFacebookAds.isPending}
            className="btn-primary justify-center"
          >
            {(connecting || connectFacebookAds.isPending) && (
              <Spinner size={12} />
            )}
            {settings?.connected ? 'Reconectar conta' : 'Conectar Facebook Ads'}
          </button>

          {settings?.connected && (
            <button
              type="button"
              onClick={() => setShowDisconnectModal(true)}
              disabled={disconnectFacebookAds.isPending}
              className="btn-danger justify-center"
            >
              Desconectar
            </button>
          )}
        </div>
      </div>

      {showDisconnectModal && (
        <ConfirmDeleteModal
          title="Desconectar Facebook Ads"
          description="Isso remove o token de acesso e o vínculo das páginas conectadas. Os leads recebidos até agora não são apagados."
          confirmLabel="Desconectar"
          isDeleting={disconnectFacebookAds.isPending}
          onConfirm={handleDisconnect}
          onCancel={() => setShowDisconnectModal(false)}
        />
      )}
    </div>
  );
}
