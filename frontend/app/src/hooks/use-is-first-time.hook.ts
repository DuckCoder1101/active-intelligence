import { useCallback, useState } from 'react';

import { getLocalStorageItem, setLocalStorageItem } from '@/utils/local-storage.util';

function readSeen(key: string | null): boolean {
  return key ? getLocalStorageItem(key) === '1' : true;
}

/**
 * Tracks whether this is the user's first time seeing something, persisted
 * in localStorage under an arbitrary key (e.g. `welcome-seen-${uid}`,
 * `tutorial-seen-${uid}`). `key` may be null while its dependencies (like the
 * uid) aren't known yet — reads as "not first time" until a real key lands.
 */
export function useIsFirstTime(key: string | null): [boolean, () => void] {
  const [prevKey, setPrevKey] = useState(key);
  const [seen, setSeen] = useState(() => readSeen(key));

  // Re-sync when the key itself changes (e.g. uid resolves after profile
  // loads) — adjusted during render, not in an effect, so it lands in the
  // same commit instead of flashing the stale value for a frame.
  if (key !== prevKey) {
    setPrevKey(key);
    setSeen(readSeen(key));
  }

  const markSeen = useCallback(() => {
    if (!key) {
      return;
    }
    setLocalStorageItem(key, '1');
    setSeen(true);
  }, [key]);

  return [!seen, markSeen];
}
