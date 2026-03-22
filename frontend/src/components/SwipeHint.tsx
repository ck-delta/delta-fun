import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeHintProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function SwipeHint({ visible, onDismiss }: SwipeHintProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={onDismiss}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10, transition: { duration: 0.3 } }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm cursor-pointer"
          style={{ textShadow: '0 0 12px rgba(255,255,255,0.6)' }}
        >
          {/* Left chevron — oscillating */}
          <motion.span
            animate={{ x: [-6, 0, -6], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronLeft size={14} className="text-white" />
          </motion.span>

          {/* Label */}
          <motion.span
            className="text-[11px] font-heading font-semibold text-white uppercase tracking-wider"
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.97, 1.03, 0.97] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            Swipe
          </motion.span>

          {/* Right chevron — oscillating opposite */}
          <motion.span
            animate={{ x: [6, 0, 6], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronRight size={14} className="text-white" />
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

const STORAGE_KEY = 'swipeHintSeen';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export function shouldShowSwipeHint(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return true;
    const ts = Number(stored);
    if (isNaN(ts)) return true;
    return Date.now() - ts > THREE_DAYS_MS;
  } catch {
    return true;
  }
}

export function markSwipeHintSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch { /* noop */ }
}
