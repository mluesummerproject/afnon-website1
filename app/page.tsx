import { AboutSection } from '@/components/site/AboutSection';
import { BasketProvider } from '@/components/site/basket/BasketProvider';
import { BasketSheetMount } from '@/components/site/basket/BasketSheetMount';
import { BottomNav } from '@/components/site/BottomNav';
import { ContactInfoSection } from '@/components/site/ContactInfoSection';
import { Films } from '@/components/site/Films';
import { ContactFab, ScrollTopButton } from '@/components/site/FloatingButtons';
import { IntroOverlay } from '@/components/site/IntroOverlay';
import { MenuExplorer } from '@/components/site/menu/MenuExplorer';
import { PromotionsSection } from '@/components/site/PromotionsSection';
import { ScrollSeed } from '@/components/site/ScrollSeed';
import { SeedGutters } from '@/components/site/SeedGutters';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteHero } from '@/components/site/SiteHero';
import { SiteToaster } from '@/components/site/SiteToaster';
import { VisitCard } from '@/components/site/VisitCard';
import { issueFormToken } from '@/lib/antispam';
import { getActiveBanners, heroSlides } from '@/lib/banners';
import { getLocaleAndDictionary } from '@/lib/locale';
import { getMenu } from '@/lib/menu';
import { sectionsFor } from '@/lib/sections';
import { getTheme } from '@/lib/theme-server';
import { getSiteSettings } from '@/lib/settings';
import { brand } from '@/lib/site';
import { getActiveVideos } from '@/lib/videos';

/**
 * Rendered per request (the language comes from a cookie). Every Supabase
 * read underneath stays in Next's data cache and is refreshed by staff edits.
 */
export default async function HomePage() {
  const { locale, dict } = getLocaleAndDictionary();
  const [menu, videos, banners, settings] = await Promise.all([getMenu(locale, dict), getActiveVideos(), getActiveBanners(), getSiteSettings()]);

  // Videos are only a destination when staff have actually uploaded one.
  const sections = sectionsFor(videos.length > 0);

  // Banners are the hero. Each one's link is resolved here, against the
  // categories this page actually rendered.
  const slides = heroSlides(banners, menu.categories);

  const allDishes = menu.categories.flatMap((category) => category.dishes);
  const discountedDishes = allDishes.filter((dish) => dish.discountPercent !== null);

  const basketDishes = allDishes.map((dish) => ({
    id: dish.id,
    name: dish.name,
    priceValue: dish.priceValue,
    available: dish.available,
    image: dish.images[0]?.src ?? null,
    imageAlt: dish.images[0]?.alt ?? dish.name,
  }));

  // Offered only when the restaurant actually saved them in Settings.
  const telegramHref = settings.configured.telegram && settings.telegram ? settings.telegram.href : null;
  const phoneHref = settings.configured.phone && settings.phone ? settings.phone.href : null;

  const cardLabels = { ...dict.menu, close: dict.menu.close, photoPosition: dict.menu.photoPosition, showPhoto: dict.menu.showPhoto };

  return (
    <BasketProvider dishes={basketDishes} templates={dict.basket} currency={dict.menu.currency} telegramUsername={settings.telegramUsername}>
      <IntroOverlay />
      <div id="top" />
      <a
        href="#menu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-[12px] focus:bg-ink focus:px-4 focus:py-3 focus:text-white"
      >
        {dict.a11y.skipToContent}
      </a>

      <SiteHeader
        locale={locale}
        brandName={brand.name}
        phoneHref={phoneHref}
        nav={dict.nav}
        sections={sections}
        theme={getTheme()}
        themeLabels={dict.theme}
        labels={{
          home: dict.a11y.siteNav,
          cta: dict.header.cta,
          basket: dict.header.basket,
          call: dict.header.call,
          language: dict.a11y.language,
          switchTo: dict.a11y.switchTo,
          siteNav: dict.a11y.siteNav,
        }}
      />

      <main id="main">
        <h1 className="sr-only">{dict.meta.title}</h1>
        <SiteHero brandName={brand.name} hero={dict.hero} badge={dict.visit.badge} slides={slides} bannerLabels={dict.banners} />

        <MenuExplorer status={menu.status} categories={menu.categories} locale={locale} search={dict.search} picksHeading={dict.picks.heading} menu={dict.menu} />
        {videos.length > 0 ? <Films dict={dict} videos={videos} /> : null}

        <PromotionsSection
          dishes={discountedDishes}
          locale={locale}
          copy={dict.promotions}
          cardLabels={cardLabels}
        />

        <AboutSection locale={locale} copy={dict.about} settings={settings} />

        <VisitCard visit={dict.visit} settings={settings} />

        <ContactInfoSection copy={dict.contactSection} settings={settings} />
      </main>

      <SiteFooter dict={dict} settings={settings} />
      <BottomNav nav={dict.nav} label={dict.a11y.bottomNav} />
      <SeedGutters />
      <ScrollSeed />
      <ScrollTopButton label={dict.a11y.backToTop} />
      <ContactFab labels={dict.fab} contactCopy={dict.contact} token={issueFormToken()} telegramHref={telegramHref} phoneHref={phoneHref} />
      <BasketSheetMount locale={locale} basket={dict.basket} menu={dict.menu} />
      <SiteToaster closeLabel={dict.a11y.close} />
    </BasketProvider>
  );
}
