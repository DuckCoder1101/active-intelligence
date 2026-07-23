import { MdOutlineDescription, MdOutlineLink } from 'react-icons/md';

import { Badge } from '@/components/ui/badge.component';
import type { GuideContent } from '@/models/guide.model';

interface GuideContentViewProps {
  guide: GuideContent;
}

// Layout de leitura da página pública (/g/$guideId) — mesmo componente do
// Portal do Cliente (frontend/app), sem nada de admin (sem prompt de
// roteiro, sem lista de clientes).
export function GuideContentView({ guide }: GuideContentViewProps) {
  const tags = [
    ...guide.intentTags,
    ...guide.platformTags,
    ...guide.formatTags,
  ];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-black tracking-tight text-text sm:text-3xl">
        {guide.name}
      </h1>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="default">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {(guide.driveUrl || guide.socialUrl) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {guide.driveUrl && (
            <a
              href={guide.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[13px] font-semibold text-orange hover:underline"
            >
              <MdOutlineLink size={15} />
              Referência no Drive
            </a>
          )}
          {guide.socialUrl && (
            <a
              href={guide.socialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[13px] font-semibold text-orange hover:underline"
            >
              <MdOutlineLink size={15} />
              Referência de vídeo
            </a>
          )}
        </div>
      )}

      <div className="mt-8 space-y-5">
        {guide.scriptGuide.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12">
            <MdOutlineDescription size={24} className="text-text-muted" />
            <p className="text-[13px] text-text-muted">
              Este guia ainda não tem conteúdo.
            </p>
          </div>
        )}
        {guide.scriptGuide.map((block) => (
          <div key={block.id}>
            <h2 className="mb-1.5 text-[13px] font-bold uppercase tracking-wide text-text-sub">
              {block.title || 'Sem título'}
            </h2>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-text">
              {block.content || '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
