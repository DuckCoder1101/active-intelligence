import { useState } from 'react';

import {
  getLocalStorageItem,
  setLocalStorageItem,
} from '@/utils/local-storage.util';

function readOrInitFirstAccessAt(key: string | null): number | null {
  if (!key) {
    return null;
  }

  const stored = getLocalStorageItem(key);
  if (stored) {
    return Number(stored);
  }

  const now = Date.now();
  setLocalStorageItem(key, String(now));
  return now;
}

/**
 * Tracks (and persists in localStorage) the timestamp of this user's first
 * access, keyed per uid (e.g. `review-first-access-${uid}`) — same storage
 * mechanism as `useIsFirstTime`'s welcome-modal check, but keeps a
 * timestamp instead of a seen/unseen flag.
 */
export function useFirstAccessAt(key: string | null): number | null {
  const [prevKey, setPrevKey] = useState(key);
  const [firstAccessAt, setFirstAccessAt] = useState(() =>
    readOrInitFirstAccessAt(key),
  );

  // Re-sync when the key itself changes (e.g. uid resolves after profile
  // loads) — adjusted during render, matching useIsFirstTime's approach.
  if (key !== prevKey) {
    setPrevKey(key);
    setFirstAccessAt(readOrInitFirstAccessAt(key));
  }

  return firstAccessAt;
}
