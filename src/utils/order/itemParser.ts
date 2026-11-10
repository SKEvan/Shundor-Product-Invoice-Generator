import type { InvoiceItem } from '@/types/invoice';
import { createKey } from '@/utils/createKey';
import { toEnglishDigits } from '@/utils/digits';
import { capitalizeWords } from '@/utils/format';

/**
 * Colour words we recognise. Multi-word colours come first so "light pink"
 * is matched before "pink". Add more here if needed.
 */
const COLORS = [
  'light pink', 'baby pink', 'hot pink', 'dark pink', 'rose gold', 'sky blue', 'navy blue', 'royal blue',
  'dark blue', 'light blue', 'off white', 'dark green', 'light green', 'olive green', 'bottle green',
  'mint green', 'dark brown', 'light brown', 'coffee brown', 'light grey', 'dark grey', 'light gray',
  'dark gray', 'wine red', 'cherry red', 'golden', 'gold', 'silver', 'red', 'black', 'white', 'blue',
  'green', 'pink', 'purple', 'violet', 'lavender', 'yellow', 'orange', 'brown', 'grey', 'gray', 'maroon',
  'navy', 'beige', 'cream', 'nude', 'peach', 'coral', 'magenta', 'teal', 'turquoise', 'olive', 'mint',
  'khaki', 'tan', 'coffee', 'chocolate', 'wine', 'burgundy', 'mustard', 'lemon', 'ash', 'multicolor',
  'multicolour', 'multi color', 'transparent', 'clear',
];

const COLOR_PATTERN = new RegExp(`\\b(${COLORS.map(escapeRegExp).join('|')})\\b`, 'gi');
const COLOR_LABEL = /\b(colou?r|rong|rang)\b\s*[:\-=]?\s*|রঙ\s*[:\-=]?\s*/gi;

/** "x2", "×2", "2x", "2 pcs", "2pc", "2 piece(s)", "qty 2", "qty: 2", "2 ta/ti/টা/টি" */
const QTY_PATTERNS: RegExp[] = [
  /(?:^|\s|\()(?:qty|quantity|q)\s*[:\-=]?\s*(\d{1,3})\b\)?/i,
  /(?:^|\s|\()[x×*]\s*(\d{1,3})\b\)?/i,
  /(?:^|\s|\()(\d{1,3})\s*[x×]\b(?!\w)\)?/i,
  /(?:^|\s|\()(\d{1,3})\s*(?:pcs?|pieces?|piece|ps|ta|ti|টা|টি|set|sets|pair|pairs)(?![a-z])\)?/i,
];

/** A price the owner may have typed, e.g. "450tk", "Tk 450", "৳450", "450/-" */
const PRICE_PATTERNS: RegExp[] = [
  /(?:^|\s|\()(?:tk\.?|taka|bdt|৳)\s*(\d+(?:\.\d{1,2})?)\)?/i,
  /(?:^|\s|\()(\d+(?:\.\d{1,2})?)\s*(?:tk\.?|taka|bdt|৳|\/-)(?![a-z])\)?/i,
  /(?:^|\s)@\s*(\d+(?:\.\d{1,2})?)/i,
];

/**
 * Turns the owner's "product / colour / quantity" text into invoice items.
 *
 * Items are separated by new lines, ";" or ",". A part that is only a colour,
 * quantity or price (e.g. "Lipstick, Red, 2") is joined to the item before it.
 *
 * Examples
 *   "Lipstick Red x2, Handbag Black 1"   → 2 items
 *   "1. Lipstick - Red - 2pcs\n2. Bag"   → 2 items
 */
export function parseItems(text: string): InvoiceItem[] {
  const segments = splitIntoSegments(toEnglishDigits(text));
  return segments.map(parseItemSegment).filter((item): item is InvoiceItem => item !== null);
}

const HAS_COLOR = new RegExp(COLOR_PATTERN.source, 'i');

/** True if the text has a quantity, a price or a colour — i.e. it reads like a product line. */
export function looksLikeItem(text: string): boolean {
  const english = toEnglishDigits(text);
  return HAS_COLOR.test(english) || [...QTY_PATTERNS, ...PRICE_PATTERNS].some((pattern) => pattern.test(english));
}

function splitIntoSegments(text: string): string[] {
  const segments: string[] = [];

  for (const line of text.split(/\r?\n|;/)) {
    const lineSegments: string[] = [];
    for (const part of line.split(/,|\s\+\s|\s&\s/).map((p) => p.trim()).filter(Boolean)) {
      const last = lineSegments.length - 1;
      if (!isDetailOnly(part)) lineSegments.push(part);
      else if (last >= 0) lineSegments[last] = `${lineSegments[last]} ${part}`;
      else if (segments.length > 0) segments[segments.length - 1] += ` ${part}`; // e.g. "Color: Red" on its own line
    }
    segments.push(...lineSegments);
  }
  return segments;
}

/** True for parts like "Red", "2", "x2", "2pcs", "Color: Red", "450tk". */
function isDetailOnly(part: string): boolean {
  let rest = part.replace(COLOR_LABEL, ' ');
  rest = rest.replace(COLOR_PATTERN, ' ');
  for (const pattern of [...QTY_PATTERNS, ...PRICE_PATTERNS]) rest = rest.replace(pattern, ' ');
  rest = rest.replace(/^\s*\d{1,3}\s*$/, ' ');
  return rest.replace(/[\s\-–—:/()|.]+/g, '') === '';
}

function parseItemSegment(segment: string): InvoiceItem | null {
  // Remove list numbering like "1." / "2)" / "#3" / "- "
  let text = segment.replace(/^\s*(?:#?\d{1,2}[.)]|[-•*])\s+/, '');

  let unitPrice = 0;
  for (const pattern of PRICE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      unitPrice = Number(match[1]);
      text = text.replace(match[0], ' ');
      break;
    }
  }

  let quantity = 0;
  for (const pattern of QTY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      quantity = Number(match[1]);
      text = text.replace(match[0], ' ');
      break;
    }
  }

  const colors: string[] = [];
  text = text.replace(COLOR_LABEL, ' ').replace(COLOR_PATTERN, (match) => {
    const color = capitalizeWords(match.toLowerCase());
    if (!colors.includes(color)) colors.push(color);
    return ' ';
  });

  // A bare 3–5 digit number at the end ("Kitty clock 500") is the price.
  if (!unitPrice) {
    const trailingPrice = text.match(/[\s\-–—:(]+(\d{3,5})\s*\)?\s*$/);
    if (trailingPrice) {
      unitPrice = Number(trailingPrice[1]);
      text = text.replace(trailingPrice[0], ' ');
    }
  }

  // A bare number at the very end ("Lipstick red 2") or start ("2 Lipstick") is the quantity.
  if (!quantity) {
    const trailing = text.match(/[\s\-–—:(]+(\d{1,2})\s*\)?\s*$/);
    const leading = text.match(/^\s*(\d{1,2})\s+(?=[a-z])/i);
    const match = trailing ?? leading;
    if (match) {
      quantity = Number(match[1]);
      text = text.replace(match[0], ' ');
    }
  }

  const productName = capitalizeFirst(
    text
      .replace(/\(\s*\)/g, ' ')
      .replace(/\s*[-–—:/|]\s*(?=[-–—:/|]|$)/g, ' ')
      .replace(/^[\s\-–—:/|,.]+|[\s\-–—:/|,.]+$/g, '')
      .replace(/\s+/g, ' '),
  );

  if (!productName) return null;

  return {
    key: createKey(),
    productName,
    color: colors.join(', '),
    quantity: quantity > 0 ? quantity : 1,
    unitPrice,
  };
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
