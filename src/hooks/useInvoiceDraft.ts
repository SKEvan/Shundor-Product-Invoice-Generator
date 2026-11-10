import { useReducer } from 'react';
import { DELIVERY_CHARGES } from '@/config/business';
import type { Customer, DeliveryZone, InvoiceDraft, InvoiceItem } from '@/types/invoice';
import { emptyItem } from '@/utils/invoiceDraft';

export type EditableFields = Pick<InvoiceDraft, 'deliveryCharge' | 'discount' | 'advancePaid' | 'advanceMethod' | 'note'>;

export type DraftAction =
  | { type: 'replace'; draft: InvoiceDraft }
  | { type: 'setCustomer'; field: keyof Customer; value: string }
  | { type: 'addItem' }
  | { type: 'updateItem'; key: string; changes: Partial<Omit<InvoiceItem, 'key'>> }
  | { type: 'removeItem'; key: string }
  | { type: 'setZone'; zone: DeliveryZone }
  | { type: 'set'; changes: Partial<EditableFields> };

function draftReducer(draft: InvoiceDraft, action: DraftAction): InvoiceDraft {
  switch (action.type) {
    case 'replace':
      return action.draft;

    case 'setCustomer':
      return { ...draft, customer: { ...draft.customer, [action.field]: action.value } };

    case 'addItem':
      return { ...draft, items: [...draft.items, emptyItem()] };

    case 'updateItem':
      return {
        ...draft,
        items: draft.items.map((item) => (item.key === action.key ? { ...item, ...action.changes } : item)),
      };

    case 'removeItem': {
      const items = draft.items.filter((item) => item.key !== action.key);
      return { ...draft, items: items.length > 0 ? items : [emptyItem()] };
    }

    case 'setZone': {
      const deliveryCharge = DELIVERY_CHARGES[action.zone];
      // If the advance was simply the delivery charge, keep it in step with the new zone.
      const advancePaid = draft.advancePaid === draft.deliveryCharge ? deliveryCharge : draft.advancePaid;
      return { ...draft, deliveryZone: action.zone, deliveryCharge, advancePaid };
    }

    case 'set':
      return { ...draft, ...action.changes };
  }
}

/** Form state for one invoice. `dispatch` is passed to the form sections. */
export function useInvoiceDraft(initial: InvoiceDraft) {
  return useReducer(draftReducer, initial);
}
