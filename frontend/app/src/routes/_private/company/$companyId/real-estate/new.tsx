import { createFileRoute } from '@tanstack/react-router';

import { RealEstateForm } from '@/components/company/real-estate/form.component';

export const Route = createFileRoute(
  '/_private/company/$companyId/real-estate/new',
)({
  component: NewCompanyRealEstate,
  ssr: false,
});

function NewCompanyRealEstate() {
  const { companyId } = Route.useParams();

  return <RealEstateForm companyId={companyId} />;
}
