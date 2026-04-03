import { DesktopNavbar } from '@/components/desktop-navbar';
import { MobileNavbar } from '@/components/mobile-navbar';

export default function AboutPage() {
  return (
    <main className="bg-gradient-main min-h-screen relative overflow-hidden">
      {/* Desktop navbar */}
      <div className="hidden sm:block">
        <DesktopNavbar />
      </div>

      {/* Mobile navbar */}
      <div className="sm:hidden">
        <MobileNavbar />
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">About</h1>
        <p className="text-[var(--color-text)] mt-2">Coming soon</p>
      </div>
    </main>
  );
}
