// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { hasLocale } from 'next-intl';

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale is a Promise, not a plain string (next-intl 4.x) -- passing
  // it unawaited into hasLocale() compares a Promise object against
  // routing.locales, which never matches, so this silently always fell back
  // to defaultLocale ('en') regardless of the actual /en or /fr URL segment.
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default
  };
});
