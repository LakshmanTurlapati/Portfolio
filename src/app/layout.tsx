import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import { ThemeProvider } from '@/providers/theme-provider';
import './globals.css';

const lato = Lato({
  subsets: ['latin'],
  weight: ['100', '300', '400', '700', '900'],
  variable: '--font-lato',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Portfolio v2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={lato.variable} suppressHydrationWarning>
      <body className="font-[family-name:var(--font-lato)] bg-[var(--color-bg)] text-[var(--color-text)]">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
