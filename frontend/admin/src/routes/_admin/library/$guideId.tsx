import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { DefaultValues } from 'react-hook-form';
import {
  MdArrowBack,
  MdDelete,
  MdOpenInNew,
  MdOutlineLink,
  MdOutlineShare,
} from 'react-icons/md';
import { toast } from 'react-toastify';

import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { SaveBar } from '@/components/layout/save-bar.component';
import { ScriptGuideBlocksField } from '@/components/library/script-guide-blocks.component';
import { FormInput } from '@/components/ui/form-input.component';
import type { MultiSelectOption } from '@/components/ui/multi-select.component';
import { MultiSelect } from '@/components/ui/multi-select.component';
import { AdminPageContainer } from '@/components/ui/page-container.component';
import { Tabs } from '@/components/ui/tabs.component';
import type { Guide, SaveGuideDTO } from '@/models/guide.model';
import { companiesQueryOptions } from '@/queries/company.queries';
import {
  guideQueryOptions,
  guidesQueryOptions,
  libraryKeys,
  useDeleteGuideMutation,
  useSaveGuideMutation,
} from '@/queries/library.queries';
import type { RouteAccessLevel } from '@/types/route-access.type';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';
import {
  buildPublicGuideUrl,
  copyPublicGuideLink,
  sharePublicGuideLink,
} from '@/utils/shareLink.util';

const ROUTE_ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-library'],
};

const FORM_ID = 'guide-detail-form';

const DEFAULT_SCRIPT_PROMPT = `Você é um roteirista especialista em conteúdo para redes sociais.
Com base no guia abaixo, escreva um roteiro completo, pronto para gravação, seguindo o formato e o tom descritos.

Formato do conteúdo:
Sobre o que falar:
Desenvolvimento da ideia:
Exemplos:
CTA:`;

const DEFAULT_SCRIPT_GUIDE = [
  { id: 'formato', title: 'Formato do conteúdo', content: '' },
  { id: 'sobre', title: 'Sobre o que falar', content: '' },
  { id: 'desenvolvimento', title: 'Desenvolvimento da ideia', content: '' },
  { id: 'exemplos', title: 'Exemplos', content: '' },
  { id: 'cta', title: 'CTA', content: '' },
];

type GuideFormValues = Required<
  Pick<
    SaveGuideDTO,
    | 'intentTags'
    | 'platformTags'
    | 'formatTags'
    | 'scriptPrompt'
    | 'scriptGuide'
    | 'assignedCompanyIds'
  >
> &
  Pick<SaveGuideDTO, 'name' | 'driveUrl' | 'socialUrl'>;

function distinctTagOptions(
  guides: Guide[],
  field: 'intentTags' | 'platformTags' | 'formatTags',
  selected: string[],
): MultiSelectOption[] {
  const values = new Set<string>(selected);
  guides.forEach((g) => g[field].forEach((tag) => values.add(tag)));
  return Array.from(values)
    .sort((a, b) => a.localeCompare(b))
    .map((v) => ({ value: v, label: v }));
}

export const Route = createFileRoute('/_admin/library/$guideId')({
  ssr: false,
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ROUTE_ACCESS)) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(guideQueryOptions(params.guideId)),
      context.queryClient.ensureQueryData(guidesQueryOptions()),
      context.queryClient.ensureQueryData(companiesQueryOptions()),
    ]),
  component: GuideDetailPage,
});

