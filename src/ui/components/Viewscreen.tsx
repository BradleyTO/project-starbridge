import { useEffect, useRef } from 'react';
import type { WorldState } from '../../engine/types';
import { getContact } from '../../engine/state';

interface Star {
  x: number;
  y: number;
  z: number;
}

/** Deterministic PRNG so the starfield is identical between reloads. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeStars(n: number): Star[] {
  const rnd = mulberry32(7140);
  return Array.from({ length: n }, () => ({ x: rnd() * 2 - 1, y: rnd() * 2 - 1, z: rnd() * 0.9 + 0.1 }));
}

/** Original freighter silhouette: boxy spine with cargo pods. */
function drawKestrel(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, t: number, destroyed: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 0.0004) * 0.08 - 0.12); // adrift: slow tumble
  const s = size / 100;
  ctx.scale(s, s);
  ctx.fillStyle = '#8a8f9a';
  ctx.strokeStyle = '#c8ccd4';
  ctx.lineWidth = 2;
  // spine
  ctx.fillRect(-50, -6, 100, 12);
  ctx.strokeRect(-50, -6, 100, 12);
  // cargo pods
  ctx.fillStyle = '#6d7480';
  for (let i = -3; i <= 2; i++) {
    ctx.fillRect(i * 14 - 2, -18, 12, 10);
    ctx.fillRect(i * 14 - 2, 8, 12, 10);
  }
  // bridge module
  ctx.fillStyle = '#a4a9b3';
  ctx.beginPath();
  ctx.moveTo(50, -10);
  ctx.lineTo(66, -4);
  ctx.lineTo(66, 4);
  ctx.lineTo(50, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // engine block
  ctx.fillStyle = '#555b66';
  ctx.fillRect(-64, -12, 14, 24);
  if (!destroyed) {
    // failing reactor: flickering vent plume
    const flick = 0.5 + 0.5 * Math.sin(t * 0.02) * Math.sin(t * 0.0073);
    const g = ctx.createRadialGradient(-70, 0, 0, -70, 0, 30);
    g.addColorStop(0, `rgba(255,170,60,${0.5 + flick * 0.5})`);
    g.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(-70, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    // blinking distress light
    if (Math.floor(t / 600) % 2 === 0) {
      ctx.fillStyle = '#ffdd55';
      ctx.beginPath();
      ctx.arc(66, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Original warship silhouette: angular arrowhead with running lights. */
function drawCruiser(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, t: number, hostile: boolean) {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 100;
  ctx.scale(s, s);
  ctx.fillStyle = '#3a2a33';
  ctx.strokeStyle = hostile ? '#ff6a6a' : '#b88a9a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-60, 0);
  ctx.lineTo(30, -38);
  ctx.lineTo(50, -30);
  ctx.lineTo(20, -8);
  ctx.lineTo(60, 0);
  ctx.lineTo(20, 8);
  ctx.lineTo(50, 30);
  ctx.lineTo(30, 38);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // spine ridge
  ctx.strokeStyle = '#6d4b5a';
  ctx.beginPath();
  ctx.moveTo(-50, 0);
  ctx.lineTo(55, 0);
  ctx.stroke();
  // running lights
  const pulse = 0.5 + 0.5 * Math.sin(t * 0.005);
  ctx.fillStyle = hostile ? `rgba(255,60,60,${0.6 + pulse * 0.4})` : `rgba(255,140,140,${0.4 + pulse * 0.4})`;
  for (const [lx, ly] of [
    [30, -34],
    [30, 34],
    [-56, 0],
  ]) {
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // engine glow
  const g = ctx.createRadialGradient(62, 0, 0, 62, 0, 22);
  g.addColorStop(0, 'rgba(160,120,255,0.9)');
  g.addColorStop(1, 'rgba(160,120,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(62, 0, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function Viewscreen({ state }: { state: WorldState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const stars = makeStars(260);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const frame = (t: number) => {
      const s = stateRef.current;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.fillStyle = '#02040a';
      ctx.fillRect(0, 0, w, h);

      // nebula wash
      const neb = ctx.createRadialGradient(w * 0.75, h * 0.25, 0, w * 0.75, h * 0.25, w * 0.7);
      neb.addColorStop(0, 'rgba(90,40,120,0.35)');
      neb.addColorStop(0.5, 'rgba(30,40,100,0.15)');
      neb.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = neb;
      ctx.fillRect(0, 0, w, h);

      // drifting starfield
      const drift = reduced ? 0 : t * 0.00002;
      for (const st of stars) {
        const x = ((st.x + 1 + drift * st.z * 6) % 2) - 1;
        const px = (x * 0.5 + 0.5) * w;
        const py = (st.y * 0.5 + 0.5) * h;
        const tw = reduced ? 1 : 0.7 + 0.3 * Math.sin(t * 0.002 + st.x * 40);
        ctx.fillStyle = `rgba(220,230,255,${st.z * tw})`;
        ctx.fillRect(px, py, st.z * 2, st.z * 2);
      }

      const k = getContact(s, 'kestrel');
      const c = getContact(s, 'cruiser');
      const bx = (bearing: number) => w / 2 + Math.max(-1, Math.min(1, bearing / 45)) * w * 0.4;

      if (c.visible) {
        const size = Math.max(10, 14 + 150 * Math.pow(1 - Math.min(c.range, 220000) / 220000, 2.2)) * (w / 900);
        drawCruiser(ctx, bx(c.bearing), h * 0.3, size, t, c.disposition === 'hostile');
      }
      if (k.visible) {
        const size = (24 + 150 * (1 - Math.min(k.range, 40000) / 40000)) * (w / 900);
        const kx = bx(k.bearing);
        const ky = h * 0.6;
        if (s.ship.tractor === 'engaged') {
          const g = ctx.createLinearGradient(w / 2, h, kx, ky);
          g.addColorStop(0, 'rgba(120,200,255,0.55)');
          g.addColorStop(1, 'rgba(120,200,255,0.1)');
          ctx.strokeStyle = g;
          ctx.lineWidth = 10 + 4 * Math.sin(t * 0.01);
          ctx.beginPath();
          ctx.moveTo(w / 2, h);
          ctx.lineTo(kx, ky);
          ctx.stroke();
        }
        drawKestrel(ctx, kx, ky, size, reduced ? 0 : t, !!s.flags.kestrelDestroyed);
      }

      if (s.ship.shieldsRaised) {
        ctx.strokeStyle = `rgba(110,220,255,${0.25 + 0.15 * Math.sin(t * 0.004)})`;
        ctx.lineWidth = 6;
        ctx.strokeRect(4, 4, w - 8, h - 8);
      }
      if (s.alert === 'red') {
        ctx.fillStyle = `rgba(255,30,30,${0.05 + 0.05 * Math.sin(t * 0.006)})`;
        ctx.fillRect(0, 0, w, h);
      }

      // reticle
      ctx.strokeStyle = 'rgba(255,179,71,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 14, h / 2);
      ctx.lineTo(w / 2 + 14, h / 2);
      ctx.moveTo(w / 2, h / 2 - 14);
      ctx.lineTo(w / 2, h / 2 + 14);
      ctx.stroke();

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const k = getContact(state, 'kestrel');
  const c = getContact(state, 'cruiser');
  return (
    <section className="viewscreen" aria-label="Forward viewscreen" data-testid="viewscreen">
      <canvas ref={canvasRef} />
      <div className="vs-overlay">
        <span className="vs-tag">FORWARD VIEW</span>
        <span className={`vs-alert alert-${state.alert}`}>{state.alert.toUpperCase()} ALERT</span>
      </div>
      <div className="vs-labels">
        {k.visible && <span>KESTREL · {Math.round(k.range).toLocaleString('en-US')} KM</span>}
        {c.visible && <span className="hostile">{c.name.toUpperCase()} · {Math.round(c.range).toLocaleString('en-US')} KM</span>}
      </div>
    </section>
  );
}
