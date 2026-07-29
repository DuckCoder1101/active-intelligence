import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { MdArrowBack, MdDeleteOutline } from 'react-icons/md';
import { toast } from 'react-toastify';
import { Link, useNavigate } from '@tanstack/react-router';

import { RealEstateDetailsTab } from './details-tab.component';
import { RealEstateDocumentationTab } from './documentation-tab.component';
import { RealEstateFeaturesTab } from './features-tab.component';
import { RealEstateIdentificationTab } from './identification-tab.component';
import { RealEstateLocationTab } from './location-tab.component';
import { RealEstateMediaTab } from './media-tab.component';

import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { Spinner } from '@/components/ui/spinner.component';
import { Tabs, type Tab } from '@/components/ui/tabs.component';
import {
  REAL_ESTATE_STATUS_LABELS,
  REAL_ESTATE_STATUSES,
  type DocumentationStatus,
  type Furnishings,
  type PropertyFeature,
  type PropertyType,
  type RealEstate,
  type RealEstateCondition,
  type RealEstatePurpose,
  type RealEstateStatus,
  type SaveRealEstateDTO,
} from '@/models/real-estate.model';
import {
  useDeleteRealEstateMutation,
  useSaveRealEstateMutation,
  useUpdateRealEstateStatusMutation,
} from '@/queries/real-estate.queries';
import RealEstateService from '@/services/real-estate.service';
import { firstTabWithError } from '@/utils/firstTabWithError.util';

export interface FormValues {
  title: string;
  description: string;
  propertyType: PropertyType | '';
  propertyTypeOther: string;
  purposes: RealEstatePurpose[];
  internalNotes: string;

  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;

  hasCondominium: boolean;
  condominiumName: string;
  condominiumFee: number | '';

  address: string;
  addressNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  region: string;
  state: string;
  zipCode: string;
  block: string;

  usableAreaM2: string;
  totalAreaM2: string;
  bedrooms: string;
  suites: string;
  bathrooms: string;
  parkingSpots: string;
  floor: string;
  buildingFloors: string;
  condition: RealEstateCondition | '';
  furnishings: Furnishings;

  salePrice: number | '';
  rentPrice: number | '';
  iptuValue: number | '';
  acceptsFinancing: boolean;
  acceptsExchange: boolean;
  negotiable: boolean;

  features: PropertyFeature[];

  coverPhotoUrl: string;
  videoUrl: string;
  tourUrl: string;

  registryNumber: string;
  documentationStatus: DocumentationStatus | '';
  iptuNumber: string;

  visibleOnWebsite: boolean;
  featured: boolean;
  publicDescription: string;
}

function computeTabErrors(errors: FieldErrors<FormValues>) {
  return {
    identification: !!(
      errors.title ||
      errors.description ||
      errors.propertyType ||
      errors.propertyTypeOther ||
      errors.purposes ||
      errors.internalNotes ||
      errors.ownerName ||
      errors.ownerPhone ||
      errors.ownerEmail
    ),
    location: !!(
      errors.address ||
      errors.addressNumber ||
      errors.complement ||
      errors.neighborhood ||
      errors.city ||
      errors.region ||
      errors.state ||
      errors.zipCode ||
      errors.hasCondominium ||
      errors.condominiumName ||
      errors.condominiumFee ||
      errors.block
    ),
    details: !!(
      errors.usableAreaM2 ||
      errors.totalAreaM2 ||
      errors.bedrooms ||
      errors.suites ||
      errors.bathrooms ||
      errors.parkingSpots ||
      errors.floor ||
      errors.buildingFloors ||
      errors.condition ||
      errors.furnishings ||
      errors.salePrice ||
      errors.rentPrice ||
      errors.iptuValue ||
      errors.acceptsFinancing ||
      errors.acceptsExchange ||
      errors.negotiable
    ),
    features: !!errors.features,
    media: !!(errors.coverPhotoUrl || errors.videoUrl || errors.tourUrl),
    documentation: !!(
      errors.registryNumber ||
      errors.documentationStatus ||
      errors.iptuNumber ||
      errors.visibleOnWebsite ||
      errors.featured ||
      errors.publicDescription
    ),
  };
}

