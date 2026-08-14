import { useSuspenseQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { Badge } from '@/components/ui/badge.component';
import { FormSelect } from '@/components/ui/form-select.component';
import { Spinner } from '@/components/ui/spinner.component';
import { formatDateLong } from '@/formatters/formatDate';
import {
  INTEGRATION_ENVIRONMENT_LABELS,
  INTEGRATION_ENVIRONMENTS,
} from '@/models/finance.model';
import type { IntegrationEnvironment } from '@/models/finance.model';
import {
  asaasSettingsQueryOptions,
  useSaveAsaasSettingsMutation,
} from '@/queries/finance.queries';

interface FormValues {
  environment: '' | IntegrationEnvironment;
}

export function IntegrationsSettingsPanel() {
  const { data: asaasSettings } = useSuspenseQuery(asaasSettingsQueryOptions());
  const saveAsaasSettings = useSaveAsaasSettingsMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { environment: asaasSettings.environment ?? 'sandbox' },
  });

  const onSubmit = (values: FormValues) => {
    saveAsaasSettings.mutate(
      { environment: values.environment as IntegrationEnvironment },
      {
        onSuccess: () => {
          toast.success('Configuração do Asaas salva!');
        },
      },
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-4">
        <div>
          <h1 className="text-[18px] font-bold text-text">Integrações</h1>
          <p className="mt-0.5 text-[12px] text-text-sub">
            Credenciais de integrações externas usadas pelo sistema.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-sm space-y-4 rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-text">Asaas</h2>
            <Badge variant={asaasSettings.configured ? 'success' : 'default'}>
              {asaasSettings.configured ? 'Configurado' : 'Não configurado'}
            </Badge>
          </div>

          {asaasSettings.configured && asaasSettings.updatedAt && (
            <p className="text-[11px] text-text-muted">
              Ambiente atual: {INTEGRATION_ENVIRONMENT_LABELS[asaasSettings.environment!]}
              {' · '}
              Atualizado em {formatDateLong(asaasSettings.updatedAt)}
            </p>
          )}

          <p className="text-[11px] text-text-muted">
            A chave de API é configurada via variável de ambiente do servidor
            (ASAAS_API_KEY) e não pode ser editada por aqui.
          </p>

          <Controller
            name="environment"
            control={control}
            rules={{ required: 'Ambiente obrigatório' }}
            render={({ field }) => (
              <FormSelect
                label="Ambiente *"
                error={errors.environment?.message}
                {...field}
              >
                {INTEGRATION_ENVIRONMENTS.map((env) => (
                  <option key={env} value={env}>
                    {INTEGRATION_ENVIRONMENT_LABELS[env]}
                  </option>
                ))}
              </FormSelect>
            )}
          />

          <button
            type="submit"
            disabled={saveAsaasSettings.isPending}
            className="btn-primary w-full justify-center"
          >
            {saveAsaasSettings.isPending && <Spinner size={12} />}
            Salvar
          </button>
        </form>
      </div>
    </div>
  );
}
