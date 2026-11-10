import { describe, expect, it } from 'vitest';
import { parseItems } from './itemParser';

const simplify = (text: string) =>
  parseItems(text).map(({ productName, color, quantity, unitPrice }) => ({ productName, color, quantity, unitPrice }));

describe('parseItems', () => {
  it('splits comma-separated items with colours and quantities', () => {
    expect(simplify('Lipstick Red x2, Handbag Black 1')).toEqual([
      { productName: 'Lipstick', color: 'Red', quantity: 2, unitPrice: 0 },
      { productName: 'Handbag', color: 'Black', quantity: 1, unitPrice: 0 },
    ]);
  });

  it('joins detail-only parts back to their item', () => {
    expect(simplify('Lipstick, Red, 2')).toEqual([{ productName: 'Lipstick', color: 'Red', quantity: 2, unitPrice: 0 }]);
    expect(simplify('Kurti\nColor: Light Pink\nQty: 3')).toEqual([
      { productName: 'Kurti', color: 'Light Pink', quantity: 3, unitPrice: 0 },
    ]);
  });

  it('understands many quantity styles', () => {
    expect(simplify('Bag ×3')[0].quantity).toBe(3);
    expect(simplify('Bag 3x')[0].quantity).toBe(3);
    expect(simplify('Bag 3 pcs')[0].quantity).toBe(3);
    expect(simplify('Bag (2)')[0].quantity).toBe(2);
    expect(simplify('Bag - 4')[0].quantity).toBe(4);
    expect(simplify('2 Bags')[0]).toMatchObject({ productName: 'Bags', quantity: 2 });
    expect(simplify('Bag ২টা')[0].quantity).toBe(2);
    expect(simplify('Bag')[0].quantity).toBe(1);
  });

  it('keeps numbers that belong to the product name', () => {
    expect(simplify('Face serum 30ml')[0]).toMatchObject({ productName: 'Face serum 30ml', quantity: 1 });
  });

  it('picks up a price if the owner typed one', () => {
    expect(simplify('Lipstick red 2pcs 450tk')).toEqual([
      { productName: 'Lipstick', color: 'Red', quantity: 2, unitPrice: 450 },
    ]);
    expect(simplify('Bag black @ 1200')[0].unitPrice).toBe(1200);
  });

  it('removes list numbering and ignores empty lines', () => {
    expect(simplify('1. Watch silver\n\n2) Ring gold 2').map((i) => i.productName)).toEqual(['Watch', 'Ring']);
  });
});
