'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
  locale: string;
  messages: Record<string, any>;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Asia/Shanghai"
      now={new Date()}
    >
      {children}
    </NextIntlClientProvider>
  );
}
