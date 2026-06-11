'use client';

import { openExternalUrl } from '@/lib/open-external';

interface TimelineEntryProps {
  timeline: string;
  title: string;
  subtitle: string;
  descriptions?: string[];
  skills: string[];
  url?: string;
}

export function TimelineEntry({
  timeline,
  title,
  subtitle,
  descriptions,
  skills,
  url,
}: TimelineEntryProps) {
  const handleClick = () => {
    if (url) {
      openExternalUrl(url);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex flex-row gap-4 rounded-xl p-4 transition-all duration-300 sm:p-3 ${
        url ? 'cursor-pointer' : ''
      } hover:backdrop-blur-[10px]`}
      style={{
        borderRadius: '12px',
        border: '1px solid transparent',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.backgroundColor = 'rgba(128, 128, 128, 0.05)';
        el.style.border = '1px solid color-mix(in srgb, var(--color-page-inverted-text) 20%, transparent)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.backgroundColor = 'transparent';
        el.style.border = '1px solid transparent';
      }}
    >
      {/* Timeline column */}
      <div
        className="flex-shrink-0"
        style={{ width: 'clamp(96px, 10vw, 160px)' }}
      >
        <span
          style={{
            color: 'var(--color-page-inverted-text)',
            fontSize: '16px',
            fontWeight: 700,
            lineHeight: 1.5,
            opacity: 0.6,
          }}
        >
          {timeline}
        </span>
      </div>

      {/* Content column */}
      <div className="flex-1">
        <h3
          style={{
            color: 'var(--color-page-inverted-text)',
            fontSize: '18px',
            fontWeight: 700,
            lineHeight: 1.35,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            color: 'var(--color-page-inverted-text)',
            fontSize: '16px',
            lineHeight: 1.5,
            marginTop: '4px',
            opacity: 0.7,
          }}
        >
          {subtitle}
        </p>

        {descriptions && descriptions.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            {descriptions.map((desc, index) => (
              <p
                key={index}
                style={{
                  color: 'var(--color-page-inverted-text)',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  marginBottom: '8px',
                  opacity: 0.7,
                }}
              >
                {desc}
              </p>
            ))}
          </div>
        )}

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2" style={{ marginTop: '10px' }}>
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full timeline-skill-pill"
                style={{
                  fontSize: '12px',
                  lineHeight: 1.5,
                  padding: '6px 12px',
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
