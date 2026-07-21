import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { MdOutlineMenuBook, MdChevronRight } from 'react-icons/md';

import { Badge } from '@/components/ui/badge.component';
import { assignedGuidesQueryOptions } from '@/queries/library.queries';

export const Route = createFileRoute('/company/$companyId/conteudos/')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      assignedGuidesQueryOptions(params.companyId),
    ),
  component: CompanyContents,
  ssr: false,
});

function CompanyContents() {
  const { companyId } = Route.useParams();
  const { data: guides } = useSuspenseQuery(
    assignedGuidesQueryOptions(companyId),
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-black tracking-tight text-text">
          Conteúdos
        </h1>
        <p className="text-[12px] text-text-sub">
          Guias de conteúdo disponíveis para sua empresa.
        </p>
      </div>

      {guides.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16">
          <MdOutlineMenuBook size={28} className="text-text-muted" />
          <p className="text-[13px] text-text-muted">
            Nenhum guia de conteúdo disponível ainda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => {
            const tags = [
              ...guide.intentTags,
              ...guide.platformTags,
              ...guide.formatTags,
            ];

            return (
              <Link
                key={guide.guideId}
                to="/company/$companyId/conteudos/$guideId"
                params={{ companyId, guideId: guide.guideId }}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-orange/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-text">
                    {guide.name}
                  </p>
                  {tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="default">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <MdChevronRight size={18} className="shrink-0 text-text-muted" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
