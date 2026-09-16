'use client';

import { createContext, useContext, type ReactNode } from 'react';

import { getAdminDictionary, type AdminDictionary } from '@/lib/admin-i18n';
import { defaultLocale, type Locale } from '@/lib/i18n';

type AdminLang = { locale: Locale; t: AdminDictionary };

const AdminLangContext = createContext<AdminLang>({ locale: defaultLocale, t: getAdminDictionary(defaultLocale) });

/**
 * Hands the panel's own language down to every client control. The server
 * resolves it once per request from the admin cookie, so a control never has
 * to read a cookie itself or flash the wrong language on hydration.
 */
export function AdminLangProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <AdminLangContext.Provider value={{ locale, t: getAdminDictionary(locale) }}>{children}</AdminLangContext.Provider>;
}

export function useAdminLang(): AdminLang {
  return useContext(AdminLangContext);
}

/** Shorthand for the common case: `const t = useT();` then `t.menu.addDish`. */
export function useT(): AdminDictionary {
  return useContext(AdminLangContext).t;
}
