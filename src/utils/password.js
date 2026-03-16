import bcrypt from 'bcryptjs';

const CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const SYMBOLS = '@#$!';

export const generatePassword = (length = 10) => {
  const pool = CHARS + UPPER + SYMBOLS;
  let pwd = '';
  pwd += UPPER[Math.floor(Math.random() * UPPER.length)];
  pwd += SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  for (let i = 2; i < length; i++) {
    pwd += pool[Math.floor(Math.random() * pool.length)];
  }
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
};

export const hashPassword = (plain) => bcrypt.hash(plain, 12);
export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);
