'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { HoverEffect } from '@/data/projects';

export interface DataGridConfig {
  cellSize: number;
  spacing: number;
  duration: number;
  animationType: 'pulse' | 'wave' | 'random';
  pulseEffect: boolean;
  mouseGlow: boolean;
  proximityReveal: boolean;
  proximityRadius: number;
  opacityMin: number;
  opacityMax: number;
}

export const DEFAULT_DG_CFG: DataGridConfig = {
  cellSize: 6,
  spacing: 10,
  duration: 6.5,
  animationType: 'pulse',
  pulseEffect: true,
  mouseGlow: true,
  proximityReveal: true,
  proximityRadius: 160,
  opacityMin: 0.03,
  opacityMax: 0.16,
};

// Shared hover state written by cards, read by the grid each frame
interface CardHoverState {
  active: boolean;
  cx: number;
  cy: number;
  effect: HoverEffect;
  startedAt: number;
  endedAt: number;
}

// Global mutable hover state — avoids prop drilling through React
const cardHover: CardHoverState = { active: false, cx: 0, cy: 0, effect: 'ripple', startedAt: 0, endedAt: 0 };

export function setCardHover(state: Partial<CardHoverState>) {
  Object.assign(cardHover, state);
}

function computeHoverMod(
  effect: HoverEffect, dx: number, dy: number, dist: number,
  age: number, cx: number, cy: number, idx: number
): number {
  const REACH = 320;
  if (dist > REACH * 1.6 && effect !== 'scan' && effect !== 'binary') return 0;

  switch (effect) {
    case 'ripple': {
      const speed = 240, ringWidth = 40;
      let best = 0;
      for (let ring = 0; ring < 3; ring++) {
        const ringRadius = ((age * speed) - ring * 120) % (REACH + 120);
        if (ringRadius < 0) continue;
        const d = Math.abs(dist - ringRadius);
        if (d < ringWidth) {
          const w = 1 - d / ringWidth;
          best = Math.max(best, w * Math.max(0, 1 - ringRadius / REACH));
        }
      }
      return best;
    }
    case 'heartbeat': {
      const beat = age * 1.6;
      const phase = beat - Math.floor(beat);
      const p1 = Math.exp(-Math.pow((phase - 0.00) / 0.05, 2));
      const p2 = Math.exp(-Math.pow((phase - 0.15) / 0.05, 2)) * 0.65;
      const pulse = Math.max(p1, p2);
      const falloff = Math.max(0, 1 - dist / REACH);
      return pulse * falloff * falloff;
    }
    case 'wave': {
      const speed = 280;
      const front = age * speed;
      const d = dist - front;
      const sigma = 60;
      const pulse = Math.exp(-(d * d) / (2 * sigma * sigma));
      const falloff = Math.max(0, 1 - dist / (REACH * 1.2));
      return pulse * falloff;
    }
    case 'spiral': {
      const ang = Math.atan2(dy, dx);
      const rotSpeed = 1.8, arms = 3;
      const phase = Math.sin(arms * (ang - rotSpeed * age) + dist * 0.03);
      const bright = Math.max(0, phase);
      const falloff = Math.max(0, 1 - dist / REACH);
      return bright * falloff;
    }
    case 'scan': {
      const period = 2.5;
      const phase = (age % period) / period;
      const bar = phase < 0.5 ? phase * 2 : 2 - phase * 2;
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
      const scanX = bar * vw;
      const d = Math.abs(cx - scanX);
      const w = 80;
      if (d > w) return 0;
      const intensity = 1 - d / w;
      const near = Math.max(0, 1 - Math.abs(dx) / (REACH * 1.2));
      return intensity * (0.5 + 0.5 * near);
    }
    case 'magnet': {
      const pullPhase = 0.5 + 0.5 * Math.sin(age * 6);
      const falloff = Math.max(0, 1 - dist / (REACH * 0.9));
      return falloff * falloff * (0.4 + 0.6 * pullPhase);
    }
    case 'scatter': {
      const speed = 420;
      const front = age * speed;
      const d = Math.abs(dist - front);
      const sigma = 40;
      const pulse = Math.exp(-(d * d) / (2 * sigma * sigma));
      const jitter = 0.6 + 0.4 * Math.sin(idx * 12.9898);
      const falloff = Math.max(0, 1 - front / (REACH * 1.5));
      return pulse * jitter * falloff;
    }
    case 'flow': {
      const k = 0.018;
      const f = Math.sin(dx * k + age * 1.2) * 0.5 + Math.sin(dy * k * 0.8 - age * 0.9) * 0.5;
      const bright = Math.max(0, f);
      const falloff = Math.max(0, 1 - dist / (REACH * 1.1));
      return bright * falloff;
    }
    case 'binary': {
      const colW = 28;
      const col = Math.floor(cx / colW);
      const colSeed = Math.sin(col * 91.23) * 0.5 + 0.5;
      const speed = 180 + colSeed * 220;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
      const dropY = (age * speed + colSeed * 600) % (vh + 200);
      const d = cy - dropY;
      if (d < -120 || d > 6) return 0;
      const intensity = d <= 0 ? Math.max(0, 1 + d / 120) : 1 + d / 6;
      const near = Math.max(0, 1 - Math.abs(dx) / (REACH * 1.2));
      return intensity * 0.9 * (0.3 + 0.7 * near);
    }
    case 'constellation': {
      let best = 0;
      for (let s = 0; s < 4; s++) {
        const a = age * 0.8 + s * 1.57;
        const rad = 120 + 60 * Math.sin(age * 0.5 + s);
        const sx = Math.cos(a + s) * rad;
        const sy = Math.sin(a * 0.9 + s) * rad;
        const ddx = dx - sx, ddy = dy - sy;
        const dd = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dd < 50) best = Math.max(best, 1 - dd / 50);
      }
      const falloff = Math.max(0, 1 - dist / (REACH * 0.9));
      return best * falloff + falloff * falloff * 0.15;
    }
    default: {
      const falloff = Math.max(0, 1 - dist / REACH);
      return falloff * falloff * 0.5;
    }
  }
}

