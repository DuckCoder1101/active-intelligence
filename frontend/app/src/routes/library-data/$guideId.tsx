import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { GuideContentView } from '@/components/library/guide-content-view.component';
import { publicGuideQueryOptions } from '@/queries/library.queries';

export const Route = createFileRoute('/library-data/$guideId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      publicGuideQueryOptions(params.guideId),
    ),
  component: PublicGuidePage,
  ssr: false,
});

function PublicGuidePage() {
  const { guideId } = Route.useParams();
  const { data: guide } = useSuspenseQuery(publicGuideQueryOptions(guideId));

  return (
    <div className="min-h-screen bg-bg px-4 py-10 sm:py-16">
      <GuideContentView guide={guide} />
    </div>
  );
}
