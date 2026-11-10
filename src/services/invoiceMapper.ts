import type { Invoice, InvoiceDraft, InvoiceSummary } from '@/types/invoice';
import { createKey } from '@/utils/createKey';

/**
 * Converts between the database shape (snake_case rows) and the app shape
 * (camelCase objects). Keeping this in one place means the rest of the app
 * never sees database column names.
 */

export interface InvoiceItemRow {
  id: string;
  position: number;
  product_name: string;
  color: string;
  quantity: number;
  unit_price: number | string;
  line_total: number | string;
}

export interface InvoiceRow {
  id: string;
  invoice_no: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_thana: string;
  delivery_zone: Invoice['deliveryZone'];
  delivery_charge: number | string;
  discount: number | string;
  advance_paid: number | string;
  advance_method: Invoice['advanceMethod'];
  subtotal: number | string;
  total: number | string;
  amount_due: number | string;
  note: string;
  raw_order_text: string;
  created_at: string;
  updated_at: string;
  invoice_items?: InvoiceItemRow[];
}

export type InvoiceSummaryRow = Pick<
  InvoiceRow,
  'id' | 'invoice_no' | 'customer_name' | 'customer_phone' | 'amount_due' | 'total' | 'created_at'
>;

export function rowToInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    invoiceNo: row.invoice_no,
    customer: {
      name: row.customer_name,
      phone: row.customer_phone,
      address: row.customer_address,
      thana: row.customer_thana,
    },
    items: [...(row.invoice_items ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        key: item.id ?? createKey(),
        productName: item.product_name,
        color: item.color,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
      })),
    deliveryZone: row.delivery_zone,
    deliveryCharge: Number(row.delivery_charge),
    discount: Number(row.discount),
    advancePaid: Number(row.advance_paid),
    advanceMethod: row.advance_method,
    note: row.note,
    rawOrderText: row.raw_order_text,
    totals: {
      subtotal: Number(row.subtotal),
      total: Number(row.total),
      amountDue: Number(row.amount_due),
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToSummary(row: InvoiceSummaryRow): InvoiceSummary {
  return {
    id: row.id,
    invoiceNo: row.invoice_no,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    amountDue: Number(row.amount_due),
    total: Number(row.total),
    createdAt: row.created_at,
  };
}

/** Arguments for the `create_invoice` / `update_invoice` database functions. */
export function draftToRpcArgs(draft: InvoiceDraft) {
  return {
    p_invoice: {
      customer_name: draft.customer.name,
      customer_phone: draft.customer.phone,
      customer_address: draft.customer.address,
      customer_thana: draft.customer.thana,
      delivery_zone: draft.deliveryZone,
      delivery_charge: draft.deliveryCharge,
      discount: draft.discount,
      advance_paid: draft.advancePaid,
      advance_method: draft.advanceMethod,
      note: draft.note,
      raw_order_text: draft.rawOrderText,
    },
    p_items: draft.items.map((item) => ({
      product_name: item.productName,
      color: item.color,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    })),
  };
}
