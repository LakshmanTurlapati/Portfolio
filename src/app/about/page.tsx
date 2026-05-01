'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaArrowLeft, FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import { useMediaQuery } from '@/hooks/use-media-query';
import { SpotlightEffect } from '@/components/spotlight';
import { TimelineEntry } from '@/components/timeline-entry';
import { bioSegments } from '@/data/bio';
import { experienceData } from '@/data/experience';
import { educationData } from '@/data/education';
import { useTransition } from '@/providers/transition-provider';
import { useSiteControl } from '@/providers/site-control-provider';
import {
  getStoredDesktopHomeAboutButtonRect,
  PORTFOLIO_MORPH_DURATION_MS,
  rectFromDomRect,
  startAboutButtonMorph,
} from '@/lib/portfolio-button-morph';

const EXIT_MORPH_DELAY_MS = 60;

type SectionId = 'about' | 'experience' | 'academics';

const NAV_SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'academics', label: 'Academics' },
];

const SOCIAL_LINKS = [
  { icon: FaGithub, url: 'https://github.com/LakshmanTurlapati', label: 'GitHub' },
  { icon: FaLinkedin, url: 'https://www.linkedin.com/in/lakshman-turlapati-3091aa191/', label: 'LinkedIn' },
  { icon: FaXTwitter, url: 'https://x.com/parzival1213', label: 'X/Twitter' },
];

const DESKTOP_ABOUT_GUTTER = 'clamp(48px, 8.333vw, 120px)';

function BioText() {
  // Split bio segments into paragraphs by detecting \n\n in text
  const elements: React.ReactNode[] = [];
  let key = 0;

  bioSegments.forEach((segment) => {
    // Split text on \n\n for paragraph breaks
    const parts = segment.text.split('\n\n');
    parts.forEach((part, idx) => {
      if (part.length > 0) {
        if (segment.bold) {
          elements.push(<strong key={key++}>{part}</strong>);
        } else {
          elements.push(<span key={key++}>{part}</span>);
        }
      }
      // Add paragraph break between parts (not after the last)
      if (idx < parts.length - 1) {
        elements.push(<br key={key++} />);
        elements.push(<br key={key++} />);
      }
    });
  });

  return (
    <div
      className="text-base leading-relaxed"
      style={{ color: 'var(--color-page-inverted-text)', opacity: 0.87 }}
    >
      {elements}
    </div>
  );
}

