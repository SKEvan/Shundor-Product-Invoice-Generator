import { BUSINESS, DELIVERY_CHARGES } from '@/config/business';
import type { AdvanceMethod, DeliveryZone, InvoiceItem } from '@/types/invoice';
import type { ParsedOrder } from '@/types/order';
import { guessDeliveryZone } from '@/utils/delivery';
import { capitalizeWords, formatMoney } from '@/utils/format';
import { calculateTotals } from '@/utils/invoiceCalc';
import { isValidPhone, normalizePhone } from '@/utils/phone';
import { parseItems } from './itemParser';
import { LINE_NOISE, matchLabel, SINGLE_LINE_FIELDS, STOP_MARKERS, type Field } from './labels';
import { extractPhone, extractThana, looksLikeAddress, looksLikeName } from './lineClassifier';
import { parseMoneyLine, type MoneyKey, type MoneyLine } from './moneyLines';

/**
 * Reads an order message in any of the formats the shop receives and fills
 * in the invoice: customer, products (with prices if given) and charges.
 *
 * Works with
 *   • the labelled Bangla template (নাম: / মোবাইল নম্বর: / ঠিকানা: / থানা: / পন্যের নাম/রঙ:)
 *   • English labels ("Name: …", "Phone …")
 *   • free-style messages with no labels at all, e.g.
 *       Samiya
 *       8801722922527
 *       Baridiya, Komorpur, Faridpur
 *       Kitty clock
 *       Price 500tk / Delivery 120tk / Cod 620tk
 *
 * Steps: 1) read lines into entries, 2) guess what unlabelled lines are,
 * 3) build items and attach prices, 4) work out delivery/advance/COD.
 */
export function parseOrder(rawText: string): ParsedOrder {
  const entries = readEntries(rawText);
  classifyFreeLines(entries);

  const fields = collectFields(entries);
  const hasLabelledProducts = entries.some((e) => e.kind === 'field' && e.field === 'products');
  // Leftover lines are products — unless the products were labelled, then they're just chatter.
  if (!hasLabelledProducts) {
    entries.forEach((entry, index) => {
      if (entry.kind === 'free') entries[index] = { kind: 'field', field: 'products', value: entry.text };
    });
  }

  const name = capitalizeWords(fields.name.join(' '));
  const phone = normalizePhone(fields.phone[0] ?? '');
  const address = fields.address
    .map((line) => line.replace(/^[\s,]+|[\s,]+$/g, ''))
    .filter(Boolean)
    .join(', ');
  const thana = capitalizeWords(fields.thana.join(' ')) || extractThana(address);

  const warnings: string[] = [];
  if (!name) warnings.push('Name not found');
  if (!phone) warnings.push('Mobile number not found');
  else if (!isValidPhone(phone)) warnings.push(`Mobile number "${phone}" doesn't look right`);
  if (!address) warnings.push('Address not found');

  const items = buildItems(entries, warnings);
  const charges = workOutCharges(items, latestMoney(entries), guessDeliveryZone(thana, address), warnings);

  if (items.length === 0) warnings.push('No products found — add them below');

  return { customer: { name, phone, address, thana }, items, ...charges, warnings };
}

// ---------------------------------------------------------------------------
// 1) Lines → entries
// ---------------------------------------------------------------------------

type Entry =
  | { kind: 'field'; field: Field; value: string }
  | { kind: 'money'; money: MoneyLine }
  | { kind: 'free'; text: string };

function readEntries(rawText: string): Entry[] {
  const entries: Entry[] = [];
  let current: Field | null = null;

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.replace(LINE_NOISE, '').trim();
    if (!line) continue;

    const money = parseMoneyLine(line);
    if (money) {
      entries.push({ kind: 'money', money });
      continue;
    }

    if (STOP_MARKERS.test(line)) {
      current = null;
      continue;
    }

    const label = matchLabel(line);
    if (label) {
      current = label.field;
      if (label.value) {
        entries.push({ kind: 'field', field: label.field, value: label.value });
        if (SINGLE_LINE_FIELDS.has(current)) current = null;
      }
      continue;
    }

    // A phone number never continues the address or product list.
    if (current && current !== 'phone' && extractPhone(line)) current = null;

    if (current) {
      entries.push({ kind: 'field', field: current, value: line });
      if (SINGLE_LINE_FIELDS.has(current)) current = null;
    } else {
      entries.push({ kind: 'free', text: line });
    }
  }
  return entries;
}

