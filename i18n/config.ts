import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticPropsContext } from 'next';

/**
 * Get server-side translations for a given locale
 * @param locale - The locale to get translations for
 * @param namespaces - Optional array of namespaces to include
 * @returns Promise with translations object
 */
export async function getServerSideTranslations(
  locale: string,
  namespaces: string[] = ['common']
) {
  return serverSideTranslations(locale, namespaces);
}

/**
 * Get static props with translations
 * @param context - Next.js context
 * @param namespaces - Optional array of namespaces to include
 * @returns Promise with props including translations
 */
export async function getStaticPropsWithTranslations(
  context: GetStaticPropsContext,
  namespaces: string[] = ['common']
) {
  const locale = context.locale || 'en';
  return {
    props: {
      ...(await getServerSideTranslations(locale, namespaces)),
    },
  };
}
