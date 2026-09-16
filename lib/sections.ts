/**
 * The page's sections, in scroll order — plain data, so both the server page
 * and the client nav can read it. (It cannot live in SiteNav.tsx: a value
 * exported from a 'use client' module reaches the server as a reference to a
 * client object, not the array itself.)
 *
 * `films` is the one section that can be absent: it exists only when staff
 * have uploaded a video, and the nav must never link to a section that is
 * not on the page.
 */
export const SECTION_IDS = ['menu', 'films', 'promotions', 'about', 'visit', 'contact'] as const;
export type SectionId = (typeof SECTION_IDS)[number];

/** The five permanent sections. */
export const CORE_SECTION_IDS: SectionId[] = ['menu', 'promotions', 'about', 'visit', 'contact'];

/** The sections a page renders, given whether it has any films to show. */
export function sectionsFor(hasFilms: boolean): SectionId[] {
  return hasFilms ? ['menu', 'films', 'promotions', 'about', 'visit', 'contact'] : CORE_SECTION_IDS;
}
