import { createFileRoute } from '@tanstack/react-router';
import { MdOutlineGroup } from 'react-icons/md';

export const Route = createFileRoute('/company/$companyId/team')({
  component: CompanyTeam,
});

function CompanyTeam() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-text">Equipe</h1>
        <p className="mt-1.5 text-[13px] text-text-sub">
          Quem está trabalhando na sua conta.
        </p>
      </div>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center">
        <MdOutlineGroup size={40} className="text-text-muted" />
        <div>
          <p className="text-[14px] font-semibold text-text-sub">Em breve</p>
          <p className="mt-0.5 text-[12px] text-text-muted">
            A visualização da equipe estará disponível em breve.
          </p>
        </div>
      </div>
    </div>
  );
}
