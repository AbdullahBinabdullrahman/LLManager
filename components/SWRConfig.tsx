'use client';

import { SWRConfig as SWRConfigProvider } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SWRConfig({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfigProvider
      value={{
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
      }}
    >
      {children}
    </SWRConfigProvider>
  );
}
