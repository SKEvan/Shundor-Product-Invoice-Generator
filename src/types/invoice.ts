/** Where the parcel goes — decides the delivery charge. */
export type DeliveryZone = 'inside_dhaka' | 'outside_dhaka';

/** How the buyer sent the advance (delivery charge). */
export type AdvanceMethod = 'bkash' | 'nagad' | 'none';

export interface Customer {
  name: string;
  phone: string;
  address: string;
  thana: string;
}

export interface InvoiceItem {
  /** Client-side key for React lists. Not stored in the database. */
  key: string;
  productName: string;
  color: string;
  quantity: number;
  unitPrice: number;
}

/** Everything the owner can edit on an invoice (the form state). */
export interface InvoiceDraft {
  customer: Customer;
  items: InvoiceItem[];
  deliveryZone: DeliveryZone;
  deliveryCharge: number;
  discount: number;
  advancePaid: number;
  advanceMethod: AdvanceMethod;
  note: string;
  rawOrderText: string;
}

export interface InvoiceTotals {
  subtotal: number;
  total: number;
  amountDue: number;
}

/** An invoice that has been saved and has a number. */
export interface Invoice extends InvoiceDraft {
  id: string;
  invoiceNo: string;
  totals: InvoiceTotals;
  createdAt: string;
  updatedAt: string;
}

/** A compact row for the history list. */
export interface InvoiceSummary {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerPhone: string;
  amountDue: number;
  total: number;
  createdAt: string;
}
