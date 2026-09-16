'use client';

import { BasketSheet } from '@/components/site/basket/BasketSheet';
import { HEADER_HEIGHT, scrollToElement } from '@/lib/client-scroll';
import type { Dictionary, Locale } from '@/lib/i18n';

/** Client boundary so the sheet's "browse the menu" action can scroll the page. */
export function BasketSheetMount(props: { locale: Locale; basket: Dictionary['basket']; menu: Dictionary['menu'] }) {
  return (
    <BasketSheet
      {...props}
      onBrowse={() => {
        const menu = document.getElementById('menu');
        if (menu) scrollToElement(menu, HEADER_HEIGHT);
      }}
    />
  );
}
