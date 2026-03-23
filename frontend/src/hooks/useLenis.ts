import { useEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from './useReducedMotion';

export function useLenis(wrapperRef: React.RefObject<HTMLElement | null>) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number>(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const lenis = new Lenis({
      wrapper: el,
      content: el,
      lerp: reduced ? 1 : 0.1,
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }
    rafRef.current = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafRef.current);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [wrapperRef, reduced]);

  const pause = useCallback(() => lenisRef.current?.stop(), []);
  const resume = useCallback(() => lenisRef.current?.start(), []);

  return { pause, resume };
}
