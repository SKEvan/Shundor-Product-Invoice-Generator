import { describe, expect, it } from 'vitest';
import { parseMoneyLine } from './moneyLines';

describe('parseMoneyLine', () => {
  it.each([
    ['Price 500tk', { key: 'price', amount: 500 }],
    ['Total price: 1,200/-', { key: 'price', amount: 1200 }],
    ['দাম ৫০০ টাকা', { key: 'price', amount: 500 }],
    ['Delivery 120tk', { key: 'delivery', amount: 120 }],
    ['Delivery charge (inside Dhaka): 80', { key: 'delivery', amount: 80 }],
    ['DC 120', { key: 'delivery', amount: 120 }],
    ['Cod 620tk', { key: 'cod', amount: 620 }],
    ['Total due 620', { key: 'cod', amount: 620 }],
    ['Condition 1500 taka', { key: 'cod', amount: 1500 }],
    ['Discount 50', { key: 'discount', amount: 50 }],
    ['Grand total = 1,070', { key: 'total', amount: 1070 }],
    ['Advance 80 paid', { key: 'advance', amount: 80 }],
    ['Bkash 120 paid', { key: 'advance', amount: 120, method: 'bkash' }],
    ['Paid 80 via Nagad', { key: 'advance', amount: 80, method: 'nagad' }],
  ])('%s', (line, expected) => {
    expect(parseMoneyLine(line)).toMatchObject(expected);
  });

  it.each([
    'Bkash- 01736528481', // a phone number, not an amount
    'এবং ডেলিভারি চার্জ পরিমান টাকা ঢাকার ভিতরে ৮০টাকা এবং ঢাকার বাইরে ১২০ টাকা এডভান্স করতে হবে।',
    'Delivery bag black', // a product
    'Kitty clock',
    'Code 50', // "Code" is not "Cod"
  ])('ignores %s', (line) => {
    expect(parseMoneyLine(line)).toBeNull();
  });
});
