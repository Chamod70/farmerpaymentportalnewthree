import type { Metadata } from 'next';
import './globals.css';

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
      </head>
      <body>{children}</body>
    </html>
  );
}
