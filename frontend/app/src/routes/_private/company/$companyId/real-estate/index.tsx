import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { MdAdd, MdSearch } from 'react-icons/md';

import { ImportExportMenu } from '@/components/company/real-estate/import-export-menu.component';
import { RealEstateList } from '@/components/company/real-estate/list.component';
import { realEstateQueryOptions } from '@/queries/real-estate.queries';

export const Route = createFileRoute(
  '/_private/company/$companyId/real-estate/',
)({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      realEstateQueryOptions(params.companyId),
    ),
  component: CompanyRealEstate,
  ssr: false,
});

function CompanyRealEstate() {
  const { companyId } = Route.useParams();
  const { data: items } = useSuspenseQuery(realEstateQueryOptions(companyId));
  const [search, setSearch] = useState('');

  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = normalizedSearch
    ? items.filter((item) =>
        item.code.toLowerCase().includes(normalizedSearch),
      )
    : items;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tight text-text">
              Imóveis
            </h1>
            <p className="text-[12px] text-text-sub">
              Cadastro de imóveis administrados pela imobiliária.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ImportExportMenu companyId={companyId} />
            <Link
              to="/company/$companyId/real-estate/new"
              params={{ companyId }}
              className="btn-primary"
            >
              <MdAdd size={16} />
              Novo imóvel
            </Link>
          </div>
        </div>

        <div className="relative mb-4 max-w-xs">
          <MdSearch
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código..."
            className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm text-text outline-none placeholder:text-text-muted transition-colors focus:border-primary"
          />
        </div>

        <RealEstateList
          companyId={companyId}
          items={filteredItems}
          emptyMessage={
            normalizedSearch
              ? `Nenhum imóvel encontrado para o código "${search}".`
              : undefined
          }
        />
      </div>
    </div>
  );
}
