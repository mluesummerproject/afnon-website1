import { getAdminLocaleAndDict } from '@/lib/admin-locale';
import { brand } from '@/lib/site';

/**
 * The staff panel's own web app manifest, so a phone's "Add to Home screen"
 * opens /admin full screen under the panel's name — separate from the public
 * site, which stays an ordinary web page. Named in the panel's language.
 */
export function GET() {
  const { dict } = getAdminLocaleAndDict();
  const manifest = {
    name: `${brand.name} — ${dict.login.subtitle}`,
    short_name: dict.shell.appName,
    start_url: '/admin',
    scope: '/admin',
    display: 'standalone',
    background_color: '#FAFAF8',
    theme_color: '#FAFAF8',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { 'content-type': 'application/manifest+json; charset=utf-8', 'cache-control': 'private, no-store' },
  });
}

export const dynamic = 'force-dynamic';
