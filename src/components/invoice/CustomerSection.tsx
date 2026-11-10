import type { Dispatch } from 'react';
import { Card } from '@/components/ui/Card';
import { TextAreaField, TextField } from '@/components/ui/fields';
import type { DraftAction } from '@/hooks/useInvoiceDraft';
import type { Customer } from '@/types/invoice';
import { isValidPhone, normalizePhone } from '@/utils/phone';

interface CustomerSectionProps {
  customer: Customer;
  dispatch: Dispatch<DraftAction>;
}

export function CustomerSection({ customer, dispatch }: CustomerSectionProps) {
  const set = (field: keyof Customer) => (value: string) => dispatch({ type: 'setCustomer', field, value });
  const phoneInvalid = customer.phone !== '' && !isValidPhone(customer.phone);

  return (
    <Card title="2. Customer">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Name" value={customer.name} onChange={set('name')} autoComplete="off" />
        <TextField
          label="Mobile number"
          value={customer.phone}
          onChange={set('phone')}
          onBlur={() => set('phone')(normalizePhone(customer.phone))}
          inputMode="tel"
          autoComplete="off"
          invalid={phoneInvalid}
          hint={phoneInvalid ? 'Should be 11 digits, e.g. 01712345678' : undefined}
        />
        <TextAreaField
          label="Address"
          value={customer.address}
          onChange={set('address')}
          rows={2}
          className="sm:col-span-2"
        />
        <TextField label="Thana" value={customer.thana} onChange={set('thana')} autoComplete="off" />
      </div>
    </Card>
  );
}
