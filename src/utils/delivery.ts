import { INSIDE_DHAKA_AREAS, OUTSIDE_DHAKA_AREAS } from '@/config/dhakaAreas';
import type { DeliveryZone } from '@/types/invoice';

export interface ZoneGuess {
  zone: DeliveryZone;
  /** False when nothing matched and Outside Dhaka was assumed. */
  detected: boolean;
}

function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z'\s-]/g, ' ').replace(/\s+/g, ' ')} `;
}

function mentions(haystack: string, area: string): boolean {
  return haystack.includes(` ${area} `);
}

/**
 * Guesses Inside/Outside Dhaka from the thana and address.
 * Outside places win (e.g. "Savar, Dhaka" → outside). If nothing is
 * recognised we assume Outside Dhaka and flag it so the owner checks.
 */
export function guessDeliveryZone(thana: string, address: string): ZoneGuess {
  const text = normalize(`${thana} ${address}`);
  if (OUTSIDE_DHAKA_AREAS.some((area) => mentions(text, area))) {
    return { zone: 'outside_dhaka', detected: true };
  }
  if (INSIDE_DHAKA_AREAS.some((area) => mentions(text, area))) {
    return { zone: 'inside_dhaka', detected: true };
  }
  return { zone: 'outside_dhaka', detected: false };
}

/** True if the text names any area we know (inside or outside Dhaka). */
export function mentionsKnownArea(text: string): boolean {
  const normalized = normalize(text);
  return [...OUTSIDE_DHAKA_AREAS, ...INSIDE_DHAKA_AREAS].some((area) => mentions(normalized, area));
}

/** The first Dhaka city area named in the text, e.g. "Mirpur 10, Dhaka" → "mirpur". */
export function findInsideDhakaArea(text: string): string | null {
  const normalized = normalize(text);
  return INSIDE_DHAKA_AREAS.find((area) => mentions(normalized, area)) ?? null;
}