// ---------------------------------------------------------------------------
// 2) Guess what unlabelled lines are: phone → address → name → (products)
// ---------------------------------------------------------------------------

const BUSINESS_NUMBERS = new Set<string>([BUSINESS.whatsapp, BUSINESS.payment.bkash, BUSINESS.payment.nagad]);

function classifyFreeLines(entries: Entry[]): void {
  let hasPhone = entries.some((e) => e.kind === 'field' && e.field === 'phone');

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.kind !== 'free') continue;

    const found = extractPhone(entry.text);
    if (found) {
      const isNew = !hasPhone && !BUSINESS_NUMBERS.has(found.phone);
      hasPhone ||= isNew;
      // "Mitu, 01611223344, House 22 Road 3" → name part, phone, address part.
      const parts: Entry[] = [
        ...(found.before ? [{ kind: 'free' as const, text: found.before }] : []),
        ...(isNew ? [{ kind: 'field' as const, field: 'phone' as const, value: found.phone }] : []),
        ...(found.after ? [{ kind: 'free' as const, text: found.after }] : []),
      ];
      entries.splice(i, 1, ...parts);
      i--; // classify the split-off parts too
      continue;
    }

    if (looksLikeAddress(entry.text)) entries[i] = { kind: 'field', field: 'address', value: entry.text };
  }

  if (entries.some((e) => e.kind === 'field' && e.field === 'name')) return;
  const nameIndex = findNameLine(entries);
  if (nameIndex >= 0) {
    const entry = entries[nameIndex] as { kind: 'free'; text: string };
    entries[nameIndex] = { kind: 'field', field: 'name', value: entry.text };
  }
}

/**
 * The name is usually right before (or after) the phone number; otherwise
 * it's the first name-like line before the address.
 */
function findNameLine(entries: Entry[]): number {
  const isNameCandidate = (index: number) => {
    const entry = entries[index];
    return entry?.kind === 'free' && looksLikeName(entry.text);
  };

  const phoneIndex = entries.findIndex((e) => e.kind === 'field' && e.field === 'phone');
  if (phoneIndex >= 0) {
    if (isNameCandidate(phoneIndex - 1)) return phoneIndex - 1;
    if (isNameCandidate(phoneIndex + 1)) return phoneIndex + 1;
  }

  const addressIndex = entries.findIndex((e) => e.kind === 'field' && e.field === 'address');
  const end = addressIndex >= 0 ? addressIndex : entries.length;
  for (let i = 0; i < end; i++) if (isNameCandidate(i)) return i;
  return -1;
}

function collectFields(entries: Entry[]): Record<Field, string[]> {
  const fields: Record<Field, string[]> = { name: [], phone: [], address: [], thana: [], products: [] };
  for (const entry of entries) if (entry.kind === 'field') fields[entry.field].push(entry.value);
  return fields;
}

// ---------------------------------------------------------------------------
// 3) Items, with "Price …" lines attached to the product they follow
// ---------------------------------------------------------------------------

