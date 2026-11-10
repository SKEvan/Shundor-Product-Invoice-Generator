import { findInsideDhakaArea, mentionsKnownArea } from '@/utils/delivery';
import { toEnglishDigits } from '@/utils/digits';
import { capitalizeWords } from '@/utils/format';
import { normalizePhone } from '@/utils/phone';
import { looksLikeItem } from './itemParser';

/**
 * Helpers that guess what an unlabelled line is — used for free-style
 * messages like "Samiya / 8801722922527 / Baridiya, Faridpur / Kitty clock".
 */

const PHONE_IN_TEXT = /(?:\+?\s*8\s*8[\s-]*)?0\s*1[3-9](?:[\s-]*\d){8}/;
const PHONE_WORDS = /\b(?:mobile|mob|phone|ph|cell|contact|number|num|no|whatsapp|call)\b\.?/gi;

/**
 * Finds a BD mobile number in the line and returns the text on either side of it
 * (without words like "Mobile no:"), e.g. "Mitu, 01611223344, Mirpur" → before "Mitu", after "Mirpur".
 */
export function extractPhone(line: string): { phone: string; before: string; after: string } | null {
  const text = toEnglishDigits(line);
  const match = text.match(PHONE_IN_TEXT);
  if (!match || match.index === undefined) return null;
  const clean = (part: string) =>
    part
      .replace(PHONE_WORDS, ' ')
      .replace(/^[\s:ঃ\-–,()/|.]+|[\s:ঃ\-–,()/|]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  return {
    phone: normalizePhone(match[0]),
    before: clean(text.slice(0, match.index)),
    after: clean(text.slice(match.index + match[0].length)),
  };
}

const ADDRESS_WORDS =
  /\b(?:house|h#|holding|road|rd|lane|goli|gali|block|sector|section|flat|floor|apartment|apt|building|bldg|tower|village|vill|gram|post|p\.?o|union|upazila|upozila|thana|district|dist|zila|zilla|sadar|bazar|bazaar|para|mohalla|colony|housing|avenue|street|near|opposite|beside|behind|bangladesh|dhaka|city|town|mor|more|moor|chowrasta|chottor|division|ward|word|ps)\b/i;
const PLACE_SUFFIX = /\b\p{L}{3,}(?:pur|ganj|bari|gaon|abad|nagar|para|hat|bagh|danga|kandi|tola)\b/iu;

/** True for lines that read like part of an address. */
export function looksLikeAddress(line: string): boolean {
  if (looksLikeItem(line)) return false;
  return ADDRESS_WORDS.test(line) || PLACE_SUFFIX.test(line) || mentionsKnownArea(line) || line.split(',').length >= 3;
}

/** 1–5 words, letters only — e.g. "Samiya", "Md. Rahim Uddin". */
export function looksLikeName(line: string): boolean {
  const words = line.trim().split(/\s+/);
  return (
    words.length >= 1 &&
    words.length <= 5 &&
    /^[\p{L}\p{M}.'\- ]{2,40}$/u.test(line.trim()) &&
    !looksLikeItem(line) &&
    !looksLikeAddress(line)
  );
}

/**
 * Picks the thana out of an address when the buyer didn't label it:
 * "…, Faridpur Sadar, Faridpur" → "Faridpur Sadar"; "House 5, Mirpur 10" → "Mirpur".
 */
export function extractThana(address: string): string {
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  const labelled = parts.find((part) => /\b(?:sadar|thana|upazila|upozila|p\.?s)\b/i.test(part));
  if (labelled) {
    const cleaned = labelled.replace(/\b(?:thana|upazila|upozila|p\.?s)\b[:\s.]*/gi, ' ').replace(/\s+/g, ' ').trim();
    if (cleaned) return capitalizeWords(cleaned);
  }
  const area = findInsideDhakaArea(address);
  return area ? capitalizeWords(area) : '';
}
