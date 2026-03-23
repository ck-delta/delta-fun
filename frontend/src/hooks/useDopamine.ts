import confetti from 'canvas-confetti';

// CRITICAL IMPROVEMENT: Skip confetti when reduced motion is preferred
const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scale particle counts for low-end devices
const scale = (n: number) => (navigator.hardwareConcurrency < 4 ? Math.round(n / 2) : n);

export function fireBuyConfetti() {
  if (prefersReduced()) return;
  confetti({
    particleCount: scale(80),
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#00ff66', '#f59e0b', '#ffffff', '#00cc55'],
    gravity: 1.2,
  });
}

export function fireProfitConfetti() {
  if (prefersReduced()) return;
  confetti({
    particleCount: scale(40),
    spread: 45,
    origin: { y: 0.6 },
    colors: ['#00ff66', '#00cc55', '#f59e0b'],
  });
}

export function fireCompletionConfetti() {
  if (prefersReduced()) return;
  confetti({
    particleCount: scale(60),
    spread: 70,
    origin: { y: 0.5, x: 0.5 },
    colors: ['#00ff66', '#ffffff', '#a855f7'],
    gravity: 0.8,
  });
}

export function fireLevelUpConfetti() {
  if (prefersReduced()) return;
  confetti({
    particleCount: scale(120),
    spread: 90,
    origin: { y: 0.4, x: 0.5 },
    colors: ['#00ff66', '#f59e0b', '#a855f7', '#ffffff'],
    gravity: 0.6,
    ticks: 300,
  });
}
