import type { Ref } from 'react';
import { Heart, MapPin, Phone } from 'lucide-react';
import logo from '@/assets/logo-main.webp';
import { BUSINESS, DELIVERY_ZONE_LABELS } from '@/config/business';
import type { AdvanceMethod, InvoiceDraft } from '@/types/invoice';
import { formatDate, formatMoney } from '@/utils/format';
import { calculateTotals, lineTotal } from '@/utils/invoiceCalc';

/** A4 at 96 dpi. The invoice is always laid out at this size, then scaled for the screen. */
export const INVOICE_WIDTH_PX = 794;
export const INVOICE_MIN_HEIGHT_PX = 1123;

const ADVANCE_LABELS: Record<AdvanceMethod, string> = {
  bkash: 'Advance Paid (bKash)',
  nagad: 'Advance Paid (Nagad)',
  none: 'Advance Paid',
};

interface InvoiceDocumentProps {
  draft: InvoiceDraft;
  /** `null` while the invoice hasn't been saved yet (shows "DRAFT"). */
  invoiceNo: string | null;
  issuedAt: string | Date;
  ref?: Ref<HTMLDivElement>;
}

/**
 * The printable invoice. This exact element is captured for the PDF/JPG,
 * so it uses fixed pixel sizes and must not depend on the screen width.
 */
