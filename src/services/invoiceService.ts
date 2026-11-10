import type { Invoice, InvoiceDraft, InvoiceSummary } from '@/types/invoice';
import { draftToRpcArgs, rowToInvoice, rowToSummary, type InvoiceRow, type InvoiceSummaryRow } from './invoiceMapper';
import { getSupabase } from './supabaseClient';

const SUMMARY_COLUMNS = 'id, invoice_no, customer_name, customer_phone, amount_due, total, created_at';
export const PAGE_SIZE = 30;

/** Saves a new invoice. The database assigns the next monthly number (SP-YYMM-NNN). */
export async function createInvoice(draft: InvoiceDraft): Promise<Invoice> {
  const { data, error } = await getSupabase().rpc('create_invoice', draftToRpcArgs(draft));
  if (error) throw new Error(`Couldn't save the invoice: ${error.message}`);
  return rowToInvoice(data as InvoiceRow);
}

/** Saves changes to an existing invoice. Its number stays the same. */
export async function updateInvoice(id: string, draft: InvoiceDraft): Promise<Invoice> {
  const { data, error } = await getSupabase().rpc('update_invoice', { p_id: id, ...draftToRpcArgs(draft) });
  if (error) throw new Error(`Couldn't update the invoice: ${error.message}`);
  return rowToInvoice(data as InvoiceRow);
}

export async function getInvoice(id: string): Promise<Invoice> {
  const { data, error } = await getSupabase()
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', id)
    .single();
  if (error) throw new Error(`Couldn't load the invoice: ${error.message}`);
  return rowToInvoice(data as InvoiceRow);
}

/**
 * Newest first. `search` matches invoice number, customer name or phone.
 * `page` is 0-based.
 */
export async function listInvoices({ search = '', page = 0 } = {}): Promise<InvoiceSummary[]> {
  let query = getSupabase()
    .from('invoices')
    .select(SUMMARY_COLUMNS)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  // Characters with special meaning in PostgREST filters are removed.
  const term = search.replace(/[,()%*\\]/g, ' ').trim();
  if (term) {
    query = query.or(`invoice_no.ilike.%${term}%,customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Couldn't load invoices: ${error.message}`);
  return (data as InvoiceSummaryRow[]).map(rowToSummary);
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await getSupabase().from('invoices').delete().eq('id', id);
  if (error) throw new Error(`Couldn't delete the invoice: ${error.message}`);
}
