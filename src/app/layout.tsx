import type { Metadata } from 'next';
import { Lato, Instrument_Serif } from 'next/font/google';
import { ThemeProvider } from '@/providers/theme-provider';
import { TransitionProvider } from '@/providers/transition-provider';
import { VoiceBusProvider } from '@/providers/voice-bus-provider';
import './globals.css';

const lato = Lato({
  subsets: ['latin'],
  weight: ['100', '300', '400', '700', '900'],
  variable: '--font-lato',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Turlapati's",
  description: 'Welcome to my portfolio!',
  metadataBase: new URL('https://audienclature.com'),
  openGraph: {
    title: "Turlapati's",
    description: 'Welcome to my portfolio!',
    url: 'https://audienclature.com',
    siteName: "Turlapati's Portfolio",
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: "Turlapati's",
    description: 'Welcome to my portfolio!',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/portfolio.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black',
    title: "Turlapati's",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lato.variable} ${instrumentSerif.variable}`} suppressHydrationWarning>
      <body className="font-[family-name:var(--font-lato)] bg-[var(--color-bg)] text-[var(--color-text)]">
        <ThemeProvider>
          <TransitionProvider>
            <VoiceBusProvider>
              {children}
            </VoiceBusProvider>
          </TransitionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
