import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { MdClose } from 'react-icons/md';
import { toast } from 'react-toastify';

import { LeadBusinessTab } from './lead-drawer-business-tab.component';
import { LeadContactTab } from './lead-drawer-contact-tab.component';
import { LeadProfileTab } from './lead-drawer-profile-tab.component';
import { LeadQualificationTab } from './lead-drawer-qualification-tab.component';

import { Spinner } from '@/components/ui/spinner.component';
import { Tabs, type Tab } from '@/components/ui/tabs.component';
import type {
  BusinessType,
  CrmOrigin,
  CrmTag,
  Lead,
  LeadPreference,
  PaymentMethod,
  PropertyType,
  Purpose,
  SaveLeadDTO,
  Temperature,
} from '@/models/lead.model';
import type { UserProfile } from '@/models/user-profile.model';
import { useSaveLeadMutation } from '@/queries/company-crm.queries';

export interface FormValues {
  name: string;
  phone: string;
  email: string;
  originId: string;
  referredBy: string;
  tagIds: string[];
  assignedTo: string[];

  businessType: BusinessType;
  businessTypeOther: string;
  propertyType: PropertyType | '';
  propertyTypeOther: string;
  purpose: Purpose | '';

  city: string;
  state: string;
  neighborhoods: { value: string }[];
  acceptsNearbyNeighborhoods: boolean;
  priceMin: number;
  priceMax: number;
  propertySizeM2: string;
  bedrooms: string;
  suites: string;
  parkingSpots: string;
  floor: string;
  preferences: LeadPreference[];

  paymentMethod: PaymentMethod | '';
  hasApprovedOrSimulatedCredit: boolean;
  decidesAlone: boolean;
  decidesWith: string;
  consultedOtherRealtor: boolean;
  temperature: Temperature | '';
}

export const MAX_PRICE = 1_000_000_000;

const TABS: Tab[] = [
  { id: 'contact', label: 'Contato' },
  { id: 'business', label: 'Negócio' },
  { id: 'profile', label: 'Perfil de busca' },
  { id: 'qualification', label: 'Qualificação' },
];

const TAB_ERROR_FIELDS: Record<string, (keyof FormValues)[]> = {
  contact: ['name', 'phone', 'originId'],
  business: [],
  profile: ['priceMax'],
  qualification: [],
};

function toFormValues(lead?: Lead): FormValues {
  return {
    name: lead?.name ?? '',
    phone: lead?.phone ?? '',
    email: lead?.email ?? '',
    originId: lead?.originId ?? '',
    referredBy: lead?.referredBy ?? '',
    tagIds: lead?.tagIds ?? [],
    assignedTo: lead?.assignedTo ?? [],

    businessType: lead?.businessType ?? 'compra',
    businessTypeOther: lead?.businessTypeOther ?? '',
    propertyType: lead?.propertyType ?? '',
    propertyTypeOther: lead?.propertyTypeOther ?? '',
    purpose: lead?.purpose ?? '',

    city: lead?.city ?? '',
    state: lead?.state ?? '',
    neighborhoods: (lead?.neighborhoods && lead.neighborhoods.length > 0
      ? lead.neighborhoods
      : ['']
    ).map((value) => ({ value })),
    acceptsNearbyNeighborhoods: lead?.acceptsNearbyNeighborhoods ?? false,
    priceMin: lead?.priceMin ?? 0,
    priceMax: lead?.priceMax ?? MAX_PRICE,
    propertySizeM2: lead?.propertySizeM2?.toString() ?? '',
    bedrooms: lead?.bedrooms?.toString() ?? '',
    suites: lead?.suites?.toString() ?? '',
    parkingSpots: lead?.parkingSpots?.toString() ?? '',
    floor: lead?.floor?.toString() ?? '',
    preferences: lead?.preferences ?? [],

    paymentMethod: lead?.paymentMethod ?? '',
    hasApprovedOrSimulatedCredit: lead?.hasApprovedOrSimulatedCredit ?? false,
    decidesAlone: lead?.decidesAlone ?? true,
    decidesWith: lead?.decidesWith ?? '',
    consultedOtherRealtor: lead?.consultedOtherRealtor ?? false,
    temperature: lead?.temperature ?? '',
  };
}

interface LeadDrawerProps {
  companyId: string;
  lead?: Lead;
  origins: CrmOrigin[];
  tags: CrmTag[];
  teammates: UserProfile[];
  onClose: () => void;
  onSaved: (lead: Lead) => void;
}

