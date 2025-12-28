import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = ['/en', '/ar'].some(
    (locale) => pathname.startsWith(locale) || pathname === locale
  );

  // If no locale in pathname, redirect to default locale
  if (!pathnameHasLocale && pathname !== '/') {
    const locale = request.headers.get('accept-language')?.split(',')[0]?.split('-')[0] || 'en';
    const redirectLocale = ['en', 'ar'].includes(locale) ? locale : 'en';
    return NextResponse.redirect(
      new URL(`/${redirectLocale}${pathname}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|locales).*)',
  ],
};
