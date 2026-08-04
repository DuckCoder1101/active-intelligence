import { createFileRoute } from '@tanstack/react-router';
import { MdBusiness } from 'react-icons/md';

import { Topbar } from '@/components/layout/topbar.component';

export const Route = createFileRoute('/_private/user/no-company')({
  component: NoCompanySelected,
});

function NoCompanySelected() {
  return (
    <div className="min-h-screen bg-bg">
      <Topbar />
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange/10">
          <MdBusiness size={28} className="text-orange" />
        </div>
        <div>
          <h2 className="text-[18px] font-black tracking-tight text-text">
            Nenhuma empresa selecionada
          </h2>
          <p className="mt-1 text-[13px] text-text-sub">
            Acesse pelo link enviado pela sua empresa, ou entre em contato com
            o administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
