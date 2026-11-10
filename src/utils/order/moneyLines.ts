import type { AdvanceMethod } from '@/types/invoice';
import { toEnglishDigits } from '@/utils/digits';

/**
 * Lines that state an amount, e.g. "Price 500tk", "Delivery 120tk", "Cod 620tk",
 * "Advance 80 (bKash)", "Discount: 50", "Total = 1,250/-".
 */
export type MoneyKey = 'price' | 'delivery' | 'discount' | 'advance' | 'cod' | 'total';

export interface MoneyLine {
  key: MoneyKey;
  amount: number;
  /** Set when the line names bKash or Nagad (only meaningful for the advance). */
  method?: AdvanceMethod;
  /** "Price 350 tk each" — the amount is per piece, not for the whole line. */
  perUnit?: boolean;
}

/** Checked in this order — "Total due" is COD, "Total price" is the product price. */
const MONEY_LABELS: [MoneyKey, RegExp][] = [
  ['cod', /^(?:c\.?o\.?d|cash\s*on\s*delivery|condition|(?:total\s*)?due|amount\s*due|collect(?:able|ion)?(?:\s*amount)?|ক্যাশ\s*অন|কন্ডিশন)/i],
  ['advance', /^(?:advanced?|adv\.?|paid|pre-?paid|b[i]?kash|nagad|অগ্রিম|এডভান্স|অ্যাডভান্স)/i],
  ['delivery', /^(?:delivery|del\.?|d\.?c|shipping|courier|ডেলিভারি|ডেলিভারী)/i],
  ['discount', /^(?:discount|disc\.?|less|ছাড়|ডিসকাউন্ট)/i],
  ['price', /^(?:total\s*)?(?:(?:product|item|unit)\s*)?(?:price|prize|rate|dam|daam|দাম|মূল্য)/i],
  ['total', /^(?:grand\s*total|sub\s*total|total|মোট)/i],
];

/**
 * After the label: a few non-digit characters ("charge (inside Dhaka): "),
 * the amount, then at most a short tail ("tk", "taka", "/-", "via bkash").
 * A tail with more digits means it's a sentence, not an amount line.
 */
const AMOUNT = /^(?![a-z])[^\d\n]{0,30}?(\d[\d,]*(?:\.\d{1,2})?)([^\d]{0,25})$/i;

export function parseMoneyLine(line: string): MoneyLine | null {
  const text = toEnglishDigits(line).trim();
  for (const [key, label] of MONEY_LABELS) {
    const labelMatch = text.match(label);
    if (!labelMatch) continue;

    const amountMatch = text.slice(labelMatch[0].length).match(AMOUNT);
    if (!amountMatch) return null;

    const digits = amountMatch[1].replace(/,/g, '');
    // 8+ digits is a phone number ("Bkash- 01736528481"), not an amount.
    if (digits.replace('.', '').length > 7) return null;

    const lower = text.toLowerCase();
    const method: AdvanceMethod | undefined = /b[i]?kash|বিকাশ/.test(lower) ? 'bkash' : /nagad|নগদ/.test(lower) ? 'nagad' : undefined;
    const perUnit = /\b(?:each|per\s*(?:piece|pc|pcs|item|unit))\b|\/\s*pc|প্রতি/i.test(text);
    return { key, amount: Number(digits), method, perUnit };
  }
  return null;
}