export function LeadDrawer({
  companyId,
  lead,
  origins,
  tags,
  teammates,
  onClose,
  onSaved,
}: LeadDrawerProps) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  const saveLead = useSaveLeadMutation(companyId);

  const methods = useForm<FormValues>({ defaultValues: toFormValues(lead) });
  const {
    handleSubmit,
    setError,
    formState: { errors },
  } = methods;

  const tabsWithErrors = TABS.map((tab) => ({
    ...tab,
    hasError: TAB_ERROR_FIELDS[tab.id].some((field) => !!errors[field]),
  }));

  const onSubmit = (values: FormValues) => {
    if (values.priceMin > values.priceMax) {
      setError('priceMax', {
        message: 'Valor máximo deve ser maior que o mínimo',
      });
      setActiveTab('profile');
      return;
    }

    const selectedOrigin = origins.find((o) => o.originId === values.originId);
    const isReferral = selectedOrigin?.name.toLowerCase().includes('indica');

    const dto: SaveLeadDTO = {
      companyId,
      leadId: lead?.leadId,
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim() || undefined,
      originId: values.originId,
      referredBy: isReferral
        ? values.referredBy.trim() || undefined
        : undefined,
      tagIds: values.tagIds,
      assignedTo: values.assignedTo,

      businessType: values.businessType,
      businessTypeOther:
        values.businessType === 'outro'
          ? values.businessTypeOther.trim() || undefined
          : undefined,
      propertyType: values.propertyType || undefined,
      propertyTypeOther:
        values.propertyType === 'outro'
          ? values.propertyTypeOther.trim() || undefined
          : undefined,
      purpose: values.purpose || undefined,

      city: values.city.trim() || undefined,
      state: values.state.trim() || undefined,
      neighborhoods: values.neighborhoods
        .map((n) => n.value.trim())
        .filter(Boolean),
      acceptsNearbyNeighborhoods: values.acceptsNearbyNeighborhoods,
      priceMin: values.priceMin,
      priceMax: values.priceMax,
      propertySizeM2: values.propertySizeM2
        ? Number(values.propertySizeM2)
        : undefined,
      bedrooms: values.bedrooms ? Number(values.bedrooms) : undefined,
      suites: values.suites ? Number(values.suites) : undefined,
      parkingSpots: values.parkingSpots
        ? Number(values.parkingSpots)
        : undefined,
      floor: values.floor ? Number(values.floor) : undefined,
      preferences: values.preferences,

      paymentMethod: values.paymentMethod || undefined,
      hasApprovedOrSimulatedCredit: values.hasApprovedOrSimulatedCredit,
      decidesAlone: values.decidesAlone,
      decidesWith: !values.decidesAlone
        ? values.decidesWith.trim() || undefined
        : undefined,
      consultedOtherRealtor: values.consultedOtherRealtor,
      temperature: values.temperature || undefined,
    };

    saveLead.mutate(dto, {
      onSuccess: (saved) => {
        toast.success(lead ? 'Lead atualizado!' : 'Lead cadastrado!');
        onSaved(saved);
        onClose();
      },
    });
  };

  const onInvalid = (invalidErrors: typeof errors) => {
    const firstInvalidTab = TABS.find((tab) =>
      TAB_ERROR_FIELDS[tab.id].some((field) => !!invalidErrors[field]),
    );
    if (firstInvalidTab) {
      setActiveTab(firstInvalidTab.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="modal-backdrop" onClick={onClose} />
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className="fixed inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-hidden bg-card shadow-2xl"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-[15px] font-bold text-text">
              {lead ? 'Editar lead' : 'Novo lead'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-text-muted transition-colors hover:text-text"
            >
              <MdClose size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="shrink-0 border-b border-border px-6 py-3">
            <Tabs
              tabs={tabsWithErrors}
              active={activeTab}
              onChange={setActiveTab}
            />
          </div>

          {/* Scrollable form body */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'contact' && (
              <LeadContactTab
                companyId={companyId}
                origins={origins}
                tags={tags}
                teammates={teammates}
              />
            )}
            {activeTab === 'business' && <LeadBusinessTab />}
            {activeTab === 'profile' && <LeadProfileTab />}
            {activeTab === 'qualification' && <LeadQualificationTab />}
          </div>

          {/* Fixed footer */}
          <div className="flex shrink-0 justify-end gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost-border"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveLead.isPending}
              className="btn-primary"
            >
              {saveLead.isPending && <Spinner size={13} />}
              Salvar
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