function BackButton({
  onClick,
  morphTarget = false,
}: {
  onClick: (e: React.MouseEvent) => void;
  morphTarget?: boolean;
}) {
  return (
    <button
      data-about-morph-target={morphTarget ? 'true' : undefined}
      onClick={onClick}
      className="flex items-center justify-center rounded-xl transition-opacity duration-200"
      style={{
        width: '48px',
        height: '48px',
        backgroundColor: 'var(--color-page-inverted-text)',
        color: 'var(--color-page-inverted-bg)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.8';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      aria-label="Back to home"
    >
      <FaArrowLeft size={18} />
    </button>
  );
}

function FooterText({ compact = false }: { compact?: boolean }) {
  return (
    <p
      className={`text-sm ${compact ? 'text-left' : 'text-center'}`}
      style={{
        color: 'var(--color-page-inverted-text)',
        opacity: 0.7,
        paddingTop: compact ? '72px' : '180px',
        paddingBottom: compact ? 'max(32px, env(safe-area-inset-bottom))' : '40px',
      }}
    >
      Sketched with{' '}
      <a
        href="https://claude.ai"
        target="_blank"
        rel="noreferrer"
        className="font-semibold underline decoration-current/40 underline-offset-2 transition-opacity hover:opacity-100"
      >
        Claude Design
      </a>
      , wired up in <strong>NextJS</strong>, shipped on{' '}
      <a
        href="https://fly.io"
        target="_blank"
        rel="noreferrer"
        className="font-semibold underline decoration-current/40 underline-offset-2 transition-opacity hover:opacity-100"
      >
        Fly.io
      </a>
      , and given a voice with{' '}
      <a
        href="https://elevenlabs.io"
        target="_blank"
        rel="noreferrer"
        className="font-semibold underline decoration-current/40 underline-offset-2 transition-opacity hover:opacity-100"
      >
        ElevenLabs
      </a>
      .
    </p>
  );
}

function SectionNavLink({
  section,
  isActive,
  onSelect,
}: {
  section: { id: SectionId; label: string };
  isActive: boolean;
  onSelect: (sectionId: SectionId) => void;
}) {
  return (
    <button
      onClick={() => onSelect(section.id)}
      className="flex items-center text-left transition-all duration-300"
      style={{
        color: 'var(--color-page-inverted-text)',
      }}
    >
      <span
        className="transition-all duration-300"
        style={{
          width: isActive ? '60px' : '30px',
          height: '2px',
          backgroundColor: 'var(--color-page-inverted-text)',
          opacity: isActive ? 1 : 0.6,
        }}
      />
      <span
        className="transition-all duration-300"
        style={{
          marginLeft: '8px',
          fontSize: isActive ? '18px' : '16px',
          fontWeight: 700,
          lineHeight: 1.5,
          opacity: isActive ? 1 : 0.6,
        }}
      >
        {section.label}
      </span>
    </button>
  );
}

export default function AboutPage() {
  const { navigateWithReveal } = useTransition();
  const isDesktop = useMediaQuery('(min-width: 600px)');
  const [activeSection, setActiveSection] = useState<SectionId>('about');
  const { registerAboutScroller } = useSiteControl();

  const aboutRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);
  const academicsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for active section tracking
  useEffect(() => {
    if (!isDesktop) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section') as SectionId;
            if (id) {
              setActiveSection(id);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.3,
      }
    );

    const sections = [aboutRef.current, experienceRef.current, academicsRef.current];
    sections.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, [isDesktop]);

  const scrollToSection = useCallback((sectionId: SectionId) => {
    const target =
      sectionId === 'about'
        ? aboutRef.current
        : sectionId === 'experience'
          ? experienceRef.current
          : academicsRef.current;

    if (target) {
      const container = scrollContainerRef.current;
      if (!container) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      const containerTop = container.getBoundingClientRect().top;
      const targetTop = target.getBoundingClientRect().top - containerTop + container.scrollTop;
      container.scrollTo({
        top: Math.max(targetTop - container.clientHeight * 0.1, 0),
        behavior: 'smooth',
      });
    }
  }, []);

  // About uses an internal scroll container, so global site control delegates here.
  useEffect(() => {
    return registerAboutScroller((section) => scrollToSection(section));
  }, [registerAboutScroller, scrollToSection]);

  // Emit 'page-ready' on VoiceBus after mount so anything that needs to coordinate
  // with route transitions (e.g., post-navigation actions) can wait for this event
  // instead of guessing with setTimeout.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.VoiceBus) {
      window.VoiceBus.emit('page-ready', 'about');
    }
  }, []);

  const handleBack = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      if (isDesktop) {
        const homeRect = getStoredDesktopHomeAboutButtonRect(window.innerWidth);
        const from = rectFromDomRect(rect);
        navigateWithReveal(
          '/',
          homeRect.left + homeRect.width / 2,
          homeRect.top + homeRect.height / 2,
          { mode: 'collapse' }
        );
        window.setTimeout(() => {
          void startAboutButtonMorph({
            from,
            to: homeRect,
            direction: 'close',
            duration: PORTFOLIO_MORPH_DURATION_MS - EXIT_MORPH_DELAY_MS,
            topLayer: true,
          });
        }, EXIT_MORPH_DELAY_MS);
        return;
      }

      navigateWithReveal('/', originX, originY);
    },
    [isDesktop, navigateWithReveal]
  );

  // Desktop layout
  if (isDesktop) {
    return (
      <div
        className="min-h-screen w-full relative"
        style={{ backgroundColor: 'var(--color-page-inverted-bg)' }}
      >
        {/* Spotlight overlay */}
        <SpotlightEffect />

        {/* Two-panel layout */}
        <div className="flex h-screen">
          {/* Fixed sidebar - 40% */}
          <div
            className="flex flex-col"
            style={{
              width: '40%',
              height: '100vh',
              paddingTop: '16px',
              paddingRight: '16px',
              paddingBottom: '16px',
              paddingLeft: DESKTOP_ABOUT_GUTTER,
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              boxSizing: 'border-box',
              backgroundColor: 'var(--color-page-inverted-bg)',
            }}
          >
            {/* Back button */}
            <BackButton onClick={handleBack} morphTarget />

            <h1
              style={{
                color: 'var(--color-page-inverted-text)',
                fontSize: '28px',
                fontWeight: 700,
                lineHeight: 1.2,
                marginTop: '20px',
              }}
            >
              Venkat L. Turlapati
            </h1>

            {/* Section navigation */}
            <nav className="flex flex-col" style={{ gap: '24px', marginTop: '40px' }}>
              {NAV_SECTIONS.map((section) => (
                <SectionNavLink
                  key={section.id}
                  section={section}
                  isActive={activeSection === section.id}
                  onSelect={scrollToSection}
                />
              ))}
            </nav>

            {/* Social links at bottom */}
            <div className="mt-auto flex items-center justify-start">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center transition-opacity duration-200"
                  style={{
                    color: 'var(--color-page-inverted-text)',
                    opacity: 0.6,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.6';
                  }}
                >
                  <link.icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Scrollable right panel - 60% */}
          <div
            ref={scrollContainerRef}
            className="overflow-y-auto"
            style={{
              width: '60%',
              marginLeft: '40%',
              paddingLeft: DESKTOP_ABOUT_GUTTER,
              paddingRight: DESKTOP_ABOUT_GUTTER,
              paddingTop: '70px',
            }}
          >
            {/* About section */}
            <section ref={aboutRef} data-section="about" style={{ marginBottom: '40px' }}>
              <BioText />
            </section>

            {/* Experience section */}
            <section ref={experienceRef} data-section="experience" style={{ marginBottom: '60px' }}>
              <h2
                style={{
                  color: 'var(--color-page-inverted-text)',
                  fontSize: '24px',
                  fontWeight: 700,
                  marginBottom: '20px',
                }}
              >
                Experience
              </h2>
              <div className="flex flex-col" style={{ gap: '20px' }}>
                {experienceData.map((entry) => (
                  <TimelineEntry
                    key={entry.company}
                    timeline={entry.timeline}
                    title={entry.title}
                    subtitle={entry.company}
                    descriptions={entry.descriptions}
                    skills={entry.skills}
                    url={entry.url}
                  />
                ))}
              </div>
            </section>

            {/* Academics section */}
            <section ref={academicsRef} data-section="academics">
              <h2
                style={{
                  color: 'var(--color-page-inverted-text)',
                  fontSize: '24px',
                  fontWeight: 700,
                  marginBottom: '20px',
                }}
              >
                Academics
              </h2>
              <div className="flex flex-col" style={{ gap: '20px' }}>
                {educationData.map((entry) => (
                  <TimelineEntry
                    key={entry.institution}
                    timeline={entry.timeline}
                    title={entry.title}
                    subtitle={entry.institution}
                    skills={entry.skills}
                    url={entry.url}
                  />
                ))}
              </div>
            </section>

            {/* Footer */}
            <FooterText />
          </div>
        </div>
      </div>
    );
  }

  // Mobile layout
  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{ backgroundColor: 'var(--color-page-inverted-bg)' }}
    >
      <div
        className="mx-auto w-full max-w-[680px] px-5 pb-8"
        style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}
      >
        {/* Back button */}
        <BackButton onClick={handleBack} />

        {/* Bio section */}
        <section ref={aboutRef} data-section="about" className="mt-8 mb-12">
          <BioText />
        </section>

        {/* Experience section */}
        <section ref={experienceRef} data-section="experience" className="mb-12">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: 'var(--color-page-inverted-text)' }}
          >
            Experience
          </h2>
          <div className="flex flex-col gap-4">
            {experienceData.map((entry) => (
              <TimelineEntry
                key={entry.company}
                timeline={entry.timeline}
                title={entry.title}
                subtitle={entry.company}
                descriptions={entry.descriptions}
                skills={entry.skills}
                url={entry.url}
              />
            ))}
          </div>
        </section>

        {/* Academics section */}
        <section ref={academicsRef} data-section="academics" className="mb-12">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: 'var(--color-page-inverted-text)' }}
          >
            Academics
          </h2>
          <div className="flex flex-col gap-4">
            {educationData.map((entry) => (
              <TimelineEntry
                key={entry.institution}
                timeline={entry.timeline}
                title={entry.title}
                subtitle={entry.institution}
                skills={entry.skills}
                url={entry.url}
              />
            ))}
          </div>
        </section>

        {/* Footer */}
        <FooterText compact />
      </div>
    </div>
  );
}
