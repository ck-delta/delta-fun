import confetti from 'canvas-confetti';

export function fireBuyConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#00ff66', '#f59e0b', '#ffffff', '#00cc55'],
    gravity: 1.2,
  });
}

export function fireProfitConfetti() {
  confetti({
    particleCount: 40,
    spread: 45,
    origin: { y: 0.6 },
    colors: ['#00ff66', '#00cc55', '#f59e0b'],
  });
}

export function fireCompletionConfetti() {
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.5, x: 0.5 },
    colors: ['#00ff66', '#ffffff', '#a855f7'],
    gravity: 0.8,
  });
}

export function fireLevelUpConfetti() {
  confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.4, x: 0.5 },
    colors: ['#00ff66', '#f59e0b', '#a855f7', '#ffffff'],
    gravity: 0.6,
    ticks: 300,
  });
}
