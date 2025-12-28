'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from './I18nProvider';
import { Button } from './ui/button';
import { Globe } from 'lucide-react';

export function Navigation({ locale }: { locale: string }) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const isActive = (path: string) => {
    const currentPath = pathname.replace(`/${locale}`, '') || '/';
    return currentPath === path;
  };

  const switchLocale = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    const path = pathname.replace(`/${locale}`, '') || '/';
    window.location.href = `/${newLocale}${path}`;
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6 rtl:space-x-reverse">
            <Link href={`/${locale}`} className="text-xl font-bold">
              {t('app.title')}
            </Link>
            <div className="flex space-x-4 rtl:space-x-reverse">
              <Link href={`/${locale}`}>
                <Button
                  variant={isActive('/') ? 'default' : 'ghost'}
                  size="sm"
                >
                  {t('nav.overview')}
                </Button>
              </Link>
              <Link href={`/${locale}/pull`}>
                <Button
                  variant={isActive('/pull') ? 'default' : 'ghost'}
                  size="sm"
                >
                  {t('nav.pull')}
                </Button>
              </Link>
              <Link href={`/${locale}/create`}>
                <Button
                  variant={isActive('/create') ? 'default' : 'ghost'}
                  size="sm"
                >
                  {t('nav.create')}
                </Button>
              </Link>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={switchLocale}>
            <Globe className="h-4 w-4" />
            <span className="sr-only">Switch language</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
