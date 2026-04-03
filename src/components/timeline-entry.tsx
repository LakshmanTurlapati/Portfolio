'use client';

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
      window.open(url, '_blank');
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex flex-row gap-4 p-4 rounded-xl transition-all duration-200 ${
        url ? 'cursor-pointer' : ''
      } hover:backdrop-blur-[10px]`}
      style={{
        borderRadius: '12px',
        border: '1px solid transparent',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
        el.style.border = '1px solid rgba(128, 128, 128, 0.15)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.backgroundColor = 'transparent';
        el.style.border = '1px solid transparent';
      }}
    >
      {/* Timeline column */}
      <div className="flex-shrink-0" style={{ width: '120px' }}>
        <span
          className="text-sm"
          style={{ color: 'var(--color-page-inverted-text)', opacity: 0.7 }}
        >
          {timeline}
        </span>
      </div>

      {/* Content column */}
      <div className="flex-1">
        <h3
          className="text-base font-bold"
          style={{ color: 'var(--color-page-inverted-text)' }}
        >
          {title}
        </h3>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--color-page-inverted-text)', opacity: 0.7 }}
        >
          {subtitle}
        </p>

        {descriptions && descriptions.length > 0 && (
          <div className="mt-2">
            {descriptions.map((desc, index) => (
              <p
                key={index}
                className="text-sm leading-relaxed mt-1"
                style={{
                  color: 'var(--color-page-inverted-text)',
                  opacity: 0.87,
                }}
              >
                {desc}
              </p>
            ))}
          </div>
        )}

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 rounded-full text-xs timeline-skill-pill"
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
