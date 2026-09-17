/**
 * ===========================================================================
 * AFNON — every word the visitor reads, in Uzbek, Russian and English.
 * ===========================================================================
 * · Uzbek (Latin) is the default and the fallback for missing menu content.
 * · The English dictionary defines the shape; TypeScript refuses to build if
 *   Uzbek or Russian is missing a key.
 * · Uzbek uses the proper modifier letter ʻ (oʻ, gʻ). Inter contains it.
 * · Nothing here asserts a fact the restaurant has not supplied. Contact
 *   details, address details and social links come from the staff Settings
 *   tab and render nothing until they are filled in.
 * ===========================================================================
 */

export const locales = ['uz', 'ru', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'uz';

export const LOCALE_COOKIE = 'afnon_lang';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export const localeMeta: Record<Locale, { short: string; name: string; htmlLang: string; ogLocale: string }> = {
  uz: { short: 'UZ', name: 'Oʻzbekcha', htmlLang: 'uz', ogLocale: 'uz_UZ' },
  ru: { short: 'RU', name: 'Русский', htmlLang: 'ru', ogLocale: 'ru_RU' },
  en: { short: 'EN', name: 'English', htmlLang: 'en', ogLocale: 'en_US' },
};

/** Plural forms, selected with Intl.PluralRules for the active language. */
export type PluralForms = { one: string; few: string; many: string; other: string };

type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Widen<U>[]
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T;

/* ------------------------------------------------------------------ English */

const en = {
  meta: {
    title: 'Afnon — restaurant on Qatortol Street, Tashkent',
    description: 'Afnon restaurant on Qatortol Street, Tashkent. Browse the menu and send your order via Telegram. Open 24/7, self-service.',
    imageAlt: 'The Afnon mark and name beside a plate of osh',
  },
  brand: { descriptor: 'Restaurant · Tashkent', city: 'Tashkent' },
  a11y: {
    skipToContent: 'Skip to the menu',
    home: '{brand} — home',
    language: 'Language',
    switchTo: 'Switch the site to {language}',
    close: 'Close',
    bottomNav: 'Quick navigation',
    backToTop: 'Back to top',
    siteNav: 'Main navigation',
  },
  header: { cta: 'Order', basket: 'Basket', call: 'Call the restaurant' },
  nav: {
    home: 'Home',
    menu: 'Menu',
    basket: 'Basket',
    visit: 'Visit',
    films: 'Videos',
    promotions: 'Offers',
    about: 'About',
    contact: 'Contact',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
  },
  hero: {
    tagline: 'Fresh dishes, always within reach.',
    menuCta: 'View the menu',
    visitCta: 'Visit',
  },
  promotions: {
    heading: 'Offers',
    bannersEmpty: 'No active offers right now.',
    dishesHeading: 'Discounted dishes',
    dishesEmpty: 'No discounted dishes right now.',
  },
  about: {
    heading: 'About us',
    empty: 'A description of the restaurant will be added here soon.',
  },
  contactSection: {
    heading: 'Contact',
    empty: 'Contact details will be added here soon.',
    phone: 'Phone',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    email: 'Email',
    social: 'Social',
  },
  search: {
    label: 'Search the menu',
    placeholder: 'Search dishes',
    clear: 'Clear search',
    noResults: 'Nothing found for “{query}”',
    showAll: 'Show the whole menu',
    results: { one: '{count} dish found', few: '{count} dishes found', many: '{count} dishes found', other: '{count} dishes found' },
  },
  picks: { heading: 'Chef’s picks' },
  banners: { region: 'Offers', slide: 'Offer {index} of {total}', goTo: 'Show offer {index}' },
  fab: { open: 'Contact us', close: 'Close contact options', telegram: 'Telegram', call: 'Call', message: 'Leave a message', back: 'Back' },
  menu: {
    categoriesNav: 'Menu categories',
    currency: 'soʻm',
    unavailable: 'Unavailable today',
    add: 'Add',
    addAria: 'Add {dish} to the basket',
    inBasket: '{count} in the basket',
    increase: 'One more {dish}',
    decrease: 'One less {dish}',
    favoriteAdd: 'Save {dish} to favourites',
    favoriteRemove: 'Remove {dish} from favourites',
    viewDish: 'View {dish}',
    discount: '{percent}% off',
    oldPrice: 'Was {price}',
    photoPosition: '{index} / {total}',
    showPhoto: 'Show photo {index}',
    close: 'Close',
    empty: 'The menu is being updated.',
    error: 'The menu could not be loaded right now.',
    retry: 'Try again',
  },
  basket: {
    title: 'Your order',
    empty: 'Your basket is empty.',
    browse: 'Browse the menu',
    count: { one: '{count} item', few: '{count} items', many: '{count} items', other: '{count} items' },
    open: 'Open basket',
    remove: 'Remove {dish}',
    total: 'Total',
    totalPartial: 'Total for priced dishes',
    note: 'Your order is sent to the restaurant as a Telegram message.',
    checkout: 'Send order via Telegram',
    noTelegram: 'Ordering by Telegram opens once the restaurant adds its Telegram account.',
    sent: 'Your order is open in Telegram. The basket has been cleared.',
    messageGreeting: "Hello! I'd like to order:",
    messageLine: '{index}. {dish} × {qty}',
    messageLinePrice: '{index}. {dish} × {qty} — {amount}',
    messageTotal: 'Total: {amount}',
  },
  films: {
    heading: 'From our kitchen',
    region: 'Films from Afnon',
    play: 'Play',
    pause: 'Pause',
    soundOn: 'Turn sound on',
    soundOff: 'Turn sound off',
    previous: 'Previous film',
    next: 'Next film',
    select: 'Play film {index}: {title}',
    fallbackTitle: 'Film {index}',
    position: '{index} / {total}',
    unsupported: 'This film cannot be played in your browser.',
  },
  visit: {
    heading: 'Visit us',
    badge: 'Open 24/7 • Self-Service',
    street: 'Qatortol Street',
    city: 'Tashkent',
    country: 'Uzbekistan',
    hoursLabel: 'Hours',
    hours: 'Every day, around the clock',
    showOnMap: 'Show on map',
    addressLabel: 'Address',
    directions: 'Get directions',
    call: 'Call',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    followUs: 'Follow us',
    onPlatform: 'Afnon on {platform}',
  },
  contact: {
    heading: 'Have a question?',
    lead: 'Ask about the menu or the restaurant — leave a way to reach you and we will reply.',
    name: 'Your name',
    contact: 'Phone or Telegram',
    contactHint: 'For example +998 90 000 00 00 or @username',
    message: 'Message',
    privacy: 'We only use these details to reply to you.',
    submit: 'Send',
    sending: 'Sending…',
    successLabel: 'Received',
    successTitle: 'Thank you, {name}. Your message has arrived.',
    successBody: 'We will get back to you at {contact}.',
    sendAnother: 'Write another message',
    errors: {
      name: 'Please tell us your name (2–80 characters).',
      contact: 'Please leave a phone number or Telegram username.',
      message: 'Please write a message (5–1,000 characters).',
      rateLimited: 'You have sent several messages just now. Please try again a little later.',
      generic: 'Your message could not be sent. Please try again.',
      summary: 'Please check the highlighted fields.',
    },
  },
  footer: {
    contact: 'Contact',
    menu: 'Menu',
    staff: 'For staff',
    privacy: 'Your phone number and address are used only to confirm and deliver your order, and are never shared.',
  },
  notFound: { title: 'This page could not be found.', body: 'The link may be out of date.', back: 'Back to the menu' },
};

export type Dictionary = Widen<typeof en>;

/* ------------------------------------------------------------------ Uzbek */

const uz: Dictionary = {
  meta: {
    title: 'Afnon — Qatortol koʻchasidagi restoran, Toshkent',
    description: 'Toshkentdagi Qatortol koʻchasida joylashgan Afnon restorani. Menyuni koʻring va buyurtmani Telegram orqali yuboring. 24/7 ochiq, oʻz-oʻziga xizmat.',
    imageAlt: 'Afnon belgisi va nomi, yonida bir lagan osh',
  },
  brand: { descriptor: 'Restoran · Toshkent', city: 'Toshkent' },
  a11y: {
    skipToContent: 'Menyuga oʻtish',
    home: '{brand} — bosh sahifa',
    language: 'Til',
    switchTo: 'Sayt tilini almashtirish: {language}',
    close: 'Yopish',
    bottomNav: 'Tezkor navigatsiya',
    backToTop: 'Yuqoriga qaytish',
    siteNav: 'Asosiy navigatsiya',
  },
  header: { cta: 'Buyurtma', basket: 'Savat', call: 'Restoranga qoʻngʻiroq' },
  nav: {
    home: 'Bosh sahifa',
    menu: 'Menyu',
    basket: 'Savat',
    visit: 'Manzil',
    films: 'Videolar',
    promotions: 'Aksiyalar',
    about: 'Biz haqimizda',
    contact: 'Aloqa',
    openMenu: 'Navigatsiya menyusini ochish',
    closeMenu: 'Navigatsiya menyusini yopish',
  },
  hero: {
    tagline: 'Toza va mazali taomlar, doim qoʻlingiz ostida.',
    menuCta: 'Menyuni koʻrish',
    visitCta: 'Manzil',
  },
  promotions: {
    heading: 'Aksiyalar',
    bannersEmpty: 'Hozircha aktiv aksiyalar yoʻq.',
    dishesHeading: 'Chegirmali taomlar',
    dishesEmpty: 'Hozircha chegirmali taomlar yoʻq.',
  },
  about: {
    heading: 'Biz haqimizda',
    empty: 'Restoran haqida maʼlumot tez orada shu yerga qoʻshiladi.',
  },
  contactSection: {
    heading: 'Aloqa',
    empty: 'Aloqa maʼlumotlari tez orada shu yerga qoʻshiladi.',
    phone: 'Telefon',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    email: 'Email',
    social: 'Ijtimoiy tarmoqlar',
  },
  search: {
    label: 'Menyudan qidirish',
    placeholder: 'Taom qidirish',
    clear: 'Qidiruvni tozalash',
    noResults: '“{query}” boʻyicha hech narsa topilmadi',
    showAll: 'Butun menyuni koʻrsatish',
    results: { one: '{count} ta taom topildi', few: '{count} ta taom topildi', many: '{count} ta taom topildi', other: '{count} ta taom topildi' },
  },
  picks: { heading: 'Oshpaz tanlovi' },
  banners: { region: 'Aksiyalar', slide: '{total} tadan {index}-aksiya', goTo: '{index}-aksiyani koʻrsatish' },
  fab: {
    open: 'Biz bilan bogʻlanish',
    close: 'Bogʻlanish menyusini yopish',
    telegram: 'Telegram',
    call: 'Qoʻngʻiroq qilish',
    message: 'Xabar qoldirish',
    back: 'Orqaga',
  },
  menu: {
    categoriesNav: 'Menyu boʻlimlari',
    currency: 'soʻm',
    unavailable: 'Bugun mavjud emas',
    add: 'Qoʻshish',
    addAria: '{dish} taomini savatga qoʻshish',
    inBasket: 'Savatda {count} ta',
    increase: 'Yana bitta: {dish}',
    decrease: 'Bittaga kamaytirish: {dish}',
    favoriteAdd: '{dish} taomini sevimlilarga qoʻshish',
    favoriteRemove: '{dish} taomini sevimlilardan olib tashlash',
    viewDish: '{dish} — batafsil',
    discount: '{percent}% chegirma',
    oldPrice: 'Avvalgi narx: {price}',
    photoPosition: '{index} / {total}',
    showPhoto: '{index}-suratni koʻrsatish',
    close: 'Yopish',
    empty: 'Menyu yangilanmoqda.',
    error: 'Menyuni hozir yuklab boʻlmadi.',
    retry: 'Qayta urinish',
  },
  basket: {
    title: 'Buyurtmangiz',
    empty: 'Savat boʻsh.',
    browse: 'Menyuni koʻrish',
    count: { one: '{count} ta taom', few: '{count} ta taom', many: '{count} ta taom', other: '{count} ta taom' },
    open: 'Savatni ochish',
    remove: '{dish} taomini olib tashlash',
    total: 'Jami',
    totalPartial: 'Narxi koʻrsatilgan taomlar uchun jami',
    note: 'Buyurtma restoranga Telegram xabari sifatida yuboriladi.',
    checkout: 'Telegram orqali yuborish',
    noTelegram: 'Restoran Telegram hisobini qoʻshgach, Telegram orqali buyurtma berish mumkin boʻladi.',
    sent: 'Buyurtma Telegramda ochildi. Savat tozalandi.',
    messageGreeting: 'Salom! Men quyidagilarga buyurtma bermoqchiman:',
    messageLine: '{index}. {dish} × {qty}',
    messageLinePrice: '{index}. {dish} × {qty} — {amount}',
    messageTotal: 'Jami: {amount}',
  },
  films: {
    heading: 'Oshxonamizdan',
    region: 'Afnon videolari',
    play: 'Ijro etish',
    pause: 'Toʻxtatish',
    soundOn: 'Ovozni yoqish',
    soundOff: 'Ovozni oʻchirish',
    previous: 'Oldingi video',
    next: 'Keyingi video',
    select: '{index}-videoni ijro etish: {title}',
    fallbackTitle: '{index}-video',
    position: '{index} / {total}',
    unsupported: 'Bu videoni brauzeringizda ijro etib boʻlmaydi.',
  },
  visit: {
    heading: 'Bizga tashrif buyuring',
    badge: '24/7 ochiq • Oʻz-oʻziga xizmat',
    street: 'Qatortol koʻchasi',
    city: 'Toshkent',
    country: 'Oʻzbekiston',
    hoursLabel: 'Ish vaqti',
    hours: 'Har kuni, kecha-kunduz',
    showOnMap: 'Xaritada koʻrsatish',
    addressLabel: 'Manzil',
    directions: 'Yoʻlni koʻrsatish',
    call: 'Qoʻngʻiroq',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    followUs: 'Bizni kuzating',
    onPlatform: 'Afnon {platform}da',
  },
  contact: {
    heading: 'Savolingiz bormi?',
    lead: 'Menyu yoki restoran haqida soʻrang — bogʻlanish usulini qoldiring, javob beramiz.',
    name: 'Ismingiz',
    contact: 'Telefon yoki Telegram',
    contactHint: 'Masalan, +998 90 000 00 00 yoki @username',
    message: 'Xabar',
    privacy: 'Bu ma’lumotlar faqat sizga javob berish uchun ishlatiladi.',
    submit: 'Yuborish',
    sending: 'Yuborilmoqda…',
    successLabel: 'Qabul qilindi',
    successTitle: 'Rahmat, {name}. Xabaringiz yetib keldi.',
    successBody: 'Siz bilan {contact} orqali bogʻlanamiz.',
    sendAnother: 'Yana xabar yozish',
    errors: {
      name: 'Iltimos, ismingizni yozing (2–80 belgi).',
      contact: 'Iltimos, telefon raqami yoki Telegram nomini qoldiring.',
      message: 'Iltimos, xabar yozing (5–1000 belgi).',
      rateLimited: 'Hozirgina bir nechta xabar yubordingiz. Birozdan soʻng qayta urinib koʻring.',
      generic: 'Xabarni yuborib boʻlmadi. Qayta urinib koʻring.',
      summary: 'Iltimos, belgilangan maydonlarni tekshiring.',
    },
  },
  footer: {
    contact: 'Aloqa',
    menu: 'Menyu',
    staff: 'Xodimlar uchun',
    privacy: 'Telefon raqamingiz va manzilingiz faqat buyurtmani tasdiqlash va yetkazib berish uchun ishlatiladi va hech kimga berilmaydi.',
  },
  notFound: { title: 'Bu sahifa topilmadi.', body: 'Havola eskirgan boʻlishi mumkin.', back: 'Menyuga qaytish' },
};

/* ------------------------------------------------------------------ Russian */

const ru: Dictionary = {
  meta: {
    title: 'Afnon — ресторан на улице Катартал, Ташкент',
    description: 'Ресторан Afnon на улице Катартал в Ташкенте. Смотрите меню и отправляйте заказ в Telegram. Открыто 24/7, самообслуживание.',
    imageAlt: 'Знак и название Afnon рядом с блюдом плова',
  },
  brand: { descriptor: 'Ресторан · Ташкент', city: 'Ташкент' },
  a11y: {
    skipToContent: 'Перейти к меню',
    home: '{brand} — на главную',
    language: 'Язык',
    switchTo: 'Переключить сайт на язык: {language}',
    close: 'Закрыть',
    bottomNav: 'Быстрая навигация',
    backToTop: 'Наверх',
    siteNav: 'Основная навигация',
  },
  header: { cta: 'Заказать', basket: 'Корзина', call: 'Позвонить в ресторан' },
  nav: {
    home: 'Главная',
    menu: 'Меню',
    basket: 'Корзина',
    visit: 'Адрес',
    films: 'Видео',
    promotions: 'Акции',
    about: 'О нас',
    contact: 'Контакты',
    openMenu: 'Открыть меню навигации',
    closeMenu: 'Закрыть меню навигации',
  },
  hero: {
    tagline: 'Свежие блюда, всегда рядом с вами.',
    menuCta: 'Смотреть меню',
    visitCta: 'Адрес',
  },
  promotions: {
    heading: 'Акции',
    bannersEmpty: 'Сейчас нет активных акций.',
    dishesHeading: 'Блюда со скидкой',
    dishesEmpty: 'Сейчас нет блюд со скидкой.',
  },
  about: {
    heading: 'О нас',
    empty: 'Описание ресторана скоро появится здесь.',
  },
  contactSection: {
    heading: 'Контакты',
    empty: 'Контактные данные скоро появятся здесь.',
    phone: 'Телефон',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    email: 'Email',
    social: 'Соцсети',
  },
  search: {
    label: 'Поиск по меню',
    placeholder: 'Найти блюдо',
    clear: 'Очистить поиск',
    noResults: 'По запросу «{query}» ничего не найдено',
    showAll: 'Показать всё меню',
    results: { one: 'Найдено {count} блюдо', few: 'Найдено {count} блюда', many: 'Найдено {count} блюд', other: 'Найдено {count} блюда' },
  },
  picks: { heading: 'Выбор шефа' },
  banners: { region: 'Акции', slide: 'Акция {index} из {total}', goTo: 'Показать акцию {index}' },
  fab: {
    open: 'Связаться с нами',
    close: 'Закрыть меню связи',
    telegram: 'Telegram',
    call: 'Позвонить',
    message: 'Оставить сообщение',
    back: 'Назад',
  },
  menu: {
    categoriesNav: 'Разделы меню',
    currency: 'soʻm',
    unavailable: 'Сегодня нет',
    add: 'Добавить',
    addAria: 'Добавить «{dish}» в корзину',
    inBasket: 'В корзине: {count}',
    increase: 'Ещё одно: {dish}',
    decrease: 'Одним меньше: {dish}',
    favoriteAdd: 'Добавить «{dish}» в избранное',
    favoriteRemove: 'Убрать «{dish}» из избранного',
    viewDish: 'Подробнее: {dish}',
    discount: 'Скидка {percent}%',
    oldPrice: 'Было {price}',
    photoPosition: '{index} / {total}',
    showPhoto: 'Показать фото {index}',
    close: 'Закрыть',
    empty: 'Меню обновляется.',
    error: 'Сейчас не удалось загрузить меню.',
    retry: 'Повторить',
  },
  basket: {
    title: 'Ваш заказ',
    empty: 'Корзина пуста.',
    browse: 'Смотреть меню',
    count: { one: '{count} позиция', few: '{count} позиции', many: '{count} позиций', other: '{count} позиции' },
    open: 'Открыть корзину',
    remove: 'Удалить «{dish}»',
    total: 'Итого',
    totalPartial: 'Итого по блюдам с ценой',
    note: 'Заказ отправляется в ресторан сообщением в Telegram.',
    checkout: 'Отправить заказ в Telegram',
    noTelegram: 'Заказ через Telegram станет доступен, когда ресторан добавит свой аккаунт Telegram.',
    sent: 'Заказ открыт в Telegram. Корзина очищена.',
    messageGreeting: 'Здравствуйте! Я хочу заказать:',
    messageLine: '{index}. {dish} × {qty}',
    messageLinePrice: '{index}. {dish} × {qty} — {amount}',
    messageTotal: 'Итого: {amount}',
  },
  films: {
    heading: 'С нашей кухни',
    region: 'Видео Afnon',
    play: 'Воспроизвести',
    pause: 'Пауза',
    soundOn: 'Включить звук',
    soundOff: 'Выключить звук',
    previous: 'Предыдущее видео',
    next: 'Следующее видео',
    select: 'Смотреть видео {index}: {title}',
    fallbackTitle: 'Видео {index}',
    position: '{index} / {total}',
    unsupported: 'Это видео не воспроизводится в вашем браузере.',
  },
  visit: {
    heading: 'Приходите к нам',
    badge: 'Открыто 24/7 • Самообслуживание',
    street: 'Улица Катартал',
    city: 'Ташкент',
    country: 'Узбекистан',
    hoursLabel: 'Часы работы',
    hours: 'Ежедневно, круглосуточно',
    showOnMap: 'Показать на карте',
    addressLabel: 'Адрес',
    directions: 'Построить маршрут',
    call: 'Позвонить',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    followUs: 'Мы в соцсетях',
    onPlatform: 'Afnon в {platform}',
  },
  contact: {
    heading: 'Есть вопрос?',
    lead: 'Спросите о меню или ресторане — оставьте способ связи, и мы ответим.',
    name: 'Ваше имя',
    contact: 'Телефон или Telegram',
    contactHint: 'Например, +998 90 000 00 00 или @username',
    message: 'Сообщение',
    privacy: 'Мы используем эти данные только для ответа вам.',
    submit: 'Отправить',
    sending: 'Отправляем…',
    successLabel: 'Получено',
    successTitle: 'Спасибо, {name}. Сообщение получено.',
    successBody: 'Мы свяжемся с вами: {contact}.',
    sendAnother: 'Написать ещё одно сообщение',
    errors: {
      name: 'Пожалуйста, укажите имя (2–80 символов).',
      contact: 'Пожалуйста, оставьте телефон или имя пользователя в Telegram.',
      message: 'Пожалуйста, напишите сообщение (5–1000 символов).',
      rateLimited: 'Вы только что отправили несколько сообщений. Попробуйте чуть позже.',
      generic: 'Не удалось отправить сообщение. Попробуйте ещё раз.',
      summary: 'Пожалуйста, проверьте отмеченные поля.',
    },
  },
  footer: {
    contact: 'Контакты',
    menu: 'Меню',
    staff: 'Для персонала',
    privacy: 'Ваш телефон и адрес используются только для подтверждения и доставки заказа и никому не передаются.',
  },
  notFound: { title: 'Страница не найдена.', body: 'Возможно, ссылка устарела.', back: 'Вернуться к меню' },
};

const dictionaries: Record<Locale, Dictionary> = { uz, ru, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

/** "{name}" style interpolation. Unknown slots are left visible rather than blanked. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** Chooses the right plural form for the active language and fills {count}. */
export function plural(forms: PluralForms, count: number, locale: Locale): string {
  const rule = new Intl.PluralRules(localeMeta[locale].htmlLang).select(count);
  const template = rule === 'one' || rule === 'few' || rule === 'many' ? forms[rule] : forms.other;
  return format(template, { count });
}

/* ------------------------------------------------------------------ menu content */

/** NULL, empty and whitespace-only all count as missing. */
export function clean(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const TURNED_COMMA = String.fromCharCode(0x02bb); // ʻ

/**
 * Typographic tidy-up for text typed by staff: Uzbek oʻ / gʻ written with
 * ', `, ‘ or ’ becomes the proper ʻ, and a straight apostrophe between
 * letters becomes ’. Display-only — stored data is never rewritten.
 */
export function tidyText(value: string): string {
  return value.replace(/([oOgG])['`‘’ʼ](?=\p{L})/gu, `$1${TURNED_COMMA}`).replace(/(\p{L})['ʼ](?=\p{L})/gu, '$1’');
}

type Translatable = 'name' | 'description';
type LocalizedRow = { [K in Translatable]: string | null } & { [K in `${Translatable}_${Locale}`]: string | null };

/**
 * Selected language → Uzbek → the original column → any other translation.
 * Returns null when there is genuinely nothing — the UI then renders nothing.
 */
export function localizedText(row: LocalizedRow, field: Translatable, locale: Locale): string | null {
  const candidates = [
    row[`${field}_${locale}`],
    row[`${field}_uz`],
    row[field],
    ...locales.filter((other) => other !== locale && other !== 'uz').map((other) => row[`${field}_${other}`]),
  ];
  for (const candidate of candidates) {
    const value = clean(candidate);
    if (value) return tidyText(value);
  }
  return null;
}
