import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';

import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { ReviewsTable } from '@/components/reviews/reviews-table.component';
import { Tabs } from '@/components/ui/tabs.component';
import { AdminPageContainer } from '@/components/ui/page-container.component';
import type { Review } from '@/models/review.model';
import { reviewsQueryOptions, useDeleteReviewMutation } from '@/queries/review.queries';
import type { RouteAccessLevel } from '@/types/route-access.type';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';

const ROUTE_ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-reviews'],
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const Route = createFileRoute('/_private/reviews')({
  ssr: false,
  beforeLoad: ({ context }) => {
    if (!checkRouteAccess(context.sessionUser, ROUTE_ACCESS)) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(reviewsQueryOptions()),
  component: ReviewsPage,
});

function ReviewsPage() {
  const { data: reviews } = useSuspenseQuery(reviewsQueryOptions());
  const [tab, setTab] = useState('week');
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const deleteReview = useDeleteReviewMutation();

  const thisWeek = reviews.filter(
    (r) => Date.now() - r.createdAt <= SEVEN_DAYS_MS,
  );

  const handleDeleteConfirm = async () => {
    if (!deletingReview) {
      return;
    }
    await deleteReview.mutateAsync(deletingReview.reviewId);
    setDeletingReview(null);
  };

  return (
    <AdminPageContainer>
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-text sm:text-4xl">
          Avaliações
        </h1>
        <p className="mt-2 text-[13px] text-text-sub sm:text-[14px]">
          Feedback semanal das empresas clientes.
        </p>
      </div>

      <div className="mb-4">
        <Tabs
          tabs={[
            { id: 'week', label: 'Esta semana' },
            { id: 'history', label: 'Histórico' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <ReviewsTable
        reviews={tab === 'week' ? thisWeek : reviews}
        isLoading={false}
        onDelete={setDeletingReview}
      />

      {deletingReview && (
        <ConfirmDeleteModal
          title="Excluir avaliação"
          description={`Tem certeza que deseja excluir a avaliação de "${deletingReview.companyName}"? Esta ação não pode ser desfeita.`}
          isDeleting={deleteReview.isPending}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingReview(null)}
        />
      )}
    </AdminPageContainer>
  );
}
