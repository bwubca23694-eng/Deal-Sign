import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

const STEPS = [
  { msg: 'Starting server',       detail: 'Render free tier waking up…'      },
  { msg: 'Connecting database',   detail: 'Reaching MongoDB Atlas…'           },
  { msg: 'Loading your deals',    detail: 'Fetching your workspace…'          },
  { msg: 'Almost ready',          detail: 'Preparing your dashboard…'         },
];

// Tiny floating orb — pure CSS animation via inline style
function Orb({ x, y, size, dur, delay, opacity }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`, top: `${y}%`,
      width: size, height: size,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 35%, rgba(15,169,122,.55), rgba(15,169,122,.0))',
      animation: `orbFloat ${dur}s ease-in-out ${delay}s infinite alternate`,
      opacity,
      pointerEvents: 'none',
    }} />
  );
}

const ORBS = [
  { x:8,  y:15, size:120, dur:7,  delay:0,   opacity:.6 },
  { x:80, y:8,  size:80,  dur:9,  delay:1.2, opacity:.4 },
  { x:70, y:75, size:160, dur:11, delay:0.5, opacity:.35},
  { x:2,  y:65, size:90,  dur:8,  delay:2,   opacity:.45},
  { x:45, y:85, size:60,  dur:6,  delay:0.8, opacity:.3 },
  { x:90, y:45, size:110, dur:10, delay:1.8, opacity:.4 },
];

export default function ColdStartLoader({ onReady }) {
  const [stepIdx,   setStepIdx]   = useState(0);
  const [progress,  setProgress]  = useState(0);
  const [fadeStep,  setFadeStep]  = useState(true);
  const [done,      setDone]      = useState(false);
  const timerRef  = useRef(null);
  const pollRef   = useRef(null);

  // Animate progress bar — creeps up naturally, jumps to 100 on server ready
  useEffect(() => {
    const targets = [18, 38, 62, 82];
    timerRef.current = setInterval(() => {
      setProgress(p => {
        const target = targets[stepIdx] ?? 82;
        if (p >= target) return p;
        const step = Math.max(0.4, (target - p) * 0.07);
        return Math.min(p + step, target);
      });
    }, 80);
    return () => clearInterval(timerRef.current);
  }, [stepIdx]);

  // Cycle status messages
  useEffect(() => {
    const t = setInterval(() => {
      setFadeStep(false);
      setTimeout(() => {
        setStepIdx(i => Math.min(i + 1, STEPS.length - 1));
        setFadeStep(true);
      }, 300);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  // Poll server
  useEffect(() => {
    let attempts = 0;
    const poll = async () => {
      try {
        await axios.get(`${API}/health`, { timeout: 8000 });
        clearInterval(timerRef.current);
        setProgress(100);
        setDone(true);
        setTimeout(onReady, 600); // brief pause so user sees 100%
      } catch {
        if (++attempts < 18) pollRef.current = setTimeout(poll, 2000);
        else { setProgress(100); setDone(true); setTimeout(onReady, 400); }
      }
    };
    poll();
    return () => clearTimeout(pollRef.current);
  }, [onReady]);

  const step = STEPS[stepIdx];

  return (
    <div style={styles.wrap}>
      {/* Ambient orbs */}
      {ORBS.map((o, i) => <Orb key={i} {...o} />)}

      {/* Grid overlay */}
      <div style={styles.grid} />

      {/* Card */}
      <div style={styles.card}>
        {/* Logo mark */}
        <div style={styles.logoWrap}>
          <div style={styles.logoRing} />
          <div style={styles.logoMark}>D</div>
        </div>

        <div style={styles.brand}>DealFlow</div>
        <div style={styles.tagline}>Freelancer deal platform</div>

        {/* Progress track */}
        <div style={styles.track}>
          <div style={{ ...styles.fill, width: `${progress}%`, opacity: done ? 1 : 0.9 }} />
          {/* Shimmer on fill */}
          {!done && <div style={{ ...styles.shimmer, left: `${progress - 12}%` }} />}
        </div>

        {/* Status */}
        <div style={{ ...styles.status, opacity: fadeStep ? 1 : 0 }}>
          <span style={styles.dot} />
          <span style={styles.msg}>{done ? 'Ready' : step.msg}</span>
        </div>
        <div style={{ ...styles.detail, opacity: fadeStep ? 1 : 0 }}>
          {done ? 'Taking you in…' : step.detail}
        </div>
      </div>

      {/* Keyframes injected once */}
      <style>{`
        @keyframes orbFloat {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(12px, -18px) scale(1.08); }
        }
        @keyframes ringPulse {
          0%,100% { transform: scale(1);   opacity: .5; }
          50%      { transform: scale(1.18); opacity: .15; }
        }
        @keyframes shimmerSlide {
          0%   { opacity: 0; }
          30%  { opacity: 1; }
          100% { opacity: 0; transform: translateX(60px); }
        }
        @keyframes dotBlink {
          0%,100% { opacity:1; } 50% { opacity:.3; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrap: {
    position: 'fixed', inset: 0,
    background: 'linear-gradient(145deg, #f0fdf8 0%, #f8fffe 40%, #ecfdf5 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, overflow: 'hidden',
  },
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: `linear-gradient(rgba(15,169,122,.06) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(15,169,122,.06) 1px, transparent 1px)`,
    backgroundSize: '40px 40px',
    maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
    WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
  },
  card: {
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '48px 52px 44px',
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: 28,
    border: '1px solid rgba(15,169,122,.18)',
    boxShadow: '0 8px 40px rgba(15,169,122,.10), 0 1px 0 rgba(255,255,255,.9) inset',
    minWidth: 320,
  },
  logoWrap: {
    position: 'relative', width: 72, height: 72,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  logoRing: {
    position: 'absolute', inset: -8,
    borderRadius: '50%',
    border: '2px solid rgba(15,169,122,.3)',
    animation: 'ringPulse 2s ease-in-out infinite',
  },
  logoMark: {
    width: 72, height: 72,
    background: 'linear-gradient(145deg, #0fa97a, #0d8f68)',
    borderRadius: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 32, fontWeight: 800, color: '#fff',
    boxShadow: '0 8px 24px rgba(15,169,122,.35), 0 1px 0 rgba(255,255,255,.25) inset',
    letterSpacing: '-.02em',
  },
  brand: {
    fontSize: 22, fontWeight: 800, color: '#0d1117',
    letterSpacing: '-.04em', marginBottom: 4,
  },
  tagline: {
    fontSize: 12, color: 'rgba(15,169,122,.8)', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 32,
  },
  track: {
    width: '100%', height: 4, borderRadius: 99,
    background: 'rgba(15,169,122,.12)',
    overflow: 'hidden', position: 'relative',
    marginBottom: 20,
  },
  fill: {
    height: '100%', borderRadius: 99,
    background: 'linear-gradient(90deg, #0d8f68, #0fa97a, #14c78e)',
    transition: 'width .35s cubic-bezier(.4,0,.2,1)',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute', top: 0, width: 40, height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.7), transparent)',
    animation: 'shimmerSlide 1.8s ease-in-out infinite',
  },
  status: {
    display: 'flex', alignItems: 'center', gap: 7,
    transition: 'opacity .3s ease',
    marginBottom: 4,
  },
  dot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#0fa97a',
    display: 'inline-block',
    animation: 'dotBlink 1.4s ease-in-out infinite',
    flexShrink: 0,
  },
  msg: {
    fontSize: 14, fontWeight: 700, color: '#0d1117',
  },
  detail: {
    fontSize: 12, color: 'rgba(13,17,23,.45)', fontWeight: 500,
    transition: 'opacity .3s ease',
  },
};