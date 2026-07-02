export function checkCnpj(cnpj: string): boolean {
  const nums = cnpj.replace(/\D/g, '');

  if (nums.length !== 14) return false;

  if (/^(\d)\1{13}$/.test(nums)) return false;

  const calcDigito = (slice: string, weights: number[]) => {
    const soma = slice.split('').reduce((acc, n, i) => acc + Number(n) * weights[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcDigito(nums.slice(0, 12), weights1);
  const d2 = calcDigito(nums.slice(0, 13), weights2);

  return d1 === Number(nums[12]) && d2 === Number(nums[13]);
}
