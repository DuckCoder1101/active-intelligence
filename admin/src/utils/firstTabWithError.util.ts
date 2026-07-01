export function firstTabWithError(
  tabErrors: Record<string, boolean>,
): string | null {
  return Object.entries(tabErrors).find(([, hasError]) => hasError)?.[0] ?? null;
}
