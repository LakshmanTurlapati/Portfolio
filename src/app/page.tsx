import { ThemeToggle } from '@/components/theme-toggle';
import { AuthorName } from '@/components/author-name';

export default function Home() {
  return (
    <main className="bg-gradient-main min-h-screen relative overflow-hidden">
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Home</p>
      </div>

      {/* Desktop: theme toggle bottom-left, author name bottom-right */}
      <div className="hidden sm:block fixed bottom-5 left-5">
        <ThemeToggle />
      </div>
      <div className="hidden sm:block fixed bottom-5 right-[30px]">
        <AuthorName variant="desktop" />
      </div>

      {/* Mobile: author name top-left, theme toggle top-right */}
      <div className="sm:hidden fixed top-5 left-5">
        <AuthorName variant="mobile" />
      </div>
      <div className="sm:hidden fixed top-5 right-5">
        <ThemeToggle />
      </div>
    </main>
  );
}
