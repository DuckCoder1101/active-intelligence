import { MdOutlineInventory2 } from 'react-icons/md';

import { Badge } from '@/components/ui/badge.component';
import { Spinner } from '@/components/ui/spinner.component';
import { formatCurrency } from '@/formatters/formatCurrency';
import {
  PLAN_BILLING_TYPE_LABELS,
  PLAN_FEATURE_LABELS,
} from '@/models/plan.model';
import type { Plan } from '@/models/plan.model';

interface PlansTableProps {
  plans: Plan[];
  isLoading: boolean;
  onSelect: (plan: Plan) => void;
}

export function PlansTable({ plans, isLoading, onSelect }: PlansTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="text-orange" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16">
        <MdOutlineInventory2 size={28} className="text-text-muted" />
        <p className="text-[13px] text-text-muted">Nenhum plano cadastrado.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-bg/60">
            {['Nome', 'Cobrança', 'Valor', 'Funcionalidades', 'Limite de tarefas'].map(
              (col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-text-sub"
                >
                  {col}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {plans.map((plan) => (
            <tr
              key={plan.planId}
              onClick={() => onSelect(plan)}
              className="cursor-pointer transition-colors hover:bg-bg/40"
            >
              <td className="px-4 py-3">
                <span className="text-[13px] font-semibold text-text">
                  {plan.name}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-[13px] text-text-sub">
                  {PLAN_BILLING_TYPE_LABELS[plan.billingType]}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-[13px] text-text-sub">
                  {formatCurrency(plan.value)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {plan.features.length === 0 && (
                    <span className="text-[12px] text-text-muted">—</span>
                  )}
                  {plan.features.map((feature) => (
                    <Badge key={feature} variant="default">
                      {PLAN_FEATURE_LABELS[feature]}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-[13px] text-text-sub">
                  {plan.taskLimit}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
