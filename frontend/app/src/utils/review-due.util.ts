import type { CustomClaims } from '@/types/custom-claims.type';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * `firstAccessAt` gates the very first appearance: no review modal until 7
 * days after the user's first access (see `useFirstAccessAt`). After that
 * grace period, it's the same 7-day rolling cadence based on `lastReviewAt`.
 */
export function isReviewDue(
  claims: CustomClaims | null,
  firstAccessAt: number | null,
): boolean {
  if (!claims || claims.accessLevel !== 'user' || !firstAccessAt) {
    return false;
  }

  if (Date.now() - firstAccessAt < SEVEN_DAYS_MS) {
    return false;
  }

  const lastReviewAt = claims.lastReviewAt;
  return !lastReviewAt || Date.now() - lastReviewAt > SEVEN_DAYS_MS;
}