const TABS: Tab[] = [
  { id: 'identification', label: 'Identificação' },
  { id: 'location', label: 'Localização' },
  { id: 'details', label: 'Características' },
  { id: 'features', label: 'Comodidades' },
  { id: 'media', label: 'Mídia' },
  { id: 'documentation', label: 'Documentação' },
];

function toFormValues(realEstate?: RealEstate): FormValues {
  return {
    title: realEstate?.title ?? '',
    description: realEstate?.description ?? '',
    propertyType: realEstate?.propertyType ?? '',
    propertyTypeOther: realEstate?.propertyTypeOther ?? '',
    purposes: realEstate?.purposes ?? [],
    internalNotes: realEstate?.internalNotes ?? '',

    ownerName: realEstate?.owner.name ?? '',
    ownerPhone: realEstate?.owner.phone ?? '',
    ownerEmail: realEstate?.owner.email ?? '',

    hasCondominium: !!realEstate?.condominium,
    condominiumName: realEstate?.condominium?.condominiumName ?? '',
    condominiumFee: realEstate?.condominium?.condominiumFee ?? '',

    address: realEstate?.address ?? '',
    addressNumber: realEstate?.addressNumber ?? '',
    complement: realEstate?.complement ?? '',
    neighborhood: realEstate?.neighborhood ?? '',
    city: realEstate?.city ?? '',
    region: realEstate?.region ?? '',
    state: realEstate?.state ?? '',
    zipCode: realEstate?.zipCode ?? '',
    block: realEstate?.block ?? '',

    usableAreaM2: realEstate?.usableAreaM2?.toString() ?? '',
    totalAreaM2: realEstate?.totalAreaM2?.toString() ?? '',
    bedrooms: realEstate?.bedrooms?.toString() ?? '',
    suites: realEstate?.suites?.toString() ?? '',
    bathrooms: realEstate?.bathrooms?.toString() ?? '',
    parkingSpots: realEstate?.parkingSpots?.toString() ?? '',
    floor: realEstate?.floor?.toString() ?? '',
    buildingFloors: realEstate?.buildingFloors?.toString() ?? '',
    condition: realEstate?.condition ?? '',
    furnishings: realEstate?.furnishings ?? 'nao',

    salePrice: realEstate?.salePrice ?? '',
    rentPrice: realEstate?.rentPrice ?? '',
    iptuValue: realEstate?.iptuValue ?? '',
    acceptsFinancing: realEstate?.acceptsFinancing ?? false,
    acceptsExchange: realEstate?.acceptsExchange ?? false,
    negotiable: realEstate?.negotiable ?? false,

    features: realEstate?.features ?? [],

    coverPhotoUrl: realEstate?.coverPhotoUrl ?? '',
    videoUrl: realEstate?.videoUrl ?? '',
    tourUrl: realEstate?.tourUrl ?? '',

    registryNumber: realEstate?.registryNumber ?? '',
    documentationStatus: realEstate?.documentationStatus ?? '',
    iptuNumber: realEstate?.iptuNumber ?? '',

    visibleOnWebsite: realEstate?.visibleOnWebsite ?? false,
    featured: realEstate?.featured ?? false,
    publicDescription: realEstate?.publicDescription ?? '',
  };
}

interface RealEstateFormProps {
  companyId: string;
  realEstate?: RealEstate;
}

