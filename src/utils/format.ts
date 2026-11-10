const DHAKA_TZ = 'Asia/Dhaka';

const moneyFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

/** 1250 → "Tk 1,250" */
export function formatMoney(amount: number): string {
  return `Tk ${moneyFormatter.format(amount)}`;
}

/** ISO date → "10 Nov 2026" (Dhaka time). */
export function formatDate(iso: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: DHAKA_TZ }).format(
    new Date(iso),
  );
}

/** ISO date → "November 2026" (Dhaka time), used to group the history list. */
export function formatMonth(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: DHAKA_TZ }).format(new Date(iso));
}

/** "rahim  uddin" → "Rahim Uddin" (keeps the rest of each word as typed). */
export function capitalizeWords(text: string): string {
  return text.replace(/\s+/g, ' ').trim().replace(/(^|\s)(\p{Ll})/gu, (_, space: string, ch: string) => space + ch.toUpperCase());
}
