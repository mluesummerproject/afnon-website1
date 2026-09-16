# Afnon

Website and staff panel for Afnon, a restaurant on Qatortol Street, Tashkent.

- **Public site** (`/`): cinematic hero, story, live menu with dish photos and per-dish Telegram ordering, films, gallery, location and hours, reservations, and a question form. Available in **Uzbek (default), Russian and English**.
- **Staff panel** (`/admin`): password-protected. **Menu** (dishes in three languages, photos, availability, ordering), **Films** (upload, show/hide, order) and **Inbox** (questions sent from the website).

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion and Supabase.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
npm run dev                        # http://localhost:3000
```

| Variable | Where it's used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | server | Public key. Used only for public reads and for inserting visitor messages. Either name works. |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Every staff read and write, signed upload URLs, and the message rate-limit check. Never add a `NEXT_PUBLIC_` prefix. |
| `ADMIN_PASSWORD` | server only | The shared staff password for `/admin`. |

Set the same variables in your host's settings (for example Vercel → Project → Settings → Environment Variables).

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |

## Where to change things

| What | File |
| --- | --- |
| Every word visitors read, in all three languages (hero, story, labels, form messages, hours, alt text) | [`lib/i18n.ts`](lib/i18n.ts) |
| Category name translations | `categoryTranslations` in [`lib/i18n.ts`](lib/i18n.ts) |
| Telegram username, phone, WhatsApp, email, social links, map address, photography | [`lib/site.ts`](lib/site.ts) |
| Colours, type scale, spacing | [`app/globals.css`](app/globals.css) and [`tailwind.config.ts`](tailwind.config.ts) |
| Dishes, dish photos, films, messages | Staff panel at `/admin` — no code |

**Placeholders to replace before launch** (all marked in those files): phone, Telegram username, WhatsApp, email, social links, opening hours, building number and postcode, stock photography, and the story's narrative copy (not verified facts). Also confirm the Russian spelling of the street, "улица Катартал".

## Languages

- Uzbek is the default. The visitor's choice is stored for a year in the `afnon_lang` cookie, and `<html lang>`, the title, the description and Open Graph tags follow it.
- Menu text uses `name_uz/ru/en` and `description_uz/ru/en`. Missing text falls back **selected language → Uzbek → the original column**. Empty and whitespace-only values count as missing, so a heading is never blank.
- The database has no translated category columns. Categories are translated through `categoryTranslations`: a category typed in any one of the three languages is recognised, and unknown categories are shown as typed.
- Russian uses deliberately matched Cyrillic companion typefaces (Noto Serif Display, set condensed, and Onest). Uzbek and English visitors never download them.

## Menu photos and films

- Files live in the public `media` bucket: `menu/{dish id}/{uuid}.jpg` and `videos/{uuid}.{ext}`.
- **Uploads go straight from the phone to Storage** through a one-time signed URL for a path the server chooses. Large videos therefore never pass through a serverless function.
- Before sending, photos are resized in the browser (longest edge 2000 px) and re-encoded. That typically turns a 2–6 MB camera photo into about 500 KB and strips location metadata.
- Only after the server has re-read a file's first bytes, and confirmed it really is an image or video within the size limits, does a database row get created. Anything else is deleted.
- Deleting a photo, film or dish removes the storage files too. A sweep also clears leftovers from uploads that were started but never finished.
- Up to 5 active films show on the website. Only the film on screen loads and plays (muted); it pauses when scrolled away, and nothing autoplays with reduced motion or Data Saver on. **MP4 (H.264) plays everywhere**; MOV files from iPhones may not play in every browser.

## Contact form and inbox

- Visitors can send a name, a phone number or Telegram username, and a message. Only those three fields are ever inserted, through the public insert policy. The public key cannot read messages.
- Invisible abuse protection: a honeypot field, a signed render-time token, a per-visitor rate limit, and silent de-duplication of repeated submissions.
- Staff read messages only on the server, at `/admin/inbox`, newest first. Unread messages are marked, and the nav shows an unread count. Phone numbers and Telegram usernames become tap-to-reply links.

## Ordering via Telegram

Each available dish has an "Order via Telegram" link to `https://t.me/<username>?text=…`. The message is prefilled in the visitor's language with the dish name as shown. The username is set once, as `contact.telegramUsername` in `lib/site.ts`. There is no cart or checkout by design.

## Admin security

- The password is checked only on the server, in constant time. The session is a signed, `httpOnly`, `SameSite=Lax` cookie (`Secure` in production) that lasts 8 hours, and changing `ADMIN_PASSWORD` signs everyone out.
- The admin routes are guarded by a server layout, **and every Server Action checks the session again** (`requireAdmin()` in `lib/admin.ts`).
- Privileged database access (`lib/supabase-admin.ts`) and all storage operations (`lib/storage.ts`) are `server-only`; the build fails if a Client Component imports them.

## Freshness

The home page renders per request (it depends on the language cookie), but Supabase reads stay in Next's data cache for up to 5 minutes. Every staff change clears that cache immediately, so edits appear without a redeploy.

## Project structure

```
app/
  page.tsx, layout.tsx, not-found.tsx, globals.css
  actions/locale.ts          set the language cookie
  actions/contact.ts         receive a visitor's message
  admin/actions.ts           login, logout, dish CRUD, ordering
  admin/media-actions.ts     photo + film uploads, order, show/hide, delete
  admin/inbox-actions.ts     read / unread
  admin/(dashboard)/         guard + shell, menu, videos, inbox pages
components/
  site/                      header, language switcher, hero, story, menu (+ photo viewer), films, gallery, location, reserve, contact form, footer
  admin/                     menu manager, dish row, dish form, photo manager, film manager, toaster, shared action helpers
  ui/                        Action, ArchFrame, SectionHeading, Reveal, motion/ (MaskedWords, RuleDraw, ImageReveal, Parallax)
lib/
  i18n.ts                    all copy + fallback + category translations
  site.ts                    business facts + photography
  menu.ts, menu-format.ts    localized menu read, price and slug formatting
  ordering.ts                shared ordering rules (public and admin agree)
  videos.ts, admin-data.ts   reads
  media.ts, storage.ts       upload rules, byte sniffing, storage helpers
  contact.ts, antispam.ts    form validation and abuse protection
  telegram.ts                safe t.me link building
  auth.ts, admin.ts          session and the admin guard
  supabase.ts, supabase-admin.ts
```
