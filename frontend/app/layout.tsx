import './globals.css';
import type { Metadata, Viewport } from 'next';

const DOMAIN = 'https://aicda-crypto-ctf.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),
  title: 'AICDA — Production Cryptography Pentesting Lab & CTF',
  description: 'Anonymous India Cyber Defence Academy • Enterprise Cryptographic Implementation Flaws & Mainframe',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'AICDA — Production Cryptography Pentesting Lab & CTF',
    description: 'Anonymous India Cyber Defence Academy • Enterprise Cryptographic Implementation Flaws & Mainframe',
    url: DOMAIN,
    siteName: 'AICDA Cyber Mainframe',
    images: [
      {
        url: `${DOMAIN}/logo.png`,
        secureUrl: `${DOMAIN}/logo.png`,
        width: 600,
        height: 600,
        alt: 'AICDA Official Logo Badge',
        type: 'image/png',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AICDA — Production Cryptography Pentesting Lab & CTF',
    description: 'Anonymous India Cyber Defence Academy • Enterprise Cryptographic Implementation Flaws & Mainframe',
    images: [`${DOMAIN}/logo.png`],
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
        <meta property="og:title" content="AICDA — Production Cryptography Pentesting Lab & CTF" />
        <meta property="og:description" content="Anonymous India Cyber Defence Academy • Enterprise Cryptographic Implementation Flaws & Mainframe" />
        <meta property="og:image" content="https://aicda-crypto-ctf.vercel.app/logo.png" />
        <meta property="og:image:secure_url" content="https://aicda-crypto-ctf.vercel.app/logo.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="600" />
        <meta property="og:image:height" content="600" />
        <meta property="og:url" content="https://aicda-crypto-ctf.vercel.app" />
        <meta property="og:type" content="website" />
      </head>
      <body className="bg-black text-matrix-green min-h-screen selection:bg-matrix-green selection:text-black">
        {children}
      </body>
    </html>
  );
}
