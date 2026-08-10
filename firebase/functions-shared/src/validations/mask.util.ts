export function stripMask(value: string): string {
  return value.replace(/\D/g, "");
}
