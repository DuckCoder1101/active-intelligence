import { createFileRoute } from '@tanstack/react-router';

import { useAuth } from '@/contexts/auth.context';

export const Route = createFileRoute('/company/$companyId/')({
  component: CompanyDashboard,
});

function CompanyDashboard() {
  const { userProfile } = useAuth();
  const firstName = userProfile?.name.split(' ')[0] ?? '';

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-text">
          Olá{firstName ? ', ' : ''}
          {firstName}
        </h1>
        <p className="mt-1.5 text-[13px] text-text-sub">
          Bem-vindo ao seu portal. Aqui você acompanha tudo sobre a sua empresa.
        </p>
      </div>
    </div>
  );
}