export function InvoiceDocument({ draft, invoiceNo, issuedAt, ref }: InvoiceDocumentProps) {
  const totals = calculateTotals(draft);
  const isPaid = totals.amountDue === 0 && totals.total > 0;

  return (
    <div
      ref={ref}
      className="flex flex-col bg-white font-sans text-gray-800"
      style={{ width: INVOICE_WIDTH_PX, minHeight: INVOICE_MIN_HEIGHT_PX }}
    >
      {/* Header */}
      <header className="flex items-start justify-between bg-linear-to-br from-brand-100 via-brand-50 to-white px-12 pt-10 pb-7">
        <div>
          <img src={logo} alt={BUSINESS.name} width={230} height={145} className="h-auto w-[230px]" />
          <p className="mt-2 pl-1 text-[13px] font-medium italic text-brand-700">{BUSINESS.tagline}</p>
        </div>

        <div className="pt-2 text-right">
          <h1 className="text-[40px] leading-none font-bold tracking-[0.18em] text-brand-600">INVOICE</h1>
          <dl className="mt-5 space-y-1.5 text-[13px]">
            <div className="flex justify-end gap-3">
              <dt className="text-gray-500">Invoice No</dt>
              <dd className={`font-semibold ${invoiceNo ? 'text-gray-900' : 'text-brand-300'}`}>{invoiceNo ?? 'DRAFT'}</dd>
            </div>
            <div className="flex justify-end gap-3">
              <dt className="text-gray-500">Date</dt>
              <dd className="font-semibold text-gray-900">{formatDate(issuedAt)}</dd>
            </div>
          </dl>
          <span
            className={`mt-4 inline-block rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-[0.12em] ${
              isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-600 text-white'
            }`}
          >
            {isPaid ? 'PAID' : 'CASH ON DELIVERY'}
          </span>
        </div>
      </header>

      <div className="mx-12 h-[3px] rounded-full bg-linear-to-r from-gold-300 via-gold-500 to-gold-300" />

      {/* Billed to / From */}
      <section className="grid grid-cols-2 gap-10 px-12 py-8">
        <div>
          <SectionLabel>Billed To</SectionLabel>
          <p className="text-[18px] font-semibold text-gray-900">{draft.customer.name || '—'}</p>
          <p className="mt-2 flex items-center gap-2 text-[13px]">
            <Phone className="size-3.5 shrink-0 text-brand-500" />
            {draft.customer.phone || '—'}
          </p>
          <p className="mt-1.5 flex items-start gap-2 text-[13px] leading-relaxed">
            <MapPin className="mt-[3px] size-3.5 shrink-0 text-brand-500" />
            <span>
              {draft.customer.address || '—'}
              {draft.customer.thana && (
                <>
                  <br />
                  <span className="text-gray-500">Thana:</span> {draft.customer.thana}
                </>
              )}
            </span>
          </p>
        </div>

        <div className="text-right">
          <SectionLabel>From</SectionLabel>
          <p className="text-[18px] font-semibold text-gray-900">{BUSINESS.name}</p>
          <p className="mt-2 text-[13px]">
            <span className="text-gray-500">WhatsApp:</span> {BUSINESS.whatsapp}
          </p>
          <p className="mt-1.5 text-[13px]">
            <span className="text-gray-500">Facebook:</span> {BUSINESS.facebook}
          </p>
          <p className="mt-1.5 text-[13px]">
            <span className="text-gray-500">Delivery:</span> {DELIVERY_ZONE_LABELS[draft.deliveryZone]}
          </p>
        </div>
      </section>

      {/* Items */}
      <section className="px-12">
        <div className="overflow-hidden rounded-xl ring-1 ring-brand-100">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-brand-600 text-left text-[11px] font-semibold tracking-[0.1em] text-white uppercase">
                <th className="w-12 py-3 pl-5">#</th>
                <th className="py-3 pr-3">Item</th>
                <th className="py-3 pr-3">Color</th>
                <th className="w-16 py-3 pr-3 text-center">Qty</th>
                <th className="w-28 py-3 pr-3 text-right">Unit Price</th>
                <th className="w-32 py-3 pr-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {draft.items.map((item, index) => (
                <tr key={item.key} className={index % 2 === 1 ? 'bg-brand-50' : 'bg-white'}>
                  <td className="py-3.5 pl-5 text-gray-400">{String(index + 1).padStart(2, '0')}</td>
                  <td className="py-3.5 pr-3 font-medium text-gray-900">{item.productName || '—'}</td>
                  <td className="py-3.5 pr-3">{item.color || '—'}</td>
                  <td className="py-3.5 pr-3 text-center">{item.quantity}</td>
                  <td className="py-3.5 pr-3 text-right">{formatMoney(item.unitPrice)}</td>
                  <td className="py-3.5 pr-5 text-right font-semibold text-gray-900">{formatMoney(lineTotal(item))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payment info + totals */}
      <section className="grid grid-cols-[1fr_300px] gap-10 px-12 pt-8">
        <div className="space-y-5">
          <div className="rounded-xl bg-brand-50 p-5 ring-1 ring-brand-100">
            <SectionLabel>Payment Info</SectionLabel>
            <p className="text-[12px] leading-relaxed text-gray-600">
              Delivery charge is paid in advance. The amount due is collected in cash on delivery.
            </p>
            <div className="mt-3 grid grid-cols-[64px_1fr] gap-y-1 text-[13px]">
              <span className="font-semibold text-brand-700">bKash</span>
              <span>{BUSINESS.payment.bkash}</span>
              <span className="font-semibold text-brand-700">Nagad</span>
              <span>{BUSINESS.payment.nagad}</span>
            </div>
          </div>

          {draft.note.trim() && (
            <div>
              <SectionLabel>Note</SectionLabel>
              <p className="text-[13px] leading-relaxed whitespace-pre-line">{draft.note}</p>
            </div>
          )}
        </div>

        <div>
          <dl className="space-y-2.5 text-[13px]">
            <TotalRow label="Subtotal" value={formatMoney(totals.subtotal)} />
            <TotalRow
              label={`Delivery (${DELIVERY_ZONE_LABELS[draft.deliveryZone]})`}
              value={formatMoney(draft.deliveryCharge)}
            />
            {draft.discount > 0 && <TotalRow label="Discount" value={`− ${formatMoney(draft.discount)}`} />}
            <div className="border-t border-dashed border-brand-200 pt-2.5">
              <TotalRow label="Total" value={formatMoney(totals.total)} strong />
            </div>
            {draft.advancePaid > 0 && (
              <TotalRow label={ADVANCE_LABELS[draft.advanceMethod]} value={`− ${formatMoney(draft.advancePaid)}`} accent />
            )}
          </dl>

          <div className="mt-4 rounded-xl bg-linear-to-br from-brand-600 to-brand-700 px-5 py-4 text-white shadow-md shadow-brand-600/20">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-100 uppercase">Amount Due</p>
            <p className="text-[11px] text-brand-100">Cash on delivery</p>
            <p className="mt-1 text-[28px] leading-tight font-bold">{formatMoney(totals.amountDue)}</p>
          </div>
        </div>
      </section>

      {/* Footer — pushed to the bottom of the page */}
      <footer className="mt-auto pt-12">
        <div className="pb-6 text-center">
          <p className="text-[18px] font-semibold text-brand-600">Thank you for shopping with us!</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-gray-500 italic">
            {BUSINESS.tagline}
            <Heart className="size-3 fill-brand-500 text-brand-500" />
          </p>
        </div>
        <div className="h-[3px] bg-linear-to-r from-gold-300 via-gold-500 to-gold-300" />
        <div className="flex items-center justify-between bg-brand-600 px-12 py-3.5 text-[11px] text-white">
          <span>WhatsApp: {BUSINESS.whatsapp}</span>
          <span>Facebook: {BUSINESS.facebook}</span>
          <span className="text-brand-100 italic">{BUSINESS.tagline}</span>
        </div>
      </footer>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-brand-600 uppercase">{children}</p>;
}

interface TotalRowProps {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}

function TotalRow({ label, value, strong, accent }: TotalRowProps) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? 'text-[15px] font-semibold text-gray-900' : ''}`}>
      <dt className={strong ? '' : 'text-gray-500'}>{label}</dt>
      <dd className={accent ? 'font-medium text-emerald-600' : 'font-medium'}>{value}</dd>
    </div>
  );
}
