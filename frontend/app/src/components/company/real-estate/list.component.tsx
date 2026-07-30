import { Link } from '@tanstack/react-router';
import { MdOutlineApartment, MdOutlineLocationOn } from 'react-icons/md';

import { Badge } from '@/components/ui/badge.component';
import { formatCurrency } from '@/formatters/formatCurrency';
import {
  PROPERTY_TYPE_LABELS,
  REAL_ESTATE_STATUS_LABELS,
  type RealEstate,
  type RealEstateStatus,
} from '@/models/real-estate.model';

const STATUS_BADGE_VARIANT: Record<
  RealEstateStatus,
  'success' | 'orange' | 'purple' | 'teal' | 'default'
> = {
  disponivel: 'success',
  reservado: 'orange',
  vendido: 'purple',
  alugado: 'teal',
  inativo: 'default',
};

interface RealEstateListProps {
  companyId: string;
  items: RealEstate[];
  emptyMessage?: string;
}

export function RealEstateList({
  companyId,
  items,
  emptyMessage = 'Nenhum imóvel cadastrado ainda.',
}: RealEstateListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16">
        <MdOutlineApartment size={28} className="text-text-muted" />
        <p className="text-[13px] text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const price = item.salePrice ?? item.rentPrice;

        return (
          <Link
            key={item.realEstateId}
            to="/company/$companyId/real-estate/$realEstateId"
            params={{ companyId, realEstateId: item.realEstateId }}
            className="flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition-colors hover:border-orange/40"
          >
            <div className="aspect-video w-full overflow-hidden bg-bg">
              {item.coverPhotoUrl ? (
                <img
                  src={item.coverPhotoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <MdOutlineApartment size={28} className="text-text-muted" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md bg-bg px-1.5 py-0.5 font-mono text-[12px] font-bold text-text">
                  {item.code}
                </span>
                <Badge variant={STATUS_BADGE_VARIANT[item.status]}>
                  {REAL_ESTATE_STATUS_LABELS[item.status]}
                </Badge>
              </div>
              <p className="truncate text-[13px] font-semibold text-text">
                {item.title || PROPERTY_TYPE_LABELS[item.propertyType]}
              </p>
              <div className="flex items-center gap-1 text-[12px] text-text-sub">
                <MdOutlineLocationOn size={14} className="shrink-0" />
                <span className="truncate">
                  {item.neighborhood}, {item.city}
                </span>
              </div>
              {price !== undefined && (
                <p className="mt-1 text-[14px] font-bold text-text">
                  {formatCurrency(price)}
                  {item.rentPrice && !item.salePrice && (
                    <span className="text-[11px] font-normal text-text-muted">
                      /mês
                    </span>
                  )}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
