import type { AdvanceMethod, Customer, DeliveryZone, InvoiceItem } from './invoice';

/** Result of reading a pasted order message (any format). */
export interface ParsedOrder {
  customer: Customer;
  items: InvoiceItem[];
  deliveryZone: DeliveryZone;
  /** False when the zone was a guess (no known area and no 80/120 charge in the message). */
  deliveryZoneDetected: boolean;
  /** From "Delivery 120tk" if the message says so, otherwise the zone's default. */
  deliveryCharge: number;
  discount: number;
  /** From "Advance …", worked out from "COD …", or the delivery charge by default. */
  advancePaid: number;
  advanceMethod: AdvanceMethod;
  /** Human-readable problems the owner should check, e.g. "Mobile number not found". */
  warnings: string[];
}