function buildItems(entries: Entry[], warnings: string[]): InvoiceItem[] {
  const blocks: { lines: string[]; price?: number; perUnit?: boolean }[] = [];
  const loosePrices: number[] = [];

  for (const entry of entries) {
    const open = blocks[blocks.length - 1];
    if (entry.kind === 'field' && entry.field === 'products') {
      // A price closes its product; the next product line starts a new block.
      if (!open || open.price !== undefined) blocks.push({ lines: [entry.value] });
      else open.lines.push(entry.value);
    } else if (entry.kind === 'money' && entry.money.key === 'price') {
      if (open && open.price === undefined) Object.assign(open, { price: entry.money.amount, perUnit: entry.money.perUnit });
      else loosePrices.push(entry.money.amount);
    }
  }

  const items: InvoiceItem[] = [];
  for (const block of blocks) {
    const blockItems = parseItems(block.lines.join('\n'));
    if (block.price !== undefined) {
      const [only] = blockItems;
      // "Price" is what the buyer pays for that line (split over the quantity), unless it says "each".
      if (blockItems.length === 1 && only.unitPrice === 0) {
        only.unitPrice = block.perUnit ? block.price : round2(block.price / only.quantity);
      }
      else loosePrices.push(block.price);
    }
    items.push(...blockItems);
  }

  const unpriced = items.filter((item) => item.unitPrice === 0);
  if (loosePrices.length === 1 && unpriced.length === 1) {
    unpriced[0].unitPrice = round2(loosePrices[0] / unpriced[0].quantity);
  } else if (loosePrices.length > 0 && unpriced.length > 0) {
    warnings.push(`Found price ${loosePrices.map(formatMoney).join(', ')} but couldn’t tell which product it’s for`);
  }
  return items;
}

// ---------------------------------------------------------------------------
// 4) Delivery, discount, advance and COD
// ---------------------------------------------------------------------------

type MoneyValues = Partial<Record<Exclude<MoneyKey, 'price'>, number>> & { advanceMethod?: AdvanceMethod };

function latestMoney(entries: Entry[]): MoneyValues {
  const values: MoneyValues = {};
  for (const entry of entries) {
    if (entry.kind !== 'money' || entry.money.key === 'price') continue;
    values[entry.money.key] = entry.money.amount;
    if (entry.money.key === 'advance' && entry.money.method) values.advanceMethod = entry.money.method;
  }
  return values;
}

interface Charges {
  deliveryZone: DeliveryZone;
  deliveryZoneDetected: boolean;
  deliveryCharge: number;
  discount: number;
  advancePaid: number;
  advanceMethod: AdvanceMethod;
}

function workOutCharges(
  items: InvoiceItem[],
  money: MoneyValues,
  zoneGuess: { zone: DeliveryZone; detected: boolean },
  warnings: string[],
): Charges {
  let { zone, detected } = zoneGuess;
  // No known place in the address? A stated charge of 80/120 tells us the zone.
  if (!detected && money.delivery !== undefined) {
    const byCharge = (Object.keys(DELIVERY_CHARGES) as DeliveryZone[]).find((z) => DELIVERY_CHARGES[z] === money.delivery);
    if (byCharge) [zone, detected] = [byCharge, true];
  }
  if (!detected) warnings.push('Couldn’t tell if this is inside Dhaka — please check the delivery zone');

  const deliveryCharge = money.delivery ?? DELIVERY_CHARGES[zone];
  const discount = money.discount ?? 0;

  // One product without a price: work it out from "Total …" or from "COD … + Advance …".
  const [single] = items;
  if (items.length === 1 && single.unitPrice === 0) {
    const total = money.total ?? (money.cod !== undefined && money.advance !== undefined ? money.cod + money.advance : undefined);
    const subtotal = total !== undefined ? total - deliveryCharge + discount : 0;
    if (subtotal > 0) single.unitPrice = round2(subtotal / single.quantity);
  }

  const { total } = calculateTotals({ items, deliveryCharge, discount, advancePaid: 0 });
  // The template asks for the delivery charge in advance. If the message gives the
  // COD amount instead, the advance is whatever the COD doesn't cover.
  const advancePaid = money.advance ?? (money.cod !== undefined ? Math.max(total - money.cod, 0) : deliveryCharge);
  const advanceMethod = advancePaid === 0 ? 'none' : (money.advanceMethod ?? 'bkash');

  const allPriced = items.length > 0 && items.every((item) => item.unitPrice > 0);
  if (money.cod !== undefined && allPriced) {
    const { amountDue } = calculateTotals({ items, deliveryCharge, discount, advancePaid });
    if (amountDue !== money.cod) {
      warnings.push(`Message says COD ${formatMoney(money.cod)}, but the invoice comes to ${formatMoney(amountDue)} — please check`);
    }
  }

  return { deliveryZone: zone, deliveryZoneDetected: detected, deliveryCharge, discount, advancePaid, advanceMethod };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