export function RealEstateForm({ companyId, realEstate }: RealEstateFormProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>(realEstate?.photos ?? []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const saveRealEstate = useSaveRealEstateMutation(companyId);
  const deleteRealEstate = useDeleteRealEstateMutation(companyId);
  const updateStatus = useUpdateRealEstateStatusMutation(companyId);

  const methods = useForm<FormValues>({
    defaultValues: toFormValues(realEstate),
  });
  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  const tabErrors = computeTabErrors(errors);

  const tabsWithErrors = TABS.map((tab) => ({
    ...tab,
    hasError: tabErrors[tab.id as keyof typeof tabErrors],
  }));

  const goToList = () => {
    navigate({ to: '/company/$companyId/real-estate', params: { companyId } });
  };

  const onSubmit = async (values: FormValues) => {
    const dto: SaveRealEstateDTO = {
      companyId,
      realEstateId: realEstate?.realEstateId,
      title: values.title.trim() || undefined,
      description: values.description.trim() || undefined,
      propertyType: values.propertyType as PropertyType,
      propertyTypeOther:
        values.propertyType === 'outro'
          ? values.propertyTypeOther.trim() || undefined
          : undefined,
      purposes: values.purposes,
      internalNotes: values.internalNotes.trim() || undefined,

      owner: {
        name: values.ownerName.trim(),
        phone: values.ownerPhone.trim(),
        email: values.ownerEmail.trim() || undefined,
      },

      condominium: values.hasCondominium
        ? {
            condominiumName: values.condominiumName.trim() || undefined,
            condominiumFee:
              values.condominiumFee === '' ? undefined : values.condominiumFee,
          }
        : undefined,

      address: values.address.trim(),
      addressNumber: values.addressNumber.trim() || undefined,
      complement: values.complement.trim() || undefined,
      neighborhood: values.neighborhood.trim(),
      city: values.city.trim(),
      region: values.region.trim() || undefined,
      state: values.state.trim(),
      zipCode: values.zipCode.trim() || undefined,
      block: values.block.trim() || undefined,

      usableAreaM2: values.usableAreaM2
        ? Number(values.usableAreaM2)
        : undefined,
      totalAreaM2: values.totalAreaM2 ? Number(values.totalAreaM2) : undefined,
      bedrooms: values.bedrooms ? Number(values.bedrooms) : undefined,
      suites: values.suites ? Number(values.suites) : undefined,
      bathrooms: values.bathrooms ? Number(values.bathrooms) : undefined,
      parkingSpots: values.parkingSpots
        ? Number(values.parkingSpots)
        : undefined,
      floor: values.floor ? Number(values.floor) : undefined,
      buildingFloors: values.buildingFloors
        ? Number(values.buildingFloors)
        : undefined,
      condition: values.condition || undefined,
      furnishings: values.furnishings,

      salePrice: values.salePrice === '' ? undefined : values.salePrice,
      rentPrice: values.rentPrice === '' ? undefined : values.rentPrice,
      iptuValue: values.iptuValue === '' ? undefined : values.iptuValue,
      acceptsFinancing: values.acceptsFinancing,
      acceptsExchange: values.acceptsExchange,
      negotiable: values.negotiable,

      features: values.features,

      photos,
      coverPhotoUrl: values.coverPhotoUrl || photos[0] || undefined,
      videoUrl: values.videoUrl.trim() || undefined,
      tourUrl: values.tourUrl.trim() || undefined,

      registryNumber: values.registryNumber.trim() || undefined,
      documentationStatus: values.documentationStatus || undefined,
      iptuNumber: values.iptuNumber.trim() || undefined,

      visibleOnWebsite: values.visibleOnWebsite,
      featured: values.featured,
      publicDescription: values.publicDescription.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      const saved = await saveRealEstate.mutateAsync(dto);

      // Imóvel novo com fotos escolhidas antes do primeiro save: só agora
      // temos o id do documento, então o upload acontece aqui.
      if (!realEstate && pendingFiles.length > 0) {
        const uploaded: string[] = [];
        for (const file of pendingFiles) {
          uploaded.push(
            await RealEstateService.uploadImage(
              companyId,
              saved.realEstateId,
              file,
            ),
          );
        }
        const mergedPhotos = [...photos, ...uploaded];
        await saveRealEstate.mutateAsync({
          ...dto,
          realEstateId: saved.realEstateId,
          photos: mergedPhotos,
          coverPhotoUrl: dto.coverPhotoUrl || mergedPhotos[0],
        });
        setPhotos(mergedPhotos);
        setPendingFiles([]);
      }

      toast.success(realEstate ? 'Imóvel atualizado!' : 'Imóvel cadastrado!');

      if (!realEstate) {
        navigate({
          to: '/company/$companyId/real-estate/$realEstateId',
          params: { companyId, realEstateId: saved.realEstateId },
        });
      }
    } catch {
      toast.error('Não foi possível salvar o imóvel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!realEstate) {
      return;
    }
    deleteRealEstate.mutate(realEstate.realEstateId, {
      onSuccess: () => {
        toast.success('Imóvel excluído!');
        goToList();
      },
    });
  };

  const handleStatusChange = (status: RealEstateStatus) => {
    if (!realEstate || status === realEstate.status) {
      return;
    }
    updateStatus.mutate(
      { realEstateId: realEstate.realEstateId, status },
      {
        onSuccess: () => {
          toast.success(
            `Imóvel marcado como ${REAL_ESTATE_STATUS_LABELS[status]}!`,
          );
        },
      },
    );
  };

  const onInvalid = (invalidErrors: FieldErrors<FormValues>) => {
    const tab = firstTabWithError(computeTabErrors(invalidErrors));
    if (tab) {
      setActiveTab(tab);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl p-4 pb-8 sm:p-6">
          <Link
            to="/company/$companyId/real-estate"
            params={{ companyId }}
            className="mb-4 flex w-fit items-center gap-1.5 text-[12px] font-semibold text-text-sub transition-colors hover:text-text"
          >
            <MdArrowBack size={14} />
            Voltar para Imóveis
          </Link>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
              {/* Header */}
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-text">
                    {realEstate
                      ? realEstate.title || 'Editar imóvel'
                      : 'Novo imóvel'}
                  </h1>
                  {realEstate && (
                    <p className="text-[12px] font-semibold text-text-muted">
                      {realEstate.code}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {realEstate && (
                    <select
                      value={realEstate.status}
                      onChange={(e) =>
                        handleStatusChange(e.target.value as RealEstateStatus)
                      }
                      className="rounded-full border border-border bg-bg px-2.5 py-1 text-[11px] font-bold text-text-muted outline-none"
                    >
                      {REAL_ESTATE_STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {REAL_ESTATE_STATUS_LABELS[value]}
                        </option>
                      ))}
                    </select>
                  )}
                  {realEstate && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      title="Excluir imóvel"
                      className="text-text-muted transition-colors hover:text-danger"
                    >
                      <MdDeleteOutline size={20} />
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-5 rounded-xl border border-border bg-card p-1">
                <Tabs
                  tabs={tabsWithErrors}
                  active={activeTab}
                  onChange={setActiveTab}
                />
              </div>

              {/* Form body — every tab stays mounted (just hidden) so RHF
                  keeps validating/registering fields on tabs the user
                  isn't currently looking at. */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className={activeTab === 'identification' ? '' : 'hidden'}>
                  <RealEstateIdentificationTab />
                </div>
                <div className={activeTab === 'location' ? '' : 'hidden'}>
                  <RealEstateLocationTab />
                </div>
                <div className={activeTab === 'details' ? '' : 'hidden'}>
                  <RealEstateDetailsTab />
                </div>
                <div className={activeTab === 'features' ? '' : 'hidden'}>
                  <RealEstateFeaturesTab />
                </div>
                <div className={activeTab === 'media' ? '' : 'hidden'}>
                  <RealEstateMediaTab
                    companyId={companyId}
                    realEstateId={realEstate?.realEstateId}
                    photos={photos}
                    onPhotosChange={setPhotos}
                    pendingFiles={pendingFiles}
                    onPendingFilesChange={setPendingFiles}
                  />
                </div>
                <div className={activeTab === 'documentation' ? '' : 'hidden'}>
                  <RealEstateDocumentationTab />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={goToList}
                  className="btn-ghost-border"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting && <Spinner size={13} />}
                  Salvar
                </button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmDeleteModal
          title="Excluir imóvel"
          description={`Excluir "${realEstate?.title || realEstate?.code}"? Essa ação não pode ser desfeita.`}
          isDeleting={deleteRealEstate.isPending}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