function GuideDetailPage() {
  const { guideId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: guide } = useSuspenseQuery(guideQueryOptions(guideId));
  const { data: allGuides } = useSuspenseQuery(guidesQueryOptions());
  const { data: companies } = useSuspenseQuery(companiesQueryOptions());

  const [activeTab, setActiveTab] = useState('detalhes');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const saveGuide = useSaveGuideMutation();
  const deleteGuide = useDeleteGuideMutation();

  const defaultValues: DefaultValues<GuideFormValues> = {
    name: guide.label,
    driveUrl: guide.driveUrl,
    socialUrl: guide.socialUrl,
    intentTags: guide.intentTags,
    platformTags: guide.platformTags,
    formatTags: guide.formatTags,
    scriptPrompt: guide.scriptPrompt || DEFAULT_SCRIPT_PROMPT,
    scriptGuide:
      guide.scriptGuide.length > 0 ? guide.scriptGuide : DEFAULT_SCRIPT_GUIDE,
    assignedCompanyIds: guide.assignedCompanyIds,
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<GuideFormValues>({ defaultValues });

  const intentTags = useWatch({ control, name: 'intentTags' }) ?? [];
  const platformTags = useWatch({ control, name: 'platformTags' }) ?? [];
  const formatTags = useWatch({ control, name: 'formatTags' }) ?? [];
  const scriptPrompt = useWatch({ control, name: 'scriptPrompt' }) ?? '';

  const onSubmit = (values: GuideFormValues) => {
    saveGuide.mutate(
      { guideId, ...values },
      {
        onSuccess: () => {
          toast.success('Guia salvo!');
          reset(values);
          queryClient.invalidateQueries({ queryKey: libraryKeys.all });
        },
      },
    );
  };

  const handleOpenChatGpt = () => {
    const url = `https://chatgpt.com/?q=${encodeURIComponent(scriptPrompt)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteConfirm = () => {
    deleteGuide.mutate(guideId, {
      onSuccess: () => navigate({ to: '/library' }),
    });
  };

  const TABS = [
    { id: 'detalhes', label: 'Detalhes' },
    { id: 'roteiro', label: 'Roteiro' },
  ];

  return (
    <AdminPageContainer>
      <Link
        to="/library"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-sub transition-colors hover:text-text"
      >
        <MdArrowBack size={15} />
        Todos os guias
      </Link>

      <div className="card mt-4 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-text sm:text-2xl">
              {guide.name}
            </h1>
            <p className="mt-1 truncate text-[12px] text-text-muted">
              {buildPublicGuideUrl(guide.guideId)}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => void copyPublicGuideLink(guide.guideId)}
              className="btn-ghost"
            >
              <MdOutlineLink size={15} />
              Copiar link
            </button>
            <button
              type="button"
              onClick={() => void sharePublicGuideLink(guide.guideId, guide.name)}
              className="btn-ghost"
            >
              <MdOutlineShare size={15} />
              Compartilhar
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-danger"
            >
              <MdDelete size={15} />
              Excluir
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        <form
          id={FORM_ID}
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 pb-24"
        >
          {/* Detalhes */}
          <div className={activeTab === 'detalhes' ? 'space-y-4' : 'hidden'}>
            <FormInput
              label="Nome (opcional)"
              placeholder="Ex: Bastidores de obra"
              {...register('name')}
            />

            <div className="form-grid">
              <FormInput
                label="Link do Google Drive"
                type="url"
                placeholder="https://drive.google.com/..."
                {...register('driveUrl')}
              />
              <FormInput
                label="Link de referência (TikTok/Instagram)"
                type="url"
                placeholder="https://www.tiktok.com/..."
                {...register('socialUrl')}
              />
            </div>

            <Controller
              name="intentTags"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label="Intenção do conteúdo"
                  options={distinctTagOptions(allGuides, 'intentTags', intentTags)}
                  selected={field.value}
                  onChange={field.onChange}
                  createLabel="Adicionar intenção"
                  onCreateOption={(name) => Promise.resolve(name.trim())}
                />
              )}
            />

            <Controller
              name="platformTags"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label="Plataforma"
                  options={distinctTagOptions(allGuides, 'platformTags', platformTags)}
                  selected={field.value}
                  onChange={field.onChange}
                  createLabel="Adicionar plataforma"
                  onCreateOption={(name) => Promise.resolve(name.trim())}
                />
              )}
            />

            <Controller
              name="formatTags"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label="Formato de gravação"
                  options={distinctTagOptions(allGuides, 'formatTags', formatTags)}
                  selected={field.value}
                  onChange={field.onChange}
                  createLabel="Adicionar formato"
                  onCreateOption={(name) => Promise.resolve(name.trim())}
                />
              )}
            />

            <Controller
              name="assignedCompanyIds"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label="Clientes com acesso"
                  options={companies.map((c) => ({
                    value: c.companyId,
                    label: c.displayName,
                  }))}
                  selected={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Roteiro */}
          <div className={activeTab === 'roteiro' ? 'space-y-4' : 'hidden'}>
            <FormInput
              as="textarea"
              label="Prompt de roteiro"
              className="min-h-32 resize-none"
              {...register('scriptPrompt')}
            />
            <button
              type="button"
              onClick={handleOpenChatGpt}
              className="flex w-fit items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[12px] font-semibold text-text-sub transition-colors hover:border-orange hover:text-orange"
            >
              <MdOpenInNew size={14} />
              Abrir no ChatGPT
            </button>

            <div className="border-t border-border pt-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
                Guia do roteiro
              </p>
              <Controller
                name="scriptGuide"
                control={control}
                render={({ field }) => (
                  <ScriptGuideBlocksField
                    blocks={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        </form>
      </div>

      <SaveBar
        isDirty={isDirty}
        isSaving={saveGuide.isPending}
        formId={FORM_ID}
        onDiscard={() => reset()}
      />

      {showDeleteConfirm && (
        <ConfirmDeleteModal
          title="Excluir guia"
          description={`Tem certeza que deseja excluir "${guide.name}"? Essa ação não pode ser desfeita.`}
          isDeleting={deleteGuide.isPending}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </AdminPageContainer>
  );
}
