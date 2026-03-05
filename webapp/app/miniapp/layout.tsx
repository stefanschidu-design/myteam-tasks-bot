'use client';
import { useEffect } from 'react';
import Script from 'next/script';

export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.ready();
      (window as any).Telegram.WebApp.expand();
    }
  }, []);

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <main
        className="min-h-screen"
        style={{
          backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
          color: 'var(--tg-theme-text-color, #000000)',
        }}
      >
        {children}
      </main>
    </>
  );
}
