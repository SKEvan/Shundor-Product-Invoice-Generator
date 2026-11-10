import type { DeliveryZone } from '@/types/invoice';

/**
 * Business details printed on every invoice.
 * Edit here if a phone number or charge changes — nothing else needs touching.
 */
export const BUSINESS = {
  name: 'Shundor Product',
  tagline: 'You are thinking, we are bringing',
  whatsapp: '01608797030',
  facebook: 'Shundor Product',
  payment: {
    bkash: '01736528481',
    nagad: '01858931317',
  },
  invoicePrefix: 'SP',
} as const;

export const DELIVERY_CHARGES: Record<DeliveryZone, number> = {
  inside_dhaka: 80,
  outside_dhaka: 120,
};

export const DELIVERY_ZONE_LABELS: Record<DeliveryZone, string> = {
  inside_dhaka: 'Inside Dhaka',
  outside_dhaka: 'Outside Dhaka',
};
