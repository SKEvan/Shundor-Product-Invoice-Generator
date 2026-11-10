import type { Dispatch, ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { NumberField, TextAreaField } from '@/components/ui/fields';
import { DELIVERY_CHARGES, DELIVERY_ZONE_LABELS } from '@/config/business';
import type { DraftAction, EditableFields } from '@/hooks/useInvoiceDraft';
import type { AdvanceMethod, DeliveryZone, InvoiceDraft } from '@/types/invoice';

interface ChargesSectionProps {
  draft: InvoiceDraft;
  dispatch: Dispatch<DraftAction>;
  /** Shown under the zone buttons, e.g. "Detected from thana" or a warning. */
  zoneHint?: ReactNode;
}

const ZONES: DeliveryZone[] = ['inside_dhaka', 'outside_dhaka'];
const ADVANCE_METHODS: { value: AdvanceMethod; label: string }[] = [
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'none', label: 'Not paid' },
];

/** Step 4: delivery zone, charge, discount and the advance the buyer sent. */
export function ChargesSection({ draft, dispatch, zoneHint }: ChargesSectionProps) {
  const set = (changes: Partial<EditableFields>) => dispatch({ type: 'set', changes });

  return (
    <Card title="4. Delivery & payment">
      <p className="mb-1 text-xs font-medium text-gray-600">Delivery zone</p>
      <SegmentedControl
        options={ZONES.map((zone) => ({
          value: zone,
          label: `${DELIVERY_ZONE_LABELS[zone]} · Tk ${DELIVERY_CHARGES[zone]}`,
        }))}
        value={draft.deliveryZone}
        onChange={(zone) => dispatch({ type: 'setZone', zone })}
      />
      {zoneHint && <div className="mt-1.5 text-xs">{zoneHint}</div>}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <NumberField label="Delivery charge (Tk)" value={draft.deliveryCharge} onChange={(deliveryCharge) => set({ deliveryCharge })} />
        <NumberField label="Discount (Tk)" value={draft.discount} onChange={(discount) => set({ discount })} />
        <NumberField
          label="Advance paid (Tk)"
          value={draft.advancePaid}
          onChange={(advancePaid) => set({ advancePaid, advanceMethod: advancePaid === 0 ? 'none' : draft.advanceMethod })}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <p className="mt-4 mb-1 text-xs font-medium text-gray-600">Advance paid via</p>
      <SegmentedControl
        options={ADVANCE_METHODS}
        value={draft.advanceMethod}
        onChange={(advanceMethod) =>
          set({ advanceMethod, advancePaid: advanceMethod === 'none' ? 0 : draft.advancePaid || draft.deliveryCharge })
        }
      />

      <TextAreaField
        label="Note on invoice (optional)"
        value={draft.note}
        onChange={(note) => set({ note })}
        rows={2}
        placeholder="e.g. Exchange within 3 days with invoice"
        className="mt-4"
      />
    </Card>
  );
}

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="flex gap-1 rounded-xl bg-brand-50 p-1 ring-1 ring-brand-100" role="radiogroup">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`min-h-10 flex-1 rounded-lg px-2 text-xs font-semibold transition-colors sm:text-sm ${
              active ? 'bg-brand-600 text-white shadow-sm' : 'text-brand-800 hover:bg-brand-100'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
