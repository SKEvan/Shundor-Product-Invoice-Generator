import { DELIVERY_CHARGES } from '@/config/business';
import type { Invoice, InvoiceDraft, InvoiceItem } from '@/types/invoice';
import type { ParsedOrder } from '@/types/order';
import { createKey } from './createKey';
import { isValidPhone } from './phone';

export function emptyItem(): InvoiceItem {
  return { key: createKey(), productName: '', color: '', quantity: 1, unitPrice: 0 };
}

export function emptyDraft(): InvoiceDraft {
  return {
    customer: { name: '', phone: '', address: '', thana: '' },
    items: [emptyItem()],
    deliveryZone: 'inside_dhaka',
    deliveryCharge: DELIVERY_CHARGES.inside_dhaka,
    discount: 0,
    advancePaid: DELIVERY_CHARGES.inside_dhaka,
    advanceMethod: 'bkash',
    note: '',
    rawOrderText: '',
  };
}

/** A fresh draft filled from the pasted order (customer, items and charges). */
export function draftFromParsedOrder(order: ParsedOrder, rawOrderText: string): InvoiceDraft {
  return {
    ...emptyDraft(),
    customer: order.customer,
    items: order.items.length > 0 ? order.items : [emptyItem()],
    deliveryZone: order.deliveryZone,
    deliveryCharge: order.deliveryCharge,
    discount: order.discount,
    advancePaid: order.advancePaid,
    advanceMethod: order.advanceMethod,
    rawOrderText,
  };
}

export function draftFromInvoice(invoice: Invoice): InvoiceDraft {
  const { customer, items, deliveryZone, deliveryCharge, discount, advancePaid, advanceMethod, note, rawOrderText } =
    invoice;
  return { customer, items, deliveryZone, deliveryCharge, discount, advancePaid, advanceMethod, note, rawOrderText };
}

/** Problems that must be fixed before saving. Empty array = ready. */
export function validateDraft(draft: InvoiceDraft): string[] {
  const errors: string[] = [];
  if (!draft.customer.name.trim()) errors.push('Enter the customer name');
  if (!isValidPhone(draft.customer.phone)) errors.push('Enter a valid 11-digit mobile number (01XXXXXXXXX)');
  if (!draft.customer.address.trim()) errors.push('Enter the address');

  const items = draft.items;
  if (items.length === 0) errors.push('Add at least one product');
  items.forEach((item, index) => {
    const label = item.productName.trim() || `Item ${index + 1}`;
    if (!item.productName.trim()) errors.push(`Item ${index + 1}: enter the product name`);
    if (!(item.quantity >= 1)) errors.push(`${label}: quantity must be at least 1`);
    if (!(item.unitPrice > 0)) errors.push(`${label}: enter the price`);
  });
  return errors;
}

/** True when two drafts would produce the same invoice (ignores React keys). */
export function draftsEqual(a: InvoiceDraft, b: InvoiceDraft): boolean {
  const strip = (draft: InvoiceDraft) => ({ ...draft, items: draft.items.map(({ key: _key, ...rest }) => rest) });
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}
