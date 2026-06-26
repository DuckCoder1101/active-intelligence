export const COMPANY_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-500',
  'bg-violet-600',
  'bg-rose-500',
  'bg-teal-600',
  'bg-orange-500',
  'bg-indigo-600',
];

export function companyColor(id: string): string {
  let h = 0;
  for (const c of id) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  return COMPANY_COLORS[Math.abs(h) % COMPANY_COLORS.length];
}

export function companyInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}