interface GridState {
  rows: number;
  cols: number;
  cellSize: number;
  spacing: number;
  offX: number;
  offY: number;
  duration: number;
  opacityMin: number;
  opacityMax: number;
  animationType: string;
  pulseEffect: boolean;
  color: string;
  dpr: number;
  delays: Float32Array;
  vw: number;
  vh: number;
}

interface DataGridProps {
  cfg: DataGridConfig;
  isDark: boolean;
}

export function DataGrid({ cfg, isDark }: DataGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GridState | null>(null);

  // Build grid state
  const buildGrid = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { cellSize, spacing, duration, opacityMin, opacityMax, animationType, pulseEffect } = cfg;
    const vw = wrap.clientWidth;
    const vh = wrap.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';

    const cols = Math.max(8, Math.floor((vw + spacing) / (cellSize + spacing)));
    const rows = Math.max(8, Math.floor((vh + spacing) / (cellSize + spacing)));
    const gridW = cols * cellSize + (cols - 1) * spacing;
    const gridH = rows * cellSize + (rows - 1) * spacing;
    const offX = (vw - gridW) / 2;
    const offY = (vh - gridH) / 2;

    const total = rows * cols;
    const cRow = (rows - 1) / 2;
    const cCol = (cols - 1) / 2;
    const maxDist = Math.sqrt(cRow * cRow + cCol * cCol);

    const delays = new Float32Array(total);
    for (let i = 0; i < total; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      if (animationType === 'wave') {
        delays[i] = ((r + c) / (rows + cols)) * duration;
      } else if (animationType === 'random') {
        delays[i] = Math.random() * duration;
      } else {
        const dr = r - cRow, dc = c - cCol;
        delays[i] = (Math.sqrt(dr * dr + dc * dc) / maxDist) * duration * 0.55;
      }
    }

    stateRef.current = {
      rows, cols, cellSize, spacing, offX, offY,
      duration, opacityMin, opacityMax,
      animationType, pulseEffect,
      color: isDark ? '0,0,0' : '255,255,255',
      dpr, delays, vw, vh,
    };
  }, [cfg, isDark]);

  useEffect(() => { buildGrid(); }, [buildGrid]);

  // Render loop + mouse tracking
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let rafId = 0;
    let mx = -9999, my = -9999;
    const startTime = performance.now();

    const onMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    };
    const onLeave = () => { mx = -9999; my = -9999; };

    const render = (now: number) => {
      const s = stateRef.current;
      if (!s) { rafId = requestAnimationFrame(render); return; }
      const { rows, cols, cellSize, spacing, offX, offY, duration, opacityMin, opacityMax, pulseEffect, color, dpr, delays } = s;
      const t = (now - startTime) / 1000;
      const radius = cfg.proximityRadius || 140;
      const radiusSq = radius * radius;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, s.vw, s.vh);

      // Read card-hover state
      const hover = cardHover;
      let hoverStrength = 0;
      let hoverEffect: HoverEffect | null = null;
      let hCx = 0, hCy = 0, hAge = 0;
      if (hover.active) {
        hoverEffect = hover.effect;
        hCx = hover.cx; hCy = hover.cy;
        hAge = (now - hover.startedAt) / 1000;
        hoverStrength = Math.min(1, hAge / 0.25);
      } else if (hover.endedAt) {
        const since = (now - hover.endedAt) / 1000;
        if (since < 0.5) {
          hoverEffect = hover.effect;
          hCx = hover.cx; hCy = hover.cy;
          hAge = (hover.endedAt - hover.startedAt) / 1000 + since;
          hoverStrength = Math.max(0, 1 - since / 0.5);
        }
      }

      const halfCell = cellSize / 2;
      const step = cellSize + spacing;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const x = offX + c * step;
          const y = offY + r * step;
          const cx = x + halfCell;
          const cy = y + halfCell;

          let baseOp: number;
          if (pulseEffect) {
            const phase = ((t + delays[i]) / duration) % 2;
            const tri = phase < 1 ? phase : 2 - phase;
            const eased = tri * tri * (3 - 2 * tri);
            baseOp = opacityMin + (opacityMax - opacityMin) * eased;
          } else {
            baseOp = (opacityMin + opacityMax) / 2;
          }

          let op = baseOp;
          let scale = 1;
          if (cfg.proximityReveal) {
            const dx = cx - mx, dy = cy - my;
            const dSq = dx * dx + dy * dy;
            if (dSq < radiusSq) {
              const prox = 1 - Math.sqrt(dSq) / radius;
              op = Math.min(1, baseOp + prox * 0.85);
              scale = 1 + prox * 1.2;
            }
          }

          if (hoverStrength > 0 && hoverEffect) {
            const dx = cx - hCx, dy = cy - hCy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const mod = computeHoverMod(hoverEffect, dx, dy, dist, hAge, cx, cy, i);
            if (mod > 0) {
              const boost = mod * hoverStrength;
              op = Math.min(1, op + boost * 0.7);
              scale = Math.max(scale, 1 + boost * 1.4);
            }
          }

          if (op < 0.005) continue;
          ctx.fillStyle = `rgba(${color},${op.toFixed(3)})`;
          if (scale === 1) {
            ctx.fillRect(x, y, cellSize, cellSize);
          } else {
            const size = cellSize * scale;
            ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
          }
        }
      }

      if (cfg.mouseGlow && mx > -9000) {
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, 260);
        g.addColorStop(0, `rgba(${color},0.10)`);
        g.addColorStop(1, `rgba(${color},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, s.vw, s.vh);
      }
      ctx.restore();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [cfg.proximityReveal, cfg.proximityRadius, cfg.mouseGlow]);

  // Rebuild on resize
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(buildGrid, 150);
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, [buildGrid]);

  return (
    <div ref={wrapRef} className="fixed inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}
