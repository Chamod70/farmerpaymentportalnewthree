import type { Metadata } from 'next';
import './globals.css';
import PushNotificationManager from '@/components/PushNotificationManager';

export const metadata: Metadata = {
  title: 'FARMER FINAL PAYMENT 2026-SC',
  description: 'Official portal for Zone Office Field Officers to track final payments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Next.js doesn't natively handle SW registration easily via head without extra logic, but OneSignal SDK handles it automatically. */}
      </head>
      <body>
        <PushNotificationManager />
        {children}
      </body>
    </html>
  );
}
