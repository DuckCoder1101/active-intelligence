import { createFileRoute } from '@tanstack/react-router';
import { MdOutlineCampaign } from 'react-icons/md';

export const Route = createFileRoute('/company/$companyId/ad-accounts')({
  component: CompanyAdAccounts,
});

function CompanyAdAccounts() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-text">Contas de anúncios</h1>
        <p className="mt-1.5 text-[13px] text-text-sub">
          Métricas e resultados das campanhas.
        </p>
      </div>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center">
        <MdOutlineCampaign size={40} className="text-text-muted" />
        <div>
          <p className="text-[14px] font-semibold text-text-sub">Em breve</p>
          <p className="mt-0.5 text-[12px] text-text-muted">
            As contas de anúncios estarão disponíveis em breve.
          </p>
        </div>
      </div>
    </div>
  );
}
