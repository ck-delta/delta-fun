import { useRef, useState, useEffect, type ReactNode } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';

interface SwipePanelsProps {
  panels: ReactNode[];
  activePanel: number;
  onPanelChange: (idx: number) => void;
  onSwipeComplete?: () => void;
}

export default function SwipePanels({ panels, activePanel, onPanelChange, onSwipeComplete }: SwipePanelsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const x = useMotionValue(0);

  // Track container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Sync x position when activePanel changes externally (e.g. tab click)
  useEffect(() => {
    if (containerWidth === 0) return;
    animate(x, -activePanel * containerWidth, {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    });
  }, [activePanel, containerWidth, x]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (containerWidth === 0) return;
    const threshold = containerWidth * 0.2;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    let newPanel = activePanel;
    if (offset < -threshold || velocity < -500) {
      newPanel = Math.min(activePanel + 1, panels.length - 1);
    } else if (offset > threshold || velocity > 500) {
      newPanel = Math.max(activePanel - 1, 0);
    }

    if (newPanel !== activePanel) {
      onSwipeComplete?.();
    }
    onPanelChange(newPanel);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <motion.div
        className="flex h-full"
        style={{ x, width: `${panels.length * 100}%` }}
        drag="x"
        dragConstraints={{
          left: -(panels.length - 1) * containerWidth,
          right: 0,
        }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        dragMomentum={false}
      >
        {panels.map((panel, i) => (
          <div
            key={i}
            className="h-full overflow-y-auto"
            style={{ width: containerWidth || '100%' }}
          >
            {panel}
          </div>
        ))}
      </motion.div>

      {/* Dot indicators — offset above BottomNav */}
      <div className="absolute bottom-16 lg:bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {panels.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-200 ${
              i === activePanel
                ? 'w-4 h-1.5 bg-accent-green shadow-glow-green'
                : 'w-1.5 h-1.5 bg-border-strong'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
