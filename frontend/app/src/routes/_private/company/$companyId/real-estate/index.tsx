import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { MdAdd } from 'react-icons/md';

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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tight text-text">
              Imóveis
            </h1>
            <p className="text-[12px] text-text-sub">
              Cadastro de imóveis administrados pela imobiliária.
            </p>
          </div>
          <Link
            to="/company/$companyId/real-estate/new"
            params={{ companyId }}
            className="btn-primary"
          >
            <MdAdd size={16} />
            Novo imóvel
          </Link>
        </div>

        <RealEstateList companyId={companyId} items={items} />
      </div>
    </div>
  );
}
