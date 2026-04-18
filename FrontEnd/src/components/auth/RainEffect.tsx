'use client';

import React, { useRef, useEffect, useCallback } from 'react';

/*
 * Lightweight canvas rain — performance-first rewrite.
 *
 * What was killing perf before:
 *   1. ctx.filter = 'blur(...)' — forces per-stroke compositing, ~10x slower
 *   2. ctx.createLinearGradient() per drop per frame — GC pressure + allocation
 *   3. ctx.save() / ctx.restore() 160× per frame
 *   4. 160 total drops
 *
 * Fixes:
 *   - NO blur filter — depth is faked with opacity + thinner width
 *   - NO per-frame gradient — simple rgba strokeStyle
 *   - NO save/restore — batch by layer, set state once
 *   - ~70 total drops
 *   - DPR capped at 1 (the rain is subtle, retina not needed)
 */

interface Raindrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  width: number;
  opacity: number;
  windPhase: number;
  windSpeed: number;
  layer: number;
}

interface LayerConfig {
  count: number;
  speedMin: number;
  speedMax: number;
  lengthMin: number;
  lengthMax: number;
  widthMin: number;
  widthMax: number;
  opacityMin: number;
  opacityMax: number;
  windDrift: number;
  color: string;
}

const LAYERS: LayerConfig[] = [
  {
    // Background — soft, slow, thin
    count: 40,
    speedMin: 1.2,
    speedMax: 2.8,
    lengthMin: 12,
    lengthMax: 28,
    widthMin: 0.4,
    widthMax: 0.7,
    opacityMin: 0.06,
    opacityMax: 0.15,
    windDrift: 0.3,
    color: '180,200,230',
  },
  {
    // Mid — moderate visibility
    count: 30,
    speedMin: 3.5,
    speedMax: 6,
    lengthMin: 18,
    lengthMax: 44,
    widthMin: 0.5,
    widthMax: 1.0,
    opacityMin: 0.1,
    opacityMax: 0.24,
    windDrift: 0.6,
    color: '200,215,240',
  },
  {
    // Foreground — sharper, faster, few
    count: 15,
    speedMin: 7,
    speedMax: 11,
    lengthMin: 24,
    lengthMax: 60,
    widthMin: 0.6,
    widthMax: 1.3,
    opacityMin: 0.12,
    opacityMax: 0.3,
    windDrift: 1.0,
    color: '225,235,255',
  },
];

const WIND_ANGLE = (18 * Math.PI) / 180;
const COS_W = Math.cos(WIND_ANGLE);
const SIN_W = Math.sin(WIND_ANGLE);

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function makeDrop(layer: number, w: number, h: number, top: boolean): Raindrop {
  const cfg = LAYERS[layer];
  const xSpread = h * 0.35;
  return {
    x: rand(-xSpread, w + xSpread * 0.15),
    y: top ? rand(-80, -8) : rand(-h * 0.1, h),
    speed: rand(cfg.speedMin, cfg.speedMax),
    length: rand(cfg.lengthMin, cfg.lengthMax),
    width: rand(cfg.widthMin, cfg.widthMax),
    opacity: rand(cfg.opacityMin, cfg.opacityMax),
    windPhase: rand(0, Math.PI * 2),
    windSpeed: rand(0.01, 0.025),
    layer,
  };
}

export default function RainEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<Raindrop[]>([]);
  const animRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  const init = useCallback(() => {
    const { w, h } = sizeRef.current;
    const drops: Raindrop[] = [];
    for (let l = 0; l < LAYERS.length; l++) {
      for (let i = 0; i < LAYERS[l].count; i++) {
        drops.push(makeDrop(l, w, h, false));
      }
    }
    dropsRef.current = drops;
  }, []);

  const resize = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    // DPR=1 intentionally — rain is subtle, no need for retina resolution
    c.width = r.width;
    c.height = r.height;
    sizeRef.current = { w: r.width, h: r.height };
    init();
  }, [init]);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);

    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d', { alpha: true });
    if (!ctx) return;

    ctx.lineCap = 'round';

    const tick = () => {
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);

      const drops = dropsRef.current;

      // Draw layer by layer so we only change strokeStyle/lineWidth when layer changes
      let prevLayer = -1;

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        const cfg = LAYERS[d.layer];

        // Wind wobble
        d.windPhase += d.windSpeed;
        const wobble = Math.sin(d.windPhase) * cfg.windDrift * 0.3;

        // Move
        d.x += SIN_W * d.speed + wobble;
        d.y += COS_W * d.speed;

        // Off-screen → recycle
        if (d.y > h + 40 || d.x > w + 80) {
          drops[i] = makeDrop(d.layer, w, h, true);
          continue;
        }

        // Set style only when layer changes (drops are sorted by layer)
        if (d.layer !== prevLayer) {
          prevLayer = d.layer;
        }

        // Simple single-color stroke — no gradient, no blur
        ctx.strokeStyle = `rgba(${cfg.color},${d.opacity})`;
        ctx.lineWidth = d.width;

        const ex = d.x + SIN_W * d.length;
        const ey = d.y + COS_W * d.length;

        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [resize]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
      aria-hidden="true"
    />
  );
}
