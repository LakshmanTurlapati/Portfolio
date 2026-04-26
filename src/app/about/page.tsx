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

function BackButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center rounded-xl transition-all duration-200"
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
    >
      <FaArrowLeft size={18} />
    </button>
  );
}

function FooterText() {
  return (
    <p
      className="text-sm text-center"
      style={{
        color: 'var(--color-page-inverted-text)',
        opacity: 0.7,
        paddingTop: '180px',
        paddingBottom: '40px',
      }}
    >
      Designed in <strong>Figma</strong>, coded in <strong>Flutter</strong> (because
      why not?), and deployed on <strong>AWS</strong>. Inter typeface ties it all
      together.
    </p>
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

  const sectionRefs: Record<SectionId, React.RefObject<HTMLDivElement | null>> = {
    about: aboutRef,
    experience: experienceRef,
    academics: academicsRef,
  };

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
    const ref = sectionRefs[sectionId];
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
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
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      navigateWithReveal('/', originX, originY);
    },
    [navigateWithReveal]
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
            className="flex flex-col justify-between"
            style={{
              width: '40%',
              padding: '40px',
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
            }}
          >
            {/* Back button */}
            <BackButton onClick={handleBack} />

            {/* Center content: name + nav */}
            <div className="flex flex-col items-center">
              <h1
                className="text-2xl font-bold mb-8"
                style={{ color: 'var(--color-page-inverted-text)' }}
              >
                Venkat L. Turlapati
              </h1>

              {/* Section navigation */}
              <nav className="flex flex-col gap-4">
                {NAV_SECTIONS.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className="text-left transition-all duration-200"
                      style={{
                        color: 'var(--color-page-inverted-text)',
                        opacity: isActive ? 1 : 0.6,
                        fontSize: isActive ? '18px' : '16px',
                      }}
                    >
                      {section.label}
                      <div
                        className="mt-1 transition-all duration-200"
                        style={{
                          width: isActive ? '60px' : '30px',
                          height: '2px',
                          backgroundColor: 'var(--color-page-inverted-text)',
                          opacity: isActive ? 1 : 0.4,
                        }}
                      />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Social links at bottom */}
            <div className="flex gap-4 justify-center">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity duration-200"
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
              paddingLeft: '120px',
              paddingRight: '120px',
              paddingTop: '70px',
            }}
          >
            {/* About section */}
            <section ref={aboutRef} data-section="about" className="mb-16">
              <BioText />
            </section>

            {/* Experience section */}
            <section ref={experienceRef} data-section="experience" className="mb-16">
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
            <section ref={academicsRef} data-section="academics" className="mb-16">
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
            <FooterText />
          </div>
        </div>
      </div>
    );
  }

  // Mobile layout
  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: 'var(--color-page-inverted-bg)' }}
    >
      <div className="px-6 py-8">
        {/* Back button */}
        <BackButton onClick={handleBack} />

        {/* Bio section */}
        <section className="mt-8 mb-12">
          <BioText />
        </section>

        {/* Experience section */}
        <section className="mb-12">
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
        <section className="mb-12">
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
        <FooterText />
      </div>
    </div>
  );
}
