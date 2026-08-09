// Dates in frontmatter are plain days (2026-08-08), which parse as UTC midnight.
// Format them in UTC or they render a day early west of Greenwich.

/**
 * Long form date, for reading.
 * @param d date to format
 * @returns e.g. "August 8, 2026"
 */
export function long(d: Date): string {
  return d.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Short form date, for list rows.
 * @param d date to format
 * @returns e.g. "Aug 2026"
 */
export function short(d: Date): string {
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', timeZone: 'UTC' });
}

/**
 * Machine readable date.
 * @param d date to format
 * @returns e.g. "2026-08-08"
 */
export function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
