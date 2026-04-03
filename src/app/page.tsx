import { DesktopNavbar } from '@/components/desktop-navbar';
import { MobileNavbar } from '@/components/mobile-navbar';
import { ThemeToggle } from '@/components/theme-toggle';
import { AuthorName } from '@/components/author-name';

export default function Home() {
  return (
    <main className="bg-gradient-main min-h-screen relative overflow-hidden">
      {/* Desktop navbar: visible >= 600px */}
      <div className="hidden sm:block">
        <DesktopNavbar />
      </div>

      {/* Mobile navbar: visible < 600px */}
      <div className="sm:hidden">
        <MobileNavbar />
      </div>

      {/* Desktop: theme toggle bottom-left */}
      <div className="hidden sm:block fixed bottom-5 left-5 z-40">
        <ThemeToggle />
      </div>

      {/* Desktop: author name bottom-right */}
      <div className="hidden sm:block fixed bottom-5 right-[30px] z-40">
        <AuthorName variant="desktop" />
      </div>

      {/* Mobile: author name top-left */}
      <div className="sm:hidden fixed top-5 left-5 z-40">
        <AuthorName variant="mobile" />
      </div>

      {/* Mobile: theme toggle top-right */}
      <div className="sm:hidden fixed top-5 right-5 z-40">
        <ThemeToggle />
      </div>
    </main>
  );
}
