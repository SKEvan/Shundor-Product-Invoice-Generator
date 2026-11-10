import { describe, expect, it } from 'vitest';
import { guessDeliveryZone } from './delivery';

describe('guessDeliveryZone', () => {
  it('detects Dhaka city areas', () => {
    expect(guessDeliveryZone('Mirpur', 'Mirpur 10, Dhaka')).toEqual({ zone: 'inside_dhaka', detected: true });
    expect(guessDeliveryZone('', 'Sher-e-Bangla Nagar')).toEqual({ zone: 'inside_dhaka', detected: true });
  });

  it('prefers outside places when both appear', () => {
    expect(guessDeliveryZone('Kotwali', 'Chattogram')).toEqual({ zone: 'outside_dhaka', detected: true });
    expect(guessDeliveryZone('Savar', 'Dhaka')).toEqual({ zone: 'outside_dhaka', detected: true });
  });

  it('flags unknown places', () => {
    expect(guessDeliveryZone('', 'Dhaka')).toEqual({ zone: 'outside_dhaka', detected: false });
  });
});
