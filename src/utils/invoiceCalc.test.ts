import { describe, expect, it } from 'vitest';
import { calculateTotals } from './invoiceCalc';

const item = (quantity: number, unitPrice: number) => ({ key: 'k', productName: 'x', color: '', quantity, unitPrice });

describe('calculateTotals', () => {
  it('adds delivery, subtracts discount and the advance', () => {
    expect(
      calculateTotals({ items: [item(2, 450), item(1, 1200)], deliveryCharge: 80, discount: 50, advancePaid: 80 }),
    ).toEqual({ subtotal: 2100, total: 2130, amountDue: 2050 });
  });

  it('never returns a negative amount due', () => {
    expect(calculateTotals({ items: [item(1, 100)], deliveryCharge: 0, discount: 0, advancePaid: 500 }).amountDue).toBe(0);
  });
});
