import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'vi'];

export default getRequestConfig(async (params) => {
  let locale = 'vi';
  try {
    const reqLoc = await params.requestLocale;
    if (reqLoc && locales.includes(reqLoc as any)) {
      locale = reqLoc;
    }
  } catch (e) {
    locale = 'vi';
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
