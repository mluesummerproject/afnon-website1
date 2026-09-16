/**
 * Scrollspy and jump maths — pure, so they can be tested without a browser.
 * `tops` are each category heading's distance from the top of the viewport.
 */

/** The last section whose heading has reached the sticky offset line; the first one otherwise. */
export function activeIndex(tops: number[], offset: number): number {
  let active = 0;
  for (let index = 0; index < tops.length; index += 1) {
    if (tops[index] - offset <= 1) active = index;
    else break;
  }
  return active;
}

/** Page Y to scroll to so a heading lands exactly under the sticky header and category strip. */
export function jumpTarget(currentScrollY: number, headingTop: number, offset: number): number {
  return Math.max(0, Math.round(currentScrollY + headingTop - offset));
}

/** Horizontal scroll that centres a pill in the strip, clamped to the strip's range. */
export function centerPill(pillLeft: number, pillWidth: number, stripWidth: number, scrollWidth: number): number {
  const target = pillLeft - (stripWidth - pillWidth) / 2;
  return Math.max(0, Math.min(Math.round(target), Math.max(0, scrollWidth - stripWidth)));
}
