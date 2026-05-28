import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

const locales = ['en', 'vi'];

export default getRequestConfig(async ({locale}) => {
  const baseLocale = locale || 'en';
  if (!locales.includes(baseLocale as any)) notFound();

  return {
    locale: baseLocale,
    messages: (await import(`./messages/${baseLocale}.json`)).default
  };
});
