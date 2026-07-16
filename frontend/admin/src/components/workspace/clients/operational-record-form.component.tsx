import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import { PasswordInput } from '@/components/ui/password-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import { formatDateLong } from '@/formatters/formatDate';
import type { AdminProfile } from '@/models/admin.model';
import type { CompanyOperationalRecord } from '@/models/company-operational.model';
import { useSaveOperationalRecordMutation } from '@/queries/company.queries';

const RESPONSIBLE_AREAS = [
  { key: 'cronograma', label: 'Cronograma' },
  { key: 'campanhas', label: 'Campanhas' },
  { key: 'cs', label: 'CS & Satisfação' },
] as const;

interface OperationalFormData {
  driveUrl: string;
  metaAdsAccountId: string;
  metaApiKey: string;
  responsibleUids: {
    cronograma: string;
    campanhas: string;
    cs: string;
  };
}

interface OperationalRecordFormProps {
  record: CompanyOperationalRecord;
  admins: AdminProfile[];
}

export function OperationalRecordForm({
  record,
  admins,
}: OperationalRecordFormProps) {
  const saveRecord = useSaveOperationalRecordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OperationalFormData>({
    defaultValues: {
      driveUrl: record.driveUrl ?? '',
      metaAdsAccountId: record.metaAdsAccountId ?? '',
      metaApiKey: '',
      responsibleUids: {
        cronograma: record.responsibleUids?.cronograma ?? '',
        campanhas: record.responsibleUids?.campanhas ?? '',
        cs: record.responsibleUids?.cs ?? '',
      },
    },
  });

  const updatedByName = admins.find((a) => a.uid === record.updatedBy)?.name;

  async function onSubmit(data: OperationalFormData) {
    await saveRecord.mutateAsync({
      companyId: record.companyId,
      driveUrl: data.driveUrl || undefined,
      metaAdsAccountId: data.metaAdsAccountId || undefined,
      // vazio = não mexer na chave já salva (merge no backend)
      metaApiKey: data.metaApiKey || undefined,
      responsibleUids: {
        cronograma: data.responsibleUids.cronograma || undefined,
        campanhas: data.responsibleUids.campanhas || undefined,
        cs: data.responsibleUids.cs || undefined,
      },
    });
    toast.success('Registro operacional salvo!');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Plataformas
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            label="Link do Drive"
            type="url"
            placeholder="https://drive.google.com/..."
            error={errors.driveUrl?.message}
            {...register('driveUrl', {
              validate: (value) =>
                !value ||
                /^https?:\/\/.+/.test(value) ||
                'Link do Drive inválido',
            })}
          />

          <FormInput
            label="Conta Meta Ads (ID)"
            type="text"
            placeholder="act_1234567890"
            error={errors.metaAdsAccountId?.message}
            {...register('metaAdsAccountId')}
          />

          <PasswordInput
            label="Chave da API Meta"
            placeholder={
              record.hasMetaApiKey
                ? '•••••••• (já configurada — preencha para substituir)'
                : 'Cole a chave da API'
            }
            autoComplete="off"
            error={errors.metaApiKey?.message}
            {...register('metaApiKey')}
          />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Responsáveis por área
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {RESPONSIBLE_AREAS.map((area) => (
            <FormSelect
              key={area.key}
              label={area.label}
              {...register(`responsibleUids.${area.key}`)}
            >
              <option value="">Sem responsável</option>
              {admins.map((admin) => (
                <option key={admin.uid} value={admin.uid}>
                  {admin.name}
                </option>
              ))}
            </FormSelect>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-[11px] text-text-muted">
          {record.updatedAt > 0
            ? `Atualizado em ${formatDateLong(record.updatedAt)}${updatedByName ? ` por ${updatedByName}` : ''}`
            : 'Ainda sem registro operacional salvo.'}
        </p>

        <button
          type="submit"
          disabled={saveRecord.isPending}
          className="btn-primary shrink-0"
        >
          {saveRecord.isPending ? (
            <span className="flex items-center gap-2">
              <Spinner size={14} />
              Salvando...
            </span>
          ) : (
            'Salvar'
          )}
        </button>
      </div>
    </form>
  );
}
