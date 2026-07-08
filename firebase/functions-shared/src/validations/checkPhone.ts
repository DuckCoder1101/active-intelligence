export function checkPhone(str?: string): boolean {
  if (!str) return true;
  return /^[1-9]{2}9[1-9]\d{7}$/.test(str);
}
