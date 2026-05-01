export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim());

export const isValidPhone = (phone) =>
  /^[\d\s\+\-\(\)]{7,15}$/.test(phone?.trim());

export const isStrongPassword = (pwd) =>
  pwd?.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);

export const sanitizeString = (str) =>
  str?.trim().replace(/\s+/g, ' ') || '';

export const isValidRole = (role) =>
  ['ADMIN', 'RESIDENTE', 'SEGURIDAD'].includes(role);

export const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

export const isMinLength = (value, min) =>
  typeof value === 'string' && value.trim().length >= min;

export const isMaxLength = (value, max) =>
  typeof value === 'string' && value.trim().length <= max;

export const isPositiveInt = (value) =>
  Number.isInteger(Number(value)) && Number(value) > 0;

export const isInRange = (value, min, max) => {
  const n = Number(value);
  return !isNaN(n) && n >= min && n <= max;
};

export const isValidDate = (value) => {
  const d = new Date(value);
  return !isNaN(d.getTime());
};

export const isValidPriority = (value) =>
  ['Alta', 'Media', 'Baja'].includes(value);
