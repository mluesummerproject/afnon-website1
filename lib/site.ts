/**
 * ===========================================================================
 * AFNON — single source of truth for all business content.
 * ===========================================================================
 * Everything a non-developer might need to change lives in this file. No
 * component hardcodes an address, a phone number, a headline or an image.
 *
 * REPLACE BEFORE LAUNCH — the following are PLACEHOLDERS, not real data:
 *   · contact.phone / contact.telegram / contact.whatsapp / contact.email
 *   · social.*
 *   · hours.* (and `hoursNote`, which flags them as provisional in the UI)
 *   · location.addressLine (street is real; building/postcode are not known)
 *   · every entry in `images` (stock photography — swap for the restaurant's own)
 *
 * Nothing in this file asserts an opening year, an award, a chef, a review or
 * any other claim that has not been supplied by the client.
 * ===========================================================================
 */

export type NavLink = { label: string; href: string };

export type ImageAsset = {
  /** Absolute URL or a path under /public. Swap freely — sizes are declared by the layout. */
  src: string;
  /** Describes the photograph for screen readers. Rewrite when the image changes. */
  alt: string;
  /** CSS object-position, so a replacement photo can be re-framed without touching JSX. */
  focus?: string;
  /** Optional editorial caption shown in the gallery. */
  caption?: string;
};

export const brand = {
  name: 'Afnon',
  /** Shown beneath the wordmark in the header and footer. */
  descriptor: 'Restaurant · Tashkent',
  /** Used in <title>, OG tags and the footer statement. */
  tagline: 'Central Asian cooking on Qatortol Street',
  description:
    'Afnon is a restaurant on Qatortol Street in Tashkent — open fire, long tables and a menu built around the fruit that gives the room its colour.',
} as const;

