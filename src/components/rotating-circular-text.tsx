'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface RotatingCircularTextProps {
  visible: boolean;
}

// Text pairs at 0%, 25%, 50%, 75% around the circle
const OFFSETS = ['0%', '25%', '50%', '75%'];

export function RotatingCircularText({ visible }: RotatingCircularTextProps) {
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 2-second start delay after visibility
  useEffect(() => {
    if (!visible) {
      setStarted(false);
      return;
    }
    const timer = setTimeout(() => setStarted(true), 2000);
    return () => clearTimeout(timer);
  }, [visible]);

  // GSAP pulsing animation: scale 1.0 to 1.05, 1500ms, yoyo repeating
  useGSAP(() => {
    if (!started || !containerRef.current) return;
    gsap.to(containerRef.current, {
      scale: 1.05,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });
  }, { dependencies: [started] });

  // If not visible or not started, render transparent placeholder to prevent layout shift
  if (!visible || !started) {
    return <div style={{ width: 144, height: 144 }} />;
  }

  return (
    <div
      ref={containerRef}
      style={{ width: 144, height: 144, pointerEvents: 'none' }}
    >
      {/* Rotating wrapper using CSS animation class */}
      <div className="animate-spin-slow" style={{ width: 144, height: 144 }}>
        <svg
          viewBox="0 0 144 144"
          width={144}
          height={144}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <path
              id="circlePath"
              d="M 72,72 m -72,0 a 72,72 0 1,1 144,0 a 72,72 0 1,1 -144,0"
            />
          </defs>
          {OFFSETS.map((offset, i) => (
            <text key={i}>
              <textPath href="#circlePath" startOffset={offset}>
                <tspan
                  style={{
                    fontSize: '16.6px',
                    fontWeight: 600,
                    fill: 'var(--color-circular-text)',
                  }}
                >
                  Click Here
                </tspan>
                <tspan
                  style={{
                    fontSize: '23.8px',
                    fontWeight: 600,
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
