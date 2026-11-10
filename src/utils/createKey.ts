let counter = 0;

/** A short unique key for React list items that don't have a database id yet. */
export function createKey(): string {
  counter += 1;
  return `k${Date.now().toString(36)}${counter}`;
}