export const nav: NavLink[] = [
  { label: 'Menu', href: '#menu' },
  { label: 'Story', href: '#story' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Location', href: '#location' },
];

export const hero = {
  eyebrow: 'Qatortol Street · Tashkent',
  /** Rendered as three staged lines. `accent` is set in display italic. */
  lines: ['A table', 'set beneath'] as string[],
  accentLine: 'the anor tree',
  lead:
    'Fire, smoke and long afternoons. Afnon cooks the food of Central Asia the way it is meant to be eaten — slowly, at a full table, with more on the way.',
  primaryCta: { label: 'Reserve a table', href: '#reserve' },
  secondaryCta: { label: 'Read the menu', href: '#menu' },
} as const;

export const story = {
  index: '01',
  kicker: 'The house',
  heading: 'Everything here begins with the anor.',
  paragraphs: [
    'The pomegranate — anor — is the colour of this room and the logic of this kitchen. Split, it is symmetry and abundance at once: hundreds of small things held in one shape. That is how we cook and how we lay a table.',
    'Charcoal is lit in the morning. Dough is worked by hand. Rice takes the time it takes. Nothing is plated to be photographed; it is brought out to be shared, in the order it is ready.',
  ],
  /** Small supporting facts. Keep to things that are true of the room itself. */
  notes: [
    { label: 'Cooking', value: 'Open charcoal & tandir' },
    { label: 'Table', value: 'Served family style' },
    { label: 'Room', value: 'Qatortol Street, Tashkent' },
  ],
} as const;

export const menuSection = {
  index: '02',
  kicker: 'The menu',
  heading: 'Read it like a letter from the kitchen.',
  lead:
    'The list changes with the market and the season. What is written here is what is being cooked today.',
  /**
   * Appended to prices that are stored as a plain number in Supabase.
   * Prices stored with their own formatting (e.g. "45 000 so‘m") are printed as-is.
   */
  currencySuffix: 'so‘m',
} as const;

export const gallerySection = {
  index: '03',
  kicker: 'The room',
  heading: 'An afternoon, more or less.',
} as const;

export const locationSection = {
  index: '04',
  kicker: 'Find us',
  heading: 'Qatortol Street, Tashkent.',
} as const;

export const reserveSection = {
  index: '05',
  kicker: 'Reservations',
  heading: 'Come hungry. Bring everyone.',
  lead:
    'Tables for two to twenty. Message us on Telegram or WhatsApp for the fastest answer, or call the restaurant directly.',
} as const;

export const location = {
  street: 'Qatortol Street',
  city: 'Tashkent',
  country: 'Uzbekistan',
  /** PLACEHOLDER — building number and postcode are not known. */
  addressLine: 'Building no. — · Postcode —',
  /** Address string used for the map embed and directions link. No invented coordinates. */
  mapQuery: 'Qatortol Street, Tashkent, Uzbekistan',
  directionsNote: 'Opens in Google Maps',
} as const;

/** PLACEHOLDER hours. `hoursNote` renders a visible provisional marker — delete it once confirmed. */
export const hours: { days: string; time: string }[] = [
  { days: 'Monday — Thursday', time: '11:00 — 23:00' },
  { days: 'Friday — Saturday', time: '11:00 — 00:00' },
  { days: 'Sunday', time: '11:00 — 22:00' },
];

export const hoursNote = 'Provisional hours — to be confirmed by the restaurant.';

/** PLACEHOLDER contact channels. Every value below is a stand-in. */
export const contact = {
  phone: { display: '+998 (00) 000 00 00', href: 'tel:+998000000000' },
  telegram: { display: '@afnon', href: 'https://t.me/afnon' },
  whatsapp: { display: 'wa.me/afnon', href: 'https://wa.me/998000000000' },
  email: { display: 'hello@afnon.uz', href: 'mailto:hello@afnon.uz' },
} as const;

/** PLACEHOLDER social links. Remove any channel the restaurant does not run. */
export const social: NavLink[] = [
  { label: 'Instagram', href: 'https://instagram.com/afnon' },
  { label: 'Telegram', href: 'https://t.me/afnon' },
];

/**
 * PLACEHOLDER photography (stock). Replace each `src` with the restaurant's own
 * images — the layout declares its own sizes and aspect ratios, so a swap needs
 * no CSS changes. Local files can live in /public/images and be referenced as
 * '/images/hero.jpg'.
 */
export const images = {
  hero: {
    src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=2400&q=80&fm=jpg&fit=max',
    alt: 'A plate being set down on a candlelit table during evening service.',
    focus: '58% 55%',
  },
  storyPrimary: {
    src: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=1400&q=80&fm=jpg&fit=max',
    alt: 'A cook finishing a dish under the warm lamps of a service pass.',
    focus: '50% 40%',
  },
  storyDetail: {
    src: 'https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=1000&q=80&fm=jpg&fit=max',
    alt: 'Whole and halved pomegranates packed together, seeds catching the light.',
    focus: '50% 50%',
  },
  menuFeature: {
    src: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&q=80&fm=jpg&fit=max',
    alt: 'A copper bowl of rice pilaf, photographed against a dark ground.',
    focus: '50% 50%',
  },
  locationRoom: {
    src: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=2000&q=80&fm=jpg&fit=max',
    alt: 'A cook’s hands working vegetables with a knife on a board, seen from above.',
    focus: '50% 55%',
  },
} satisfies Record<string, ImageAsset>;

/** Gallery is ordered: the first image is the dominant one. */
export const gallery: ImageAsset[] = [
  {
    src: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1800&q=80&fm=jpg&fit=max',
    alt: 'Skewers grilled over charcoal on a wooden board with flatbread and sauces.',
    focus: '55% 50%',
    caption: 'Straight off the skewer',
  },
  {
    src: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=1200&q=80&fm=jpg&fit=max',
    alt: 'Bowls of ground spices lined up in a market stall.',
    focus: '50% 50%',
    caption: 'The spice order',
  },
  {
    src: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80&fm=jpg&fit=max',
    alt: 'Round loaves of bread cooling beside stalks of wheat.',
    focus: '50% 50%',
    caption: 'Bread, still warm',
  },
  {
    src: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=1400&q=80&fm=jpg&fit=max',
    alt: 'Meat charred over coals, resting before it is carved.',
    focus: '50% 50%',
    caption: 'Off the coals',
  },
  {
    src: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=1200&q=80&fm=jpg&fit=max',
    alt: 'A glass of herbal tea beside loose leaves on a pale cloth.',
    focus: '50% 50%',
    caption: 'Tea, all afternoon',
  },
  {
    src: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1600&q=80&fm=jpg&fit=max',
    alt: 'A warmly lit dining room laid up with tables before service.',
    focus: '50% 50%',
    caption: 'The room, before service',
  },
];

export const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
  location.mapQuery,
)}&output=embed`;

export const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  location.mapQuery,
)}`;

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://afnon.example';
