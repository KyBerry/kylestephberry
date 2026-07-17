/**
 * Formats a date-only ISO string (e.g. '2026-06-26') for display.
 *
 * Date-only strings parse as UTC midnight, so formatting them in the local
 * timezone shifts the date back a day anywhere west of UTC. Formatting in
 * UTC keeps the rendered date identical to the frontmatter value.
 */
export function formatDate(iso: string, opts: { year?: boolean } = {}): string {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    ...(opts.year === false ? {} : { year: 'numeric' }),
  })
}
