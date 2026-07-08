export function checkCpf(cpf: string): boolean {
  // remove máscara
  const nums = cpf.replace(/\D/g, "");

  if (nums.length !== 11) return false;

  // rejeita sequências repetidas: 000...111...etc
  if (/^(\d)\1{10}$/.test(nums)) return false;

  // valida dígitos verificadores
  const calcDigito = (slice: string, peso: number) => {
    const soma = slice
      .split("")
      .reduce((acc, n) => acc + Number(n) * peso--, 0);
    const resto = (soma * 10) % 11;
    return resto === 10 || resto === 11 ? 0 : resto;
  };

  const d1 = calcDigito(nums.slice(0, 9), 10);
  const d2 = calcDigito(nums.slice(0, 10), 11);

  return d1 === Number(nums[9]) && d2 === Number(nums[10]);
}
