export function toDateInput(ms?: number): string {
  return ms ? new Date(ms).toISOString().split('T')[0] : '';
}

export function fromDateInput(value: string): number {
  return new Date(`${value}T12:00:00`).getTime();
}
