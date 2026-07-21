import { useNavigate } from '@tanstack/react-router';
import { MdOutlineMenuBook, MdOutlineLink, MdOutlineShare } from 'react-icons/md';

import { Badge } from '@/components/ui/badge.component';
import { Spinner } from '@/components/ui/spinner.component';
import type { Guide } from '@/models/guide.model';
import { copyPublicGuideLink, sharePublicGuideLink } from '@/utils/shareLink.util';

interface GuidesTableProps {
  guides: Guide[];
  isLoading: boolean;
}

export function GuidesTable({ guides, isLoading }: GuidesTableProps) {
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="text-orange" />
      </div>
    );
  }

  if (guides.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16">
        <MdOutlineMenuBook size={28} className="text-text-muted" />
        <p className="text-[13px] text-text-muted">
          Nenhum guia de conteúdo cadastrado.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-bg/60">
            {['Nome', 'Tags', 'Clientes', ''].map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-text-sub"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {guides.map((guide) => {
            const tags = [
              ...guide.intentTags,
              ...guide.platformTags,
              ...guide.formatTags,
            ];

            return (
              <tr
                key={guide.guideId}
                onClick={() =>
                  navigate({
                    to: '/library/$guideId',
                    params: { guideId: guide.guideId },
                  })
                }
                className="cursor-pointer transition-colors hover:bg-bg/40"
              >
                <td className="px-4 py-3">
                  <span className="text-[13px] font-semibold text-text">
                    {guide.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {tags.length === 0 && (
                      <span className="text-[12px] text-text-muted">—</span>
                    )}
                    {tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="default">
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 3 && (
                      <Badge variant="default">+{tags.length - 3}</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[13px] text-text-sub">
                    {guide.assignedCompanyIds.length}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      title="Copiar link público"
                      onClick={(e) => {
                        e.stopPropagation();
                        void copyPublicGuideLink(guide.guideId);
                      }}
                      className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg hover:text-text"
                    >
                      <MdOutlineLink size={16} />
                    </button>
                    <button
                      type="button"
                      title="Compartilhar"
                      onClick={(e) => {
                        e.stopPropagation();
                        void sharePublicGuideLink(guide.guideId, guide.name);
                      }}
                      className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg hover:text-text"
                    >
                      <MdOutlineShare size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
