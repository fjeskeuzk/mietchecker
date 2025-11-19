// Internationalization request configuration for next-intl v3.22+
import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

export const locales = ['de', 'en'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  // Get locale from headers or use default
  const headersList = await headers();
  const locale = headersList.get('X-NEXT-INTL-LOCALE') || 'de';

  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default,
  };
});
