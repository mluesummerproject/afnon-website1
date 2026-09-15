import { Gallery } from '@/components/site/Gallery';
import { Hero } from '@/components/site/Hero';
import { Location } from '@/components/site/Location';
import { Menu } from '@/components/site/Menu';
import { Reserve } from '@/components/site/Reserve';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { Story } from '@/components/site/Story';
import { MENU_REVALIDATE_SECONDS } from '@/lib/supabase';

/**
 * Statically rendered and revalidated on a timer, with every admin write also
 * busting the menu cache tag — so edits are live without a redeploy.
 */
export const revalidate = MENU_REVALIDATE_SECONDS;

export default function HomePage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-hair focus:bg-ink focus:px-5 focus:py-3 focus:text-label focus:uppercase focus:text-paper"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main">
        <Hero />
        <Story />
        <Menu />
        <Gallery />
        <Location />
        <Reserve />
      </main>

      <SiteFooter />
    </>
  );
}
