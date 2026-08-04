// Máscaras leves, sem dependência externa — cada função recebe o valor bruto
// do input e devolve o valor já formatado, prontas para uso em onChange.

export function maskCPF(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function maskPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function maskCEP(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function maskCardNumber(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();
}

export function maskExpirationMonth(value) {
  const digits = value.replace(/\D/g, '').slice(0, 2);
  if (digits.length === 1 && Number(digits) > 1) return `0${digits}`;
  return digits;
}

export function maskExpirationYear(value) {
  return value.replace(/\D/g, '').slice(0, 4);
}

export function maskCVV(value) {
  return value.replace(/\D/g, '').slice(0, 4);
}

export function maskUF(value) {
  return value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
}

// Remove a máscara antes de enviar pro backend, quando o backend espera só dígitos.
export function unmask(value) {
  return (value || '').replace(/\D/g, '');
}
