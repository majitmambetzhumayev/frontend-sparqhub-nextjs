// src/i18n/routing.ts
import {defineRouting} from 'next-intl/routing';


export const locales = ['en', 'fr'] as const;
export type Locale = typeof locales[number];

export const routing = defineRouting({
  locales: ['en', 'fr'],
  defaultLocale: 'en',
});
