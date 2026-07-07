import { useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { MdAdd } from 'react-icons/md';

import type { FormValues } from './lead-drawer.component';

import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import type { CrmOrigin, CrmTag } from '@/models/lead.model';
import type { UserProfile } from '@/models/user-profile.model';
import {
  useSaveOriginMutation,
  useSaveTagMutation,
} from '@/queries/company-crm.queries';

interface Props {
  companyId: string;
  origins: CrmOrigin[];
  tags: CrmTag[];
  teammates: UserProfile[];
}

export function LeadContactTab({ companyId, origins, tags, teammates }: Props) {
  const [showNewOrigin, setShowNewOrigin] = useState(false);
  const [newOriginName, setNewOriginName] = useState('');
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const saveOrigin = useSaveOriginMutation(companyId);
  const saveTag = useSaveTagMutation(companyId);

  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<FormValues>();

  const originId = useWatch({ control, name: 'originId' });
  const selectedOrigin = origins.find((o) => o.originId === originId);
  const isReferral = selectedOrigin?.name.toLowerCase().includes('indica');

  const handleCreateOrigin = () => {
    if (!newOriginName.trim()) {
      return;
    }
    saveOrigin.mutate(newOriginName.trim(), {
      onSuccess: (created) => {
        setValue('originId', created.originId);
        setNewOriginName('');
        setShowNewOrigin(false);
      },
    });
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      return;
    }
    saveTag.mutate(newTagName.trim(), {
      onSuccess: (created) => {
        setValue('tagIds', [...getValues('tagIds'), created.tagId]);
        setNewTagName('');
        setShowNewTag(false);
      },
    });
  };

  return (
    <div className="space-y-4">
      <FormInput
        label="Nome *"
        error={errors.name?.message}
        {...register('name', { required: 'Nome obrigatório' })}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Telefone *"
          error={errors.phone?.message}
          {...register('phone', { required: 'Telefone obrigatório' })}
        />
        <FormInput label="E-mail" type="email" {...register('email')} />
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
          Origem *
        </p>
        <div className="flex gap-2">
          <FormSelect
            error={errors.originId?.message}
            className="flex-1"
            {...register('originId', { required: 'Origem obrigatória' })}
          >
            <option value="">Selecione...</option>
            {origins.map((o) => (
              <option key={o.originId} value={o.originId}>
                {o.name}
              </option>
            ))}
          </FormSelect>
          <button
            type="button"
            onClick={() => setShowNewOrigin((v) => !v)}
            title="Cadastrar origem"
            className="shrink-0 rounded-md border border-border px-3 text-text-sub transition-colors hover:border-orange hover:text-orange"
          >
            <MdAdd size={16} />
          </button>
        </div>
        {showNewOrigin && (
          <div className="mt-2 flex gap-2">
            <input
              autoFocus
              value={newOriginName}
              onChange={(e) => setNewOriginName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateOrigin()}
              placeholder="Nova origem"
              className="flex-1 rounded-md border border-border bg-bg px-3 py-1.5 text-[13px] text-text outline-none focus:border-orange"
            />
            <button
              type="button"
              onClick={handleCreateOrigin}
              disabled={saveOrigin.isPending}
              className="rounded-md bg-orange px-3 text-[12px] font-semibold text-white"
            >
              Salvar
            </button>
          </div>
        )}
      </div>

      {isReferral && (
        <FormInput label="Indicado por" {...register('referredBy')} />
      )}

      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
          Tags
        </p>
        <Controller
          name="tagIds"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <button
                  key={tag.tagId}
                  type="button"
                  onClick={() =>
                    field.onChange(
                      field.value.includes(tag.tagId)
                        ? field.value.filter((id) => id !== tag.tagId)
                        : [...field.value, tag.tagId],
                    )
                  }
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    field.value.includes(tag.tagId)
                      ? 'bg-orange text-white'
                      : 'bg-bg text-text-sub hover:bg-border'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowNewTag((v) => !v)}
                className="rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] font-semibold text-text-muted hover:border-orange hover:text-orange"
              >
                <MdAdd size={12} className="inline" /> Nova tag
              </button>
            </div>
          )}
        />
        {showNewTag && (
          <div className="mt-2 flex gap-2">
            <input
              autoFocus
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
              placeholder="Nova tag"
              className="flex-1 rounded-md border border-border bg-bg px-3 py-1.5 text-[13px] text-text outline-none focus:border-orange"
            />
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={saveTag.isPending}
              className="rounded-md bg-orange px-3 text-[12px] font-semibold text-white"
            >
              Salvar
            </button>
          </div>
        )}
      </div>

      {teammates.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
            Responsável
          </p>
          <Controller
            name="assignedTo"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-1.5">
                {teammates.map((t) => (
                  <button
                    key={t.uid}
                    type="button"
                    onClick={() =>
                      field.onChange(
                        field.value.includes(t.uid)
                          ? field.value.filter((id) => id !== t.uid)
                          : [...field.value, t.uid],
                      )
                    }
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      field.value.includes(t.uid)
                        ? 'bg-orange text-white'
                        : 'bg-bg text-text-sub hover:bg-border'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
