import type { DragEvent } from 'react';
import { MdOutlinePhone } from 'react-icons/md';

import { DEAL_STATUS_LABELS, TEMPERATURE_LABELS } from '@/models/lead.model';
import type { CrmTag, Lead } from '@/models/lead.model';

interface LeadCardProps {
  lead: Lead;
  tags: CrmTag[];
  onClick: () => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
}

export function LeadCard({ lead, tags, onClick, onDragStart }: LeadCardProps) {
  const leadTags = tags.filter((t) => lead.tagIds.includes(t.tagId));

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="cursor-grab space-y-2 rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:border-orange/40 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-text">
          {lead.name}
        </p>
        {lead.temperature && (
          <span className="shrink-0 text-[13px]">
            {TEMPERATURE_LABELS[lead.temperature].split(' ')[0]}
          </span>
        )}
      </div>

      {lead.dealStatus !== 'aberto' && (
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
            lead.dealStatus === 'vendido'
              ? 'bg-success/10 text-success'
              : 'bg-danger/10 text-danger'
          }`}
        >
          {DEAL_STATUS_LABELS[lead.dealStatus]}
        </span>
      )}

      <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
        <MdOutlinePhone size={12} />
        {lead.phone}
      </div>

      {leadTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {leadTags.map((tag) => (
            <span
              key={tag.tagId}
              className="rounded-full bg-orange/10 px-2 py-0.5 text-[10px] font-semibold text-orange"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
