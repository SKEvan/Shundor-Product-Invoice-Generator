import { toEnglishDigits } from './digits';

/**
 * Cleans a Bangladeshi mobile number into the 11-digit local form (01XXXXXXXXX).
 * Handles Bangla digits, spaces, dashes and the +880 / 880 prefix.
 * Returns the cleaned digits even if invalid, so the owner can still fix it.
 */
export function normalizePhone(input: string): string {
  let digits = toEnglishDigits(input).replace(/\D/g, '');
  if (digits.startsWith('880')) digits = digits.slice(2);
  else if (digits.startsWith('88') && digits.length === 13) digits = digits.slice(2);
  return digits;
}

/** True for valid BD mobile numbers: 013–019 followed by 8 digits. */
export function isValidPhone(phone: string): boolean {
  return /^01[3-9]\d{8}$/.test(phone);
}
