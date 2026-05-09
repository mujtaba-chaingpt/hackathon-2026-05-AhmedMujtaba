'use client';

import React, { useEffect, useRef, memo } from 'react';
import { playThunderClap } from '@/lib/audio';

/**
 * NoirBackground — fixed, full-screen canvas animated background.
 *
 * Layers (back → front):
 *  1. Deep noir gradient (blue-black → near black)
 *  2. Pulsing blood-red corner glow (top-right)
 *  3. Pulsing gold glow (bottom-left)
 *  4. Warm street-lamp cone (top-right area, amber)
 *  5. Angled rain streaks
 *  6. Slow fog wisps
 *  7. Floating dust/ember particles
 *  8. Large autumn leaves (bezier-curve shapes, high opacity)
 *  9. Lightning flash overlay (triggered every 20–45 s)
 * 10. Subtle scanlines
 */

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; opacity: number; opacityDelta: number; color: string;
}

interface Wisp {
  x: number; y: number; width: number; height: number;
  vx: number; vy: number; opacity: number; opacityDelta: number;
}

interface RainDrop {
  x: number; y: number; vy: number; length: number; opacity: number;
}

interface Leaf {
  x: number; y: number; vx: number; vy: number;
  rotation: number; rotationSpeed: number;
  sizeW: number; sizeH: number;
  opacity: number; opacityMax: number; opacityDelta: number;
  color: string; wobble: number;
}

const GOLD    = 'rgba(201,162,39,';
const CRIMSON = 'rgba(155,34,38,';
const EMBER   = 'rgba(220,100,30,';  // orange-ember particles
const SMOKE   = 'rgba(180,170,210,';

/** Rich autumn palette — more vivid than before */
const LEAF_COLORS = [
  'rgba(218, 128, 24,',   // vivid amber
  'rgba(185, 62,  20,',   // deep rust
  'rgba(148, 78,  28,',   // warm brown
  'rgba(122, 22,  22,',   // dark blood-red  ← thriller touch
  'rgba(88,  108, 38,',   // olive green
  'rgba(200, 98,  12,',   // orange-amber
  'rgba(168, 46,  14,',   // burnt sienna
  'rgba(230, 150, 30,',   // bright gold-amber
];

function createParticle(w: number, h: number): Particle {
  const roll = Math.random();
  const color = roll < 0.45 ? GOLD : roll < 0.65 ? CRIMSON : roll < 0.80 ? EMBER : SMOKE;
  return {
    x: Math.random() * w, y: h + Math.random() * 40,
    vx: (Math.random() - 0.5) * 0.45,
    vy: -(0.10 + Math.random() * 0.30),
    size: 0.7 + Math.random() * 2.0,
    opacity: 0, opacityDelta: 0.003 + Math.random() * 0.005, color,
  };
}

function createWisp(w: number, h: number): Wisp {
  return {
    x: Math.random() * w, y: h * 0.35 + Math.random() * h * 0.55,
    width: 220 + Math.random() * 380, height: 50 + Math.random() * 90,
    vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.05,
    opacity: 0, opacityDelta: 0.0003 + Math.random() * 0.0005,
  };
}

function createRainDrop(w: number, h: number): RainDrop {
  return {
    x: Math.random() * (w + 100) - 50,
    y: Math.random() * h,
    vy: 10 + Math.random() * 8,
    length: 9 + Math.random() * 18,
    opacity: 0.04 + Math.random() * 0.08,
  };
}

function createLeaf(w: number, h: number, initialY?: number): Leaf {
  const opacityMax = 0.72 + Math.random() * 0.22; // 0.72–0.94
  return {
    x: Math.random() * (w + 400) - 200,
    y: initialY !== undefined ? initialY : -40 - Math.random() * 300,
    vx: (Math.random() - 0.5) * 3.2,   // wider horizontal swing
    vy: 0.60 + Math.random() * 2.0,     // varied fall speeds
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.12,
    sizeW: 14 + Math.random() * 22,     // 14–36 px
    sizeH: 7  + Math.random() * 11,     // 7–18 px
    opacity: 0, opacityMax, opacityDelta: 0.012 + Math.random() * 0.022,
    color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
    wobble: Math.random() * Math.PI * 2,
  };
}

