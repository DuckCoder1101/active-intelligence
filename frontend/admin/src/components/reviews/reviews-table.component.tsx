import {
  MdDeleteOutline,
  MdOutlineReviews,
  MdStar,
  MdStarBorder,
} from 'react-icons/md';

import { Spinner } from '@/components/ui/spinner.component';
import { formatDateLong } from '@/formatters/formatDate';
import type { Review } from '@/models/review.model';

interface ReviewsTableProps {
  reviews: Review[];
  isLoading: boolean;
  onDelete: (review: Review) => void;
}

function Stars({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5 text-orange">
      {[1, 2, 3, 4, 5].map((star) =>
        star <= stars ? (
          <MdStar key={star} size={16} />
        ) : (
          <MdStarBorder key={star} size={16} />
        ),
      )}
    </div>
  );
}

export function ReviewsTable({ reviews, isLoading, onDelete }: ReviewsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="text-orange" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16">
        <MdOutlineReviews size={28} className="text-text-muted" />
        <p className="text-[13px] text-text-muted">
          Nenhuma avaliação por aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-bg/60">
            {['Empresa', 'Avaliador', 'Estrelas', 'Comentário', 'Data', ''].map(
              (col, i) => (
                <th
                  key={col || i}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-text-sub"
                >
                  {col}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {reviews.map((review) => (
            <tr key={review.reviewId}>
              <td className="px-4 py-3">
                <span className="text-[13px] font-semibold text-text">
                  {review.companyName}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-[13px] text-text-sub">
                  {review.anonymous ? 'Anônimo' : review.submitterName}
                </span>
              </td>
              <td className="px-4 py-3">
                <Stars stars={review.stars} />
              </td>
              <td className="px-4 py-3">
                <span className="text-[13px] text-text-sub">
                  {review.comment ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-[13px] text-text-sub">
                  {formatDateLong(review.createdAt)}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onDelete(review)}
                  title="Excluir avaliação"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <MdDeleteOutline size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
