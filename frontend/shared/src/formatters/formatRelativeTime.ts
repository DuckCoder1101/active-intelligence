const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "agora", "5 min", "3 h", "2 d" */
export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;

  if (diff < MINUTE) {return 'agora';}
  if (diff < HOUR) {return `${Math.floor(diff / MINUTE)} min`;}
  if (diff < DAY) {return `${Math.floor(diff / HOUR)} h`;}
  return `${Math.floor(diff / DAY)} d`;
}
