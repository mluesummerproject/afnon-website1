# Afnon

Website and menu manager for Afnon, a restaurant on Qatortol Street, Tashkent.

- **Public site** (`/`): hero, story, live menu, gallery, location and hours, reservations.
- **Menu manager** (`/admin`): password-protected. Staff can add, edit, reorder, hide and delete dishes.

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
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | server | Read-only public key. Either name works. |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Needed for every admin write. Never add a `NEXT_PUBLIC_` prefix. |
| `ADMIN_PASSWORD` | server only | The shared staff password for `/admin`. |

Add the same variables in your host's settings (for example Vercel → Project → Settings → Environment Variables).

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |

## Editing content

**All business content lives in [`lib/site.ts`](lib/site.ts)**: name, copy, address, hours, phone, Telegram, WhatsApp, social links and every photograph. No component hardcodes any of this.

Before launch, replace the placeholders listed at the top of that file:

- phone, Telegram, WhatsApp and email
- social links
- opening hours (then delete `hoursNote`, which marks them as provisional on the page)
- building number and postcode
- all photography. The current images are stock placeholders. Each image has an `alt` and a `focus` (CSS object-position), so you can swap one without touching any CSS. Local files go in `public/images/` and are referenced as `/images/name.jpg`.

Menu items are **not** in this file. They come from Supabase and are managed at `/admin`.

## How the menu works

- Table: `menu_items` (`id`, `category`, `name`, `description`, `price`, `image_url`, `is_available`, `sort_order`).
- The public page reads the table with the read-only key (`lib/supabase.ts`, `lib/menu.ts`).
- Categories appear in the order of their lowest `sort_order`. Dishes inside a category follow `sort_order`.
- `price` is text. Plain numbers such as `45000` are shown as `45 000 so‘m`. Any other text is shown exactly as typed.
- Unavailable dishes stay on the menu, dimmed and labelled "Unavailable".
- **Freshness:** the home page is statically rendered and revalidated every 5 minutes. Every admin change also clears the `menu` cache tag and the `/` path, so edits show up right away without a redeploy.

## How the admin is secured

- The password is checked only on the server, in a Server Action, using a constant-time comparison.
- A successful login sets a signed, `httpOnly`, `SameSite=Lax` cookie that lasts 8 hours. The cookie is marked `Secure` in production.
- The signing key is derived from `ADMIN_PASSWORD`, so changing the password signs everyone out.
- `/admin` is guarded by a server layout. **Every** Server Action also checks the session again on its own.
- Writes use a separate service-role client (`lib/supabase-admin.ts`) marked `server-only`. The build fails if a Client Component imports it.

## Project structure

```
app/
  page.tsx                  home page (composes the sections)
  layout.tsx                fonts, metadata, motion config
  globals.css               design tokens (colours, rhythm, arch mask)
  admin/
    actions.ts              server actions: login, logout, CRUD, reorder
    login/page.tsx
    (dashboard)/layout.tsx  auth guard
    (dashboard)/page.tsx    menu manager
components/
  site/                     header, hero, story, menu, gallery, location, reserve, footer
  admin/                    login form, item form, item row, disclosure, submit button
  ui/                       shared primitives: Action, Reveal, SectionHeading, ArchFrame, AnorMark
lib/
  site.ts                   ALL editable business content
  menu.ts                   menu reads, grouping, price formatting, reorder logic
  supabase.ts               public read-only client
  supabase-admin.ts         server-only write client
  auth.ts                   admin session
  motion.ts                 shared easing and durations
  types.ts
tailwind.config.ts          semantic tokens: colour, type scale, spacing, radii
```
