import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { MdArrowBack } from 'react-icons/md';

import { RealEstateForm } from '@/components/company/real-estate/form.component';
import { realEstateQueryOptions } from '@/queries/real-estate.queries';

export const Route = createFileRoute(
  '/_private/company/$companyId/real-estate/$realEstateId',
)({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      realEstateQueryOptions(params.companyId),
    ),
  component: CompanyRealEstateDetail,
  ssr: false,
});

function CompanyRealEstateDetail() {
  const { companyId, realEstateId } = Route.useParams();
  const { data: items } = useSuspenseQuery(realEstateQueryOptions(companyId));
  const realEstate = items.find((item) => item.realEstateId === realEstateId);

  if (!realEstate) {
    return (
      <div className="p-4 sm:p-6">
        <Link
          to="/company/$companyId/real-estate"
          params={{ companyId }}
          className="mb-4 flex w-fit items-center gap-1.5 text-[12px] font-semibold text-text-sub transition-colors hover:text-text"
        >
          <MdArrowBack size={14} />
          Voltar para Imóveis
        </Link>
        <p className="text-[13px] text-text-muted">Imóvel não encontrado.</p>
      </div>
    );
  }

  return <RealEstateForm companyId={companyId} realEstate={realEstate} />;
}
