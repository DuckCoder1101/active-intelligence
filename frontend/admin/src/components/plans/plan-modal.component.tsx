import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { MdClose, MdDelete } from 'react-icons/md';
import { toast } from 'react-toastify';

import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import { MoneyInput } from '@/components/ui/money-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import {
  PLAN_BILLING_TYPES,
  PLAN_BILLING_TYPE_LABELS,
  PLAN_FEATURES,
  PLAN_FEATURE_LABELS,
} from '@/models/plan.model';
import type {
  Plan,
  PlanBillingType,
  PlanFeature,
  SavePlanDTO,
} from '@/models/plan.model';
import { useDeletePlanMutation, useSavePlanMutation } from '@/queries/plan.queries';

interface FormValues {
  name: string;
  billingType: '' | PlanBillingType;
  value: number | '';
  features: PlanFeature[];
  taskLimit: number | '';
}

function defaultValues(plan?: Plan): FormValues {
  return {
    name: plan?.name ?? '',
    billingType: plan?.billingType ?? '',
    value: plan?.value ?? '',
    features: plan?.features ?? [],
    taskLimit: plan?.taskLimit ?? '',
  };
}

interface Props {
  plan?: Plan;
  onClose: () => void;
  onSaved: (plan: Plan) => void;
  onDeleted: (planId: string) => void;
}

export function PlanModal({ plan, onClose, onSaved, onDeleted }: Props) {
  const isEditing = !!plan;
  const savePlan = useSavePlanMutation();
  const deletePlan = useDeletePlanMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: defaultValues(plan) });

  const onSubmit = (values: FormValues) => {
    const dto: SavePlanDTO = {
      ...(plan?.planId ? { planId: plan.planId } : {}),
      name: values.name.trim(),
      billingType: values.billingType as PlanBillingType,
      value: Number(values.value),
      features: values.features,
      taskLimit: Number(values.taskLimit),
    };

    savePlan.mutate(dto, {
      onSuccess: (saved) => {
        toast.success(isEditing ? 'Plano atualizado!' : 'Plano criado!');
        onSaved(saved);
      },
    });
  };

  const handleDelete = () => {
    if (!plan) {
      return;
    }
    deletePlan.mutate(plan.planId, {
      onSuccess: () => {
        toast.success('Plano excluído!');
        onDeleted(plan.planId);
      },
    });
  };

  return (
    <>
      <div
        className="modal-overlay bg-black/50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-[15px] font-bold text-text">
              {isEditing ? 'Detalhes do plano' : 'Novo plano'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-text-muted transition-colors hover:text-text"
            >
              <MdClose size={20} />
            </button>
          </div>

          {/* Body */}
          <form
            id="plan-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 space-y-4 overflow-y-auto p-6"
          >
            <FormInput
              label="Nome *"
              placeholder="Ex.: Plano Essencial"
              error={errors.name?.message}
              {...register('name', { required: 'Nome obrigatório' })}
            />

            <div className="form-grid">
              <Controller
                name="billingType"
                control={control}
                rules={{ required: 'Tipo de cobrança obrigatório' }}
                render={({ field }) => (
                  <FormSelect
                    label="Tipo de cobrança *"
                    error={errors.billingType?.message}
                    {...field}
                  >
                    <option value="">Selecione...</option>
                    {PLAN_BILLING_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {PLAN_BILLING_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </FormSelect>
                )}
              />

              <Controller
                name="value"
                control={control}
                rules={{ required: 'Valor obrigatório' }}
                render={({ field }) => (
                  <MoneyInput
                    label="Valor (R$) *"
                    error={errors.value?.message}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>

            <FormInput
              label="Limite de envio de tarefas *"
              type="number"
              min={0}
              error={errors.taskLimit?.message}
              {...register('taskLimit', {
                required: 'Limite obrigatório',
                valueAsNumber: true,
                min: { value: 0, message: 'Não pode ser negativo' },
              })}
            />

            <Controller
              name="features"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
                    Funcionalidades incluídas
                  </span>
                  <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-card p-3">
                    {PLAN_FEATURES.map((feature) => (
                      <label
                        key={feature}
                        className="flex items-center gap-2 text-[13px] text-text"
                      >
                        <input
                          type="checkbox"
                          checked={field.value.includes(feature)}
                          onChange={(e) => {
                            field.onChange(
                              e.target.checked
                                ? [...field.value, feature]
                                : field.value.filter((f) => f !== feature),
                            );
                          }}
                          className="h-4 w-4 shrink-0 rounded border-border accent-orange"
                        />
                        {PLAN_FEATURE_LABELS[feature]}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            />
          </form>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn-danger"
                >
                  <MdDelete size={15} />
                  Excluir
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-ghost-border">
                Cancelar
              </button>
              <button
                type="submit"
                form="plan-form"
                disabled={savePlan.isPending}
                className="btn-primary"
              >
                {savePlan.isPending && <Spinner size={12} />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && plan && (
        <ConfirmDeleteModal
          title="Excluir plano"
          description={`Excluir "${plan.name}"? Esta ação não pode ser desfeita.`}
          isDeleting={deletePlan.isPending}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
