import type { Dispatch } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { NumberField, TextField } from '@/components/ui/fields';
import type { DraftAction } from '@/hooks/useInvoiceDraft';
import type { InvoiceItem } from '@/types/invoice';
import { formatMoney } from '@/utils/format';
import { lineTotal } from '@/utils/invoiceCalc';

interface ItemsSectionProps {
  items: InvoiceItem[];
  dispatch: Dispatch<DraftAction>;
}

/** Step 3: products, colours, quantities and the price the owner types for each. */
export function ItemsSection({ items, dispatch }: ItemsSectionProps) {
  return (
    <Card
      title="3. Products & prices"
      action={
        <Button variant="ghost" icon={<Plus className="size-4" />} onClick={() => dispatch({ type: 'addItem' })}>
          Add item
        </Button>
      }
    >
      <ul className="space-y-3">
        {items.map((item, index) => (
          <ItemRow key={item.key} item={item} index={index} canRemove={items.length > 1} dispatch={dispatch} />
        ))}
      </ul>
    </Card>
  );
}

interface ItemRowProps {
  item: InvoiceItem;
  index: number;
  canRemove: boolean;
  dispatch: Dispatch<DraftAction>;
}

function ItemRow({ item, index, canRemove, dispatch }: ItemRowProps) {
  const update = (changes: Partial<Omit<InvoiceItem, 'key'>>) => dispatch({ type: 'updateItem', key: item.key, changes });
  const missingPrice = item.productName.trim() !== '' && item.unitPrice <= 0;

  return (
    <li className="rounded-xl bg-brand-50/60 p-3 ring-1 ring-brand-100">
      <div className="grid grid-cols-12 gap-2">
        <TextField
          label={`Item ${index + 1}`}
          value={item.productName}
          onChange={(productName) => update({ productName })}
          placeholder="Product name"
          className="col-span-12 sm:col-span-4"
        />
        <TextField
          label="Color"
          value={item.color}
          onChange={(color) => update({ color })}
          placeholder="—"
          className="col-span-5 sm:col-span-3"
        />
        <NumberField
          label="Qty"
          value={item.quantity}
          onChange={(quantity) => update({ quantity: Math.floor(quantity) })}
          inputMode="numeric"
          className="col-span-3 sm:col-span-2"
        />
        <NumberField
          label="Price (Tk)"
          value={item.unitPrice}
          onChange={(unitPrice) => update({ unitPrice })}
          invalid={missingPrice}
          className="col-span-4 sm:col-span-3"
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Amount: <span className="font-semibold text-gray-900">{formatMoney(lineTotal(item))}</span>
        </p>
        {canRemove && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'removeItem', key: item.key })}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="size-3.5" /> Remove
          </button>
        )}
      </div>
    </li>
  );
}
