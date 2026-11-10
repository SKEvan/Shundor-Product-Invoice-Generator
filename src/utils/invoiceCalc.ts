import type { InvoiceDraft, InvoiceItem, InvoiceTotals } from '@/types/invoice';

export function lineTotal(item: Pick<InvoiceItem, 'quantity' | 'unitPrice'>): number {
  return round2(item.quantity * item.unitPrice);
}

/**
 * Same formula as `private.recalculate_totals` in the database:
 *   subtotal   = Σ quantity × unit price
 *   total      = subtotal + delivery charge − discount
 *   amount due = total − advance paid (never below 0) → collected on delivery
 */
export function calculateTotals(draft: Pick<InvoiceDraft, 'items' | 'deliveryCharge' | 'discount' | 'advancePaid'>): InvoiceTotals {
  const subtotal = round2(draft.items.reduce((sum, item) => sum + lineTotal(item), 0));
  const total = round2(subtotal + draft.deliveryCharge - draft.discount);
  const amountDue = Math.max(round2(total - draft.advancePaid), 0);
  return { subtotal, total, amountDue };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
