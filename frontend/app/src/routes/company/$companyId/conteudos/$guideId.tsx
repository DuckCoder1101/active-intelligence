import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { MdArrowBack } from 'react-icons/md';

import { GuideContentView } from '@/components/library/guide-content-view.component';
import { assignedGuideQueryOptions } from '@/queries/library.queries';

export const Route = createFileRoute(
  '/company/$companyId/conteudos/$guideId',
)({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      assignedGuideQueryOptions(params.companyId, params.guideId),
    ),
  component: CompanyContentDetail,
  ssr: false,
});

function CompanyContentDetail() {
  const { companyId, guideId } = Route.useParams();
  const { data: guide } = useSuspenseQuery(
    assignedGuideQueryOptions(companyId, guideId),
  );

  return (
    <div className="p-4 sm:p-6">
      <Link
        to="/company/$companyId/conteudos"
        params={{ companyId }}
        className="mb-4 flex w-fit items-center gap-1.5 text-[12px] font-semibold text-text-sub transition-colors hover:text-text"
      >
        <MdArrowBack size={14} />
        Voltar para Conteúdos
      </Link>

      <GuideContentView guide={guide} />
    </div>
  );
}
