export const sanitizeText = (value = "") => value.replace(/\s+/g, " ").trim();

export const normalizeEmail = (value = "") => sanitizeText(value).toLowerCase();

export const isValidName = (value = "") =>
  /^[A-Za-z][A-Za-z\s'-]{1,49}$/.test(sanitizeText(value));

export const isValidEmail = (value = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(value));

export const isStrongPassword = (value = "") =>
  /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(value);

export const isValidPrice = (value = "") =>
  /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(String(value).trim());

export const toPriceNumber = (value = "") => Number(String(value).trim());

const digitsOnly = (value = "") => String(value).replace(/\D/g, "");

export const isValidPhone = (value = "") => {
  const trimmed = String(value).trim();
  if (!/^[\d\s\-+()]+$/.test(trimmed)) return false;
  const digits = digitsOnly(trimmed);
  return digits.length >= 10 && digits.length <= 15;
};

export const isValidZip = (value = "") => {
  const trimmed = String(value).trim();
  if (!trimmed) return true;
  return /^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/.test(trimmed);
};

export const isValidCardNumber = (value = "") => {
  const digits = digitsOnly(value);
  if (!/^\d{12,19}$/.test(digits)) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (shouldDouble) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

export const isValidExpiry = (value = "") => {
  const match = String(value).trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!match) return false;

  const month = Number(match[1]);
  const year = Number(`20${match[2]}`);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return year > currentYear || (year === currentYear && month >= currentMonth);
};
