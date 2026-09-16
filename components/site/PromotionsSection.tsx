'use client';

import { useState } from 'react';

import { BannerCarousel } from '@/components/site/BannerCarousel';
import { DishCard } from '@/components/site/menu/DishCard';
import type { CardLabels } from '@/components/site/menu/DishParts';
import { PhotoSheet } from '@/components/site/menu/PhotoSheet';
import { SectionHeading } from '@/components/site/SectionHeading';
import type { Dictionary, Locale } from '@/lib/i18n';
import type { Banner, Dish } from '@/lib/types';

type PromotionsSectionProps = {
  banners: Banner[];
  dishes: Dish[];
  locale: Locale;
  copy: Dictionary['promotions'];
  bannerLabels: Dictionary['banners'];
  cardLabels: CardLabels & { close: string; photoPosition: string; showPhoto: string };
};

/**
 * Always visible — this is one of the site's five permanent sections. When
 * there is nothing to promote yet it says so plainly instead of vanishing,
 * per the "a page that collapses to nothing is worse than honest emptiness"
 * rule. Content is never invented: a banner or a discount only appears here
 * because staff put a real row in the database.
 */
export function PromotionsSection({ banners, dishes, locale, copy, bannerLabels, cardLabels }: PromotionsSectionProps) {
  const [sheetDish, setSheetDish] = useState<Dish | null>(null);

  return (
    <section id="promotions" aria-labelledby="promotions-heading" className="scroll-mt-16 pt-10">
      <div className="shell">
        <SectionHeading id="promotions-heading">{copy.heading}</SectionHeading>
      </div>

      <div className="reveal mt-3">
        {banners.length > 0 ? (
          <BannerCarousel banners={banners} labels={bannerLabels} />
        ) : (
          <p className="shell text-[15px] text-ink/60">{copy.bannersEmpty}</p>
        )}
      </div>

      <div className="shell mt-7">
        <h3 className="text-[15px] font-semibold text-ink/80">{copy.dishesHeading}</h3>
        {dishes.length > 0 ? (
          <div className="stagger-grid mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {dishes.map((dish, position) => (
              <DishCard key={dish.id} dish={dish} index={position} locale={locale} labels={cardLabels} onOpen={setSheetDish} />
            ))}
          </div>
        ) : (
          <p className="reveal mt-3 text-[15px] text-ink/60">{copy.dishesEmpty}</p>
        )}
      </div>

      <PhotoSheet dish={sheetDish} onClose={() => setSheetDish(null)} labels={cardLabels} />
    </section>
  );
}
