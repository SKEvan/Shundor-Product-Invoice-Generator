import { toEnglishDigits } from '@/utils/digits';
import { looksLikeItem } from './itemParser';

export type Field = 'name' | 'phone' | 'address' | 'thana' | 'products';

/** Fields that hold one value; after it's filled, following lines are classified afresh. */
export const SINGLE_LINE_FIELDS: ReadonlySet<Field> = new Set(['name', 'phone', 'thana']);

/**
 * How an English label ends: a colon/dash ("Name: …", "Name - …"), a space
 * followed by the value ("Name Samiya"), or the end of the line (value below).
 */
const END = String.raw`(?:\s*(?:\(\s*english\s*\))?\s*[:ঃ：=\-]|\s+(?=\S)|\s*$)`;

/**
 * Line-start labels for each field. Bangla labels come from the order template.
 * "products" is checked before "name" because পন্যের নাম contains নাম.
 */
const FIELD_LABELS: [Field, RegExp][] = [
  ['products', new RegExp(String.raw`^(?:প[নণ]্যের\s*নাম|প[নণ]্য|(?:products?|items?)(?:\s*name)?(?:\s*\/\s*colou?r)?${END})`, 'iu')],
  ['phone', new RegExp(String.raw`^(?:মোবাইল|ফোন|(?:mobile|phone|contact|cell)(?:\s*(?:no\.?|number))?${END})`, 'iu')],
  ['address', new RegExp(String.raw`^(?:ঠিকানা|address${END})`, 'iu')],
  ['thana', new RegExp(String.raw`^(?:থানা|(?:thana|police\s*station|upazila|upozila)${END})`, 'iu')],
  ['name', new RegExp(String.raw`^(?:নাম|(?:customer\s*)?name${END})`, 'iu')],
];

/**
 * Template lines that end the current field (header and footer of the template).
 * bKash/Nagad lines only get here if they aren't an amount like "Bkash 80 paid".
 */
export const STOP_MARKERS =
  /^(?:🔴|🦋|এবং\s*ডেলিভারি|ডেলিভারি\s*চার্জ\s*পরিমা|send\s*money|b[i]?kash|nagad|rocket|আপনাকে|অর্ডার|order\s*(?:confirm|details?|summary|info)|confirm(?:ed)?\s*order|new\s*order|thank|ass?alamu|salam\b|hello\b|hi\b|hey\b|dear\b)/iu;

/** Chat formatting and emoji stripped from the start of each line. */
export const LINE_NOISE = /^[\s*_~>•✅🔴🦋✨🌼❤️💖📦🛍️☎️📞📍🏠-]+/u;

export interface LabelMatch {
  field: Field;
  value: string;
}

export function matchLabel(line: string): LabelMatch | null {
  for (const [field, label] of FIELD_LABELS) {
    const match = line.match(label);
    if (!match) continue;

    let value = line.slice(match[0].length);
    // Bangla labels stop at the first word ("মোবাইল"); skip the rest up to the colon
    // ("নম্বর( English):") — but only if the colon comes before any digits.
    if (!/[:ঃ：=\-]\s*$/.test(match[0])) {
      const colon = value.search(/[:ঃ：]/u);
      if (colon >= 0 && colon < 25 && !/\d/.test(value.slice(0, colon))) value = value.slice(colon + 1);
    }
    value = value.replace(/^[\s(]*english[\s)]*/i, '').replace(/^[\s\-–=*_~:]+|[\s*_~]+$/g, '');

    // "Phone case black" / "Name necklace gold" are products, not labels.
    if (field === 'phone' && value && !/\d/.test(toEnglishDigits(value))) return null;
    if (field === 'name' && !/[:ঃ：=\-]\s*$/.test(match[0]) && looksLikeItem(value)) return null;

    return { field, value };
  }
  return null;
}
