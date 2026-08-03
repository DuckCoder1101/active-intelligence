import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { ReviewRequiredModal } from '@/components/reviews/review-required-modal.component';
import { useAuth } from '@/contexts/auth.context';
import { useFirstAccessAt } from '@/hooks/use-first-access-at.hook';
import { getSessionUser } from '@/server/session';
import { auth } from '@/utils/firebase.util';
import { isReviewDue } from '@/utils/review-due.util';

const COMPANY_PATH_RE = /^\/company\/([^/]+)/;

export const Route = createFileRoute('/_private')({
  beforeLoad: async ({ context, location }) => {
    await auth.authStateReady();

    const sessionUser = context.sessionUser ?? (await getSessionUser());

    if (!sessionUser) {
      const companyMatch = COMPANY_PATH_RE.exec(location.pathname);
      throw redirect({
        to: '/auth/signin',
        search: companyMatch
          ? {
              companyId: companyMatch[1],
            }
          : undefined,
      });
    }

    if (!sessionUser.complete) {
      throw redirect({ to: '/auth/complete-account' });
    }

    return {
      sessionUser,
    };
  },
  component: PrivateLayout,
});

function PrivateLayout() {
  const { claims, userProfile } = useAuth();
  const firstAccessAt = useFirstAccessAt(
    userProfile ? `review-first-access-${userProfile.uid}` : null,
  );

  return (
    <>
      {isReviewDue(claims, firstAccessAt) && <ReviewRequiredModal />}
      <Outlet />
    </>
  );
}
