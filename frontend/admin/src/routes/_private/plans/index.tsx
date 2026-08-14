import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { MdAdd } from 'react-icons/md';

import { PlanModal } from '@/components/plans/plan-modal.component';
import { PlansTable } from '@/components/plans/plans-table.component';
import { ListToolbar } from '@/components/ui/list-toolbar.component';
import { AdminPageContainer } from '@/components/ui/page-container.component';
import type { Plan } from '@/models/plan.model';
import { plansQueryOptions } from '@/queries/plan.queries';

export const Route = createFileRoute('/_private/plans/')({
  ssr: false,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(plansQueryOptions()),
  component: PlansPage,
});

function PlansPage() {
  const { data: plans } = useSuspenseQuery(plansQueryOptions());
  const [search, setSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);

  const filtered = (() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return plans;
    }
    return plans.filter((p) => p.name.toLowerCase().includes(term));
  })();

  const openNew = () => {
    setSelectedPlan(undefined);
    setShowModal(true);
  };

  const openPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  return (
    <AdminPageContainer>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text sm:text-4xl">
            Planos
          </h1>
          <p className="mt-2 text-[13px] text-text-sub sm:text-[14px]">
            Nome, cobrança, valor, funcionalidades e limite de tarefas de cada plano.
          </p>
        </div>
        <button
          onClick={openNew}
          className="btn-primary shrink-0 px-4 py-2.5"
        >
          <MdAdd size={18} />
          Novo plano
        </button>
      </div>

      <ListToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome..."
      />

      <PlansTable plans={filtered} isLoading={false} onSelect={openPlan} />

      {showModal && (
        <PlanModal
          plan={selectedPlan}
          onClose={() => setShowModal(false)}
          onSaved={() => setShowModal(false)}
          onDeleted={() => setShowModal(false)}
        />
      )}
    </AdminPageContainer>
  );
}