const NoirBackground = memo(function NoirBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width  = w;
    canvas.height = h;

    // ── State ────────────────────────────────────────
    const particles: Particle[] = Array.from({ length: 60 }, () => {
      const p = createParticle(w, h);
      p.y = Math.random() * h;
      p.opacity = Math.random() * 0.5;
      return p;
    });

    const wisps: Wisp[] = Array.from({ length: 10 }, () => {
      const ww = createWisp(w, h);
      ww.opacity = Math.random() * 0.045;
      return ww;
    });

    const rainDrops: RainDrop[] = Array.from({ length: 110 }, () => createRainDrop(w, h));

    // 60 leaves — zone-distributed so all screen areas are covered at start
    const ZONES = [
      () => Math.random() * h * 0.18,                          // top strip
      () => h * 0.18 + Math.random() * h * 0.17,              // upper-mid
      () => h * 0.35 + Math.random() * h * 0.18,              // center
      () => h * 0.53 + Math.random() * h * 0.18,              // lower-mid
      () => h * 0.71 + Math.random() * h * 0.29,              // bottom (incl. corners)
    ];
    const leaves: Leaf[] = Array.from({ length: 60 }, (_, idx) => {
      const zoneY = ZONES[idx % ZONES.length]();
      // Bias x toward left/right corners for ~⅓ of leaves
      const edgeBias = idx % 3 === 0;
      const edgeX = edgeBias
        ? (Math.random() < 0.5 ? Math.random() * w * 0.25 : w * 0.75 + Math.random() * w * 0.25)
        : Math.random() * w;
      const lf = createLeaf(w, h, zoneY);
      lf.x = edgeX;
      lf.opacity = Math.random() * lf.opacityMax;
      return lf;
    });

    // ── Lightning flash state ─────────────────────
    let lightningAlpha = 0;
    let animating = true;

    function triggerLightning() {
      lightningAlpha = 0.30 + Math.random() * 0.28;
      // Double flash: a dimmer second flash 130ms later
      setTimeout(() => {
        if (lightningAlpha < 0.04) lightningAlpha = 0.12 + Math.random() * 0.10;
      }, 130);
      // Thunder follows 0.8 – 3.5 s after the flash (distance simulation)
      const thunderDelay = 800 + Math.random() * 2700;
      setTimeout(() => { try { playThunderClap(); } catch {} }, thunderDelay);
    }

    function scheduleNextLightning() {
      if (!animating) return;
      const delay = 20000 + Math.random() * 30000; // 20–50 s
      setTimeout(() => {
        triggerLightning();
        scheduleNextLightning();
      }, delay);
    }
    scheduleNextLightning();

    let pulse = 0;

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width  = w;
      canvas.height = h;
    };
    window.addEventListener('resize', onResize);

    // ── Draw loop ─────────────────────────────────
    const draw = () => {
      frameRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);
      pulse += 0.007;

      // ── 1. Layered dark gradient ─────────────────
      const bg = ctx.createRadialGradient(w * 0.25, h * 0.35, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.9);
      bg.addColorStop(0,    '#0e0e1c');
      bg.addColorStop(0.35, '#09090f');
      bg.addColorStop(0.75, '#070709');
      bg.addColorStop(1,    '#050507');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // ── 2. Pulsing blood-red glow — top right ────
      const rPulse = 0.10 + Math.sin(pulse) * 0.042;
      const rGrad = ctx.createRadialGradient(w * 1.05, -h * 0.05, 0, w * 0.85, h * 0.2, w * 0.65);
      rGrad.addColorStop(0,   `rgba(155,28,32,${rPulse})`);
      rGrad.addColorStop(0.5, `rgba(120,18,22,${rPulse * 0.4})`);
      rGrad.addColorStop(1,   'rgba(155,28,32,0)');
      ctx.fillStyle = rGrad;
      ctx.fillRect(0, 0, w, h);

      // ── 3. Pulsing gold glow — bottom left ───────
      const gPulse = 0.055 + Math.sin(pulse + 2.1) * 0.022;
      const gGrad = ctx.createRadialGradient(0, h, 0, w * 0.12, h * 0.88, w * 0.55);
      gGrad.addColorStop(0,   `rgba(201,162,39,${gPulse})`);
      gGrad.addColorStop(0.5, `rgba(160,120,20,${gPulse * 0.35})`);
      gGrad.addColorStop(1,   'rgba(201,162,39,0)');
      ctx.fillStyle = gGrad;
      ctx.fillRect(0, 0, w, h);

      // ── 4. Warm street-lamp amber cone (top right) ─
      const lampPulse = 0.07 + Math.sin(pulse * 0.6 + 0.8) * 0.012;
      const lGrad = ctx.createRadialGradient(w * 0.78, -h * 0.02, 0, w * 0.7, h * 0.15, h * 0.75);
      lGrad.addColorStop(0,   `rgba(255,210,100,${lampPulse})`);
      lGrad.addColorStop(0.35,`rgba(220,170,60,${lampPulse * 0.4})`);
      lGrad.addColorStop(1,   'rgba(220,160,40,0)');
      ctx.fillStyle = lGrad;
      ctx.fillRect(0, 0, w, h);

      // ── 5. Angled rain streaks ───────────────────
      ctx.save();
      ctx.strokeStyle = 'rgba(170,200,255,0.85)';
      ctx.lineWidth = 0.55;
      for (const drop of rainDrops) {
        drop.y += drop.vy;
        if (drop.y > h + drop.length) {
          drop.y  = -drop.length - Math.random() * 50;
          drop.x  = Math.random() * (w + 100) - 50;
        }
        ctx.globalAlpha = drop.opacity;
        ctx.beginPath();
        // slight 12° angle (wind-driven rain)
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.length * 0.21, drop.y + drop.length);
        ctx.stroke();
      }
      ctx.restore();

      // ── 6. Fog wisps ─────────────────────────────
      for (const wisp of wisps) {
        wisp.x += wisp.vx;
        wisp.y += wisp.vy;
        wisp.opacity += wisp.opacityDelta;
        if (wisp.opacity > 0.065) wisp.opacityDelta = -Math.abs(wisp.opacityDelta);
        if (wisp.opacity < 0) { Object.assign(wisp, createWisp(w, h)); wisp.opacity = 0; }
        if (wisp.x < -wisp.width)      wisp.x = w + wisp.width;
        if (wisp.x > w + wisp.width)   wisp.x = -wisp.width;
        ctx.save();
        ctx.globalAlpha = Math.max(0, wisp.opacity);
        const wg = ctx.createRadialGradient(wisp.x, wisp.y, 0, wisp.x, wisp.y, wisp.width * 0.5);
        wg.addColorStop(0, 'rgba(185,175,225,0.20)');
        wg.addColorStop(1, 'rgba(185,175,225,0)');
        ctx.fillStyle = wg;
        ctx.beginPath();
        ctx.ellipse(wisp.x, wisp.y, wisp.width * 0.5, wisp.height * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ── 7. Dust & ember particles ─────────────────
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx + Math.sin(pulse * 0.35 + i) * 0.045;
        p.y += p.vy;
        p.opacity += p.opacityDelta;
        if (p.opacity > 0.70) p.opacityDelta = -Math.abs(p.opacityDelta);
        if (p.opacity < 0 || p.y < -20) { particles[i] = createParticle(w, h); continue; }
        ctx.save();
        const op = Math.max(0, p.opacity);
        ctx.globalAlpha = op;
        ctx.fillStyle = p.color + op.toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ── 8. Autumn leaves (bezier-curve shapes) ────
      for (let i = leaves.length - 1; i >= 0; i--) {
        const lf = leaves[i];
        lf.wobble += 0.020;
        lf.x  += lf.vx + Math.sin(lf.wobble) * 0.7;
        lf.y  += lf.vy;
        lf.rotation += lf.rotationSpeed;
        lf.opacity += lf.opacityDelta;
        if (lf.opacity >= lf.opacityMax) lf.opacityDelta = -Math.abs(lf.opacityDelta);
        if (lf.opacity < 0 || lf.y > h + 60) {
          leaves[i] = createLeaf(w, h); // respawn from top
          continue;
        }
        const op  = Math.max(0, lf.opacity);
        const sw  = lf.sizeW;
        const sh  = lf.sizeH;

        ctx.save();
        ctx.translate(lf.x, lf.y);
        ctx.rotate(lf.rotation);
        ctx.globalAlpha = op;

        // Leaf silhouette — pointed ovate shape via bezier curves
        ctx.fillStyle = lf.color + op.toFixed(2) + ')';
        ctx.beginPath();
        ctx.moveTo(0, -sh * 1.25);                              // pointed tip
        ctx.bezierCurveTo( sw * 0.9, -sh * 0.5, sw, sh * 0.55, 0, sh * 0.95);
        ctx.bezierCurveTo(-sw, sh * 0.55, -sw * 0.9, -sh * 0.5, 0, -sh * 1.25);
        ctx.fill();

        // Central midrib
        const veinOp = Math.max(0, op - 0.18);
        ctx.strokeStyle = lf.color + veinOp.toFixed(2) + ')';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -sh);
        ctx.quadraticCurveTo(sw * 0.12, 0, 0, sh * 0.85);
        ctx.stroke();

        // Two lateral veins
        ctx.lineWidth = 0.4;
        const latOp = Math.max(0, op - 0.28);
        ctx.strokeStyle = lf.color + latOp.toFixed(2) + ')';
        ctx.beginPath();
        ctx.moveTo(0, -sh * 0.3);
        ctx.quadraticCurveTo(sw * 0.55, -sh * 0.1, sw * 0.75, sh * 0.2);
        ctx.moveTo(0, -sh * 0.3);
        ctx.quadraticCurveTo(-sw * 0.55, -sh * 0.1, -sw * 0.75, sh * 0.2);
        ctx.stroke();

        ctx.restore();
      }

      // ── 9. Lightning flash overlay ────────────────
      if (lightningAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = lightningAlpha;
        ctx.fillStyle = '#cdd8ff';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
        lightningAlpha *= 0.80;
        if (lightningAlpha < 0.004) lightningAlpha = 0;
      }

      // ── 10. Subtle scanlines ──────────────────────
      ctx.save();
      ctx.globalAlpha = 0.018;
      ctx.fillStyle = '#000';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }
      ctx.restore();
    };

    draw();

    return () => {
      animating = false;
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
});

export default NoirBackground;
