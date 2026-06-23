export function deepClean<T>(value: T): T | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number' && isNaN(value)) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) return value;

  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const cleaned = deepClean(v);
    if (cleaned !== undefined) result[k] = cleaned;
  }
  return (Object.keys(result).length > 0 ? result : undefined) as T;
}
