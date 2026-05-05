export function normalizeTeudatZehut(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 0 || digits.length > 9) return digits;
  return digits.padStart(9, "0");
}

export function isValidTeudatZehut(input: string): boolean {
  const id = normalizeTeudatZehut(input);
  if (id.length !== 9) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(id[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}
