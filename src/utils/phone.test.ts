import { describe, expect, it } from 'vitest';
import { isValidPhone, normalizePhone } from './phone';

describe('normalizePhone', () => {
  it.each([
    ['01712345678', '01712345678'],
    ['+8801712345678', '01712345678'],
    ['8801712345678', '01712345678'],
    ['01712-345 678', '01712345678'],
    ['০১৭১২৩৪৫৬৭৮', '01712345678'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });
});

describe('isValidPhone', () => {
  it('accepts 013–019 numbers only', () => {
    expect(isValidPhone('01712345678')).toBe(true);
    expect(isValidPhone('01312345678')).toBe(true);
    expect(isValidPhone('01212345678')).toBe(false);
    expect(isValidPhone('0171234567')).toBe(false);
  });
});
