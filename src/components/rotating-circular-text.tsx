'use client';

import { useState, useEffect } from 'react';

interface RotatingCircularTextProps {
  visible: boolean;
}

export function RotatingCircularText({ visible }: RotatingCircularTextProps) {
  const [started, setStarted] = useState(false);

  // 2-second start delay after visibility
  useEffect(() => {
    if (!visible) {
      setStarted(false);
      return;
    }
    const timer = setTimeout(() => setStarted(true), 2000);
    return () => clearTimeout(timer);
  }, [visible]);

  // If not visible or not started, render transparent placeholder to prevent layout shift
  if (!visible || !started) {
    return <div style={{ width: 240, height: 240 }} />;
  }

  return (
    <div style={{ width: 240, height: 240, pointerEvents: 'none' }}>
      <div className="animate-spin-slow" style={{ width: 240, height: 240 }}>
        <svg
          viewBox="0 0 240 240"
          width={240}
          height={240}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <path
              id="circlePath"
              d="M 120,120 m -100,0 a 100,100 0 1,1 200,0 a 100,100 0 1,1 -200,0"
            />
          </defs>
          {['0%', '25%', '50%', '75%'].map((offset, i) => (
            <text key={i}>
              <textPath href="#circlePath" startOffset={offset}>
                <tspan
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    fill: 'var(--color-circular-text)',
                  }}
                >
                  Click Here
                </tspan>
                <tspan
                  style={{
                    fontSize: '30px',
                    fontWeight: 700,
                    fill: 'var(--color-circular-bullet)',
                  }}
                >
                  {' \u2022 '}
                </tspan>
              </textPath>
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
