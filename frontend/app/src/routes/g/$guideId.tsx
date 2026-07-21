import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { GuideContentView } from '@/components/library/guide-content-view.component';
import { publicGuideQueryOptions } from '@/queries/library.queries';

// Rota pública, sem autenticação: link permanente de leitura de um guia de
// conteúdo. Fica fora do layout de /company/$companyId (não herda o guard
// de auth de lá) e não usa CompanySidebar/Topbar — página limpa, só o
// conteúdo do guia.
export const Route = createFileRoute('/g/$guideId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(publicGuideQueryOptions(params.guideId)),
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
