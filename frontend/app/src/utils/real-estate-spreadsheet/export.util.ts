import {
  COLUMN_KEYS,
  buildSheetData,
  type ColumnKey,
  type RealEstateSheetData,
} from './headers.util';

import {
  DOCUMENTATION_STATUS_LABELS,
  FURNISHINGS_LABELS,
  PROPERTY_FEATURE_LABELS,
  PROPERTY_TYPE_LABELS,
  REAL_ESTATE_CONDITION_LABELS,
  REAL_ESTATE_PURPOSE_LABELS,
  REAL_ESTATE_STATUS_LABELS,
  type RealEstate,
} from '@/models/real-estate.model';

function getExportValue(item: RealEstate, key: ColumnKey): string | number {
  switch (key) {
    case 'code':
      return item.code;
    case 'title':
      return item.title ?? '';
    case 'description':
      return item.description ?? '';
    case 'propertyType':
      return PROPERTY_TYPE_LABELS[item.propertyType];
    case 'propertyTypeOther':
      return item.propertyTypeOther ?? '';
    case 'purposes':
      return item.purposes.map((p) => REAL_ESTATE_PURPOSE_LABELS[p]).join('; ');
    case 'internalNotes':
      return item.internalNotes ?? '';
    case 'ownerName':
      return item.owner.name;
    case 'ownerPhone':
      return item.owner.phone;
    case 'ownerEmail':
      return item.owner.email ?? '';
    case 'address':
      return item.address;
    case 'addressNumber':
      return item.addressNumber ?? '';
    case 'complement':
      return item.complement ?? '';
    case 'neighborhood':
      return item.neighborhood;
    case 'region':
      return item.region ?? '';
    case 'city':
      return item.city;
    case 'state':
      return item.state;
    case 'zipCode':
      return item.zipCode ?? '';
    case 'block':
      return item.block ?? '';
    case 'condominiumName':
      return item.condominium?.condominiumName ?? '';
    case 'condominiumFee':
      return item.condominium?.condominiumFee ?? '';
    case 'usableAreaM2':
      return item.usableAreaM2 ?? '';
    case 'totalAreaM2':
      return item.totalAreaM2 ?? '';
    case 'bedrooms':
      return item.bedrooms ?? '';
    case 'suites':
      return item.suites ?? '';
    case 'bathrooms':
      return item.bathrooms ?? '';
    case 'parkingSpots':
      return item.parkingSpots ?? '';
    case 'floor':
      return item.floor ?? '';
    case 'buildingFloors':
      return item.buildingFloors ?? '';
    case 'condition':
      return item.condition ? REAL_ESTATE_CONDITION_LABELS[item.condition] : '';
    case 'furnishings':
      return FURNISHINGS_LABELS[item.furnishings];
    case 'salePrice':
      return item.salePrice ?? '';
    case 'rentPrice':
      return item.rentPrice ?? '';
    case 'iptuValue':
      return item.iptuValue ?? '';
    case 'acceptsFinancing':
      return item.acceptsFinancing ? 'Sim' : 'Não';
    case 'acceptsExchange':
      return item.acceptsExchange ? 'Sim' : 'Não';
    case 'negotiable':
      return item.negotiable ? 'Sim' : 'Não';
    case 'features':
      return item.features.map((f) => PROPERTY_FEATURE_LABELS[f]).join('; ');
    case 'status':
      return REAL_ESTATE_STATUS_LABELS[item.status];
    case 'visibleOnWebsite':
      return item.visibleOnWebsite ? 'Sim' : 'Não';
    case 'featured':
      return item.featured ? 'Sim' : 'Não';
    case 'publicDescription':
      return item.publicDescription ?? '';
    case 'portals':
      return (item.portals ?? []).join('; ');
    case 'registryNumber':
      return item.registryNumber ?? '';
    case 'documentationStatus':
      return item.documentationStatus
        ? DOCUMENTATION_STATUS_LABELS[item.documentationStatus]
        : '';
    case 'iptuNumber':
      return item.iptuNumber ?? '';
    default:
      return '';
  }
}

export function buildExportSheetData(items: RealEstate[]): RealEstateSheetData {
  const dataRows = items.map((item) =>
    COLUMN_KEYS.map((key) => getExportValue(item, key)),
  );
  return buildSheetData(dataRows);
}
