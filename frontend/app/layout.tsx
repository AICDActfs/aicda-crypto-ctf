import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'AICDA — Production Cryptography Pentesting Lab & CTF',
  description: 'Enterprise Real-World Cryptographic Implementation Attacks & Auditing Mainframe',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body className="bg-black text-matrix-green min-h-screen selection:bg-matrix-green selection:text-black">
        {children}
      </body>
    </html>
  );
}
