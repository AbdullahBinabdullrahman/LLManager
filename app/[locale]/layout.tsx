'use client';

import { Sidebar } from '@/components/Sidebar';
import { SWRConfig } from '@/components/SWRConfig';
import { I18nProvider } from '@/components/I18nProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SettingsProvider } from '@/hooks/useSettings';
import { Toaster } from 'sonner';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function LocaleLayoutContent({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    // Update HTML dir attribute for RTL
    const html = document.documentElement;
    html.lang = locale;
    html.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  return (
    <ThemeProvider>
      <SettingsProvider>
        <I18nProvider locale={locale}>
          <SWRConfig>
            <div className="min-h-screen bg-background flex">
              <Sidebar locale={locale} />
              <main className="flex-1 min-h-screen">
                <div className="container mx-auto px-4 py-8 md:px-8 pt-16 md:pt-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={locale}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      {children}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </main>
            </div>
            <Toaster 
              position="bottom-right"
              toastOptions={{
                className: 'font-sans',
                duration: 4000,
              }}
              richColors
              closeButton
            />
          </SWRConfig>
        </I18nProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LocaleLayoutContent>{children}</LocaleLayoutContent>;
}
