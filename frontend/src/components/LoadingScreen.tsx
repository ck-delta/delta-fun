import { useState, useEffect } from 'react';
import { fireCompletionConfetti } from '../hooks/useDopamine';

const LOG_MESSAGES = [
  'LOADING MARKET DATA...',
  'CONNECTING TO COINGECKO...',
  'INITIALIZING CHART ENGINE...',
  'COMPILING TA INDICATORS...',
  'CALIBRATING AI SIGNALS...',
  'SYSTEM ONLINE // ACCESS GRANTED',
];

const STEPS = [
  { target: 12, delay: 400 },
  { target: 31, delay: 900 },
  { target: 31, delay: 1400 },
  { target: 68, delay: 2200 },
  { target: 87, delay: 2700 },
  { target: 100, delay: 3200 },
];

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [displayed, setDisplayed] = useState(0);
  const [logIdx, setLogIdx] = useState(0);
  const [fading, setFading] = useState(false);

  // Drive counter via setInterval (immune to rAF throttling in background tabs)
  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      const elapsed = tick * 50;
      let target = 0;
      let log = 0;
      for (let i = 0; i < STEPS.length; i++) {
        if (elapsed >= STEPS[i].delay) {
          target = STEPS[i].target;
          if (i < LOG_MESSAGES.length) log = i;
        }
      }
      setLogIdx(log);
      setDisplayed(prev => {
        if (prev >= target) return target;
        return Math.min(prev + 2, target);
      });
      tick++;
      if (tick > 200) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Fade out when done + confetti
  useEffect(() => {
    if (displayed >= 100) {
      fireCompletionConfetti();
      const t = setTimeout(() => setFading(true), 400);
      const t2 = setTimeout(onComplete, 1100);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [displayed, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black flex items-center justify-center transition-opacity duration-700 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ cursor: 'wait' }}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div
          className="w-full h-full"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr 1fr',
            gridTemplateRows: '1fr 2fr 1fr',
          }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              style={{
                borderRight: (i + 1) % 3 !== 0 ? '1px solid rgba(227,222,213,0.06)' : undefined,
                borderBottom: i < 6 ? '1px solid rgba(227,222,213,0.06)' : undefined,
              }}
            />
          ))}
        </div>
      </div>

      {/* Corner meta — top left */}
      <div className="absolute top-8 left-8 z-10 flex flex-col gap-1" style={{ fontFamily: "'Inter', sans-serif" }}>
        <span className="text-[#E3DED5] text-xs tracking-tight opacity-90">SYS.ID: STOCKY-FUN</span>
        <span className="text-[#E3DED5] text-xs tracking-tight opacity-30">INITIATING SEQUENCE</span>
      </div>

      {/* Corner meta — top right */}
      <div className="absolute top-8 right-8 z-10">
        <span className="text-[#E3DED5] text-2xl tracking-widest opacity-60">* * *</span>
      </div>

      {/* Center counter + status */}
      <div className="relative z-10 flex flex-col items-center select-none">
        <div className="flex items-start">
          <span
            className="text-[#E3DED5] font-medium leading-none"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(80px, 18vw, 280px)',
              letterSpacing: '-0.05em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {displayed}
          </span>
          <span
            className="text-[#E3DED5] mt-[1.5vw] ml-[0.5vw]"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(20px, 4vw, 64px)',
            }}
          >
            %
          </span>
        </div>
        <p
          className="text-[#E3DED5] opacity-50 tracking-widest uppercase mt-2"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontSize: 'clamp(11px, 1.2vw, 16px)' }}
        >
          {LOG_MESSAGES[logIdx]}
        </p>
      </div>

      {/* Rotating wireframe cube — pure CSS */}
      <div className="absolute z-[5] pointer-events-none" style={{ perspective: '600px' }}>
        <div
          className="relative"
          style={{
            width: 'clamp(100px, 12vw, 180px)',
            height: 'clamp(100px, 12vw, 180px)',
            transformStyle: 'preserve-3d',
            animation: 'spin-cube 8s linear infinite',
          }}
        >
          {/* 6 faces of the cube */}
          {[
            { transform: 'translateZ(calc(clamp(50px, 6vw, 90px)))' },
            { transform: 'rotateY(180deg) translateZ(calc(clamp(50px, 6vw, 90px)))' },
            { transform: 'rotateY(90deg) translateZ(calc(clamp(50px, 6vw, 90px)))' },
            { transform: 'rotateY(-90deg) translateZ(calc(clamp(50px, 6vw, 90px)))' },
            { transform: 'rotateX(90deg) translateZ(calc(clamp(50px, 6vw, 90px)))' },
            { transform: 'rotateX(-90deg) translateZ(calc(clamp(50px, 6vw, 90px)))' },
          ].map((face, i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                ...face,
                border: '1px solid rgba(227,222,213,0.12)',
                background: 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom left — log messages */}
      <div className="absolute bottom-8 left-8 z-10 overflow-hidden h-[1.2em]">
        <div
          className="transition-transform duration-500 ease-out"
          style={{ transform: `translateY(-${logIdx * 1.2}em)` }}
        >
          {LOG_MESSAGES.map((msg, i) => (
            <div
              key={i}
              className="text-[#E3DED5] text-xs opacity-70 leading-[1.2em]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {msg}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom right — volume label */}
      <div
        className="absolute bottom-8 right-8 z-10 text-right"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <span className="text-[#E3DED5] text-xs opacity-50 block">VOL.</span>
        <span className="text-[#E3DED5] text-2xl opacity-80">01</span>
      </div>

      {/* Progress bar — bottom center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-[200px] h-px bg-[rgba(227,222,213,0.08)]">
        <div
          className="h-full bg-[#E3DED5] transition-all duration-700 ease-out"
          style={{ width: `${displayed}%` }}
        />
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes spin-cube {
          0% { transform: rotateX(15deg) rotateY(0deg); }
          100% { transform: rotateX(15deg) rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}
