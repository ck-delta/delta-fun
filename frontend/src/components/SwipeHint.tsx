import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeHintProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function SwipeHint({ visible, onDismiss }: SwipeHintProps) {
  // Auto-dismiss after 2 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, 2000);
    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          onClick={onDismiss}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 lg:hidden"
          role="button"
          aria-label="Swipe hint: drag left or right to change views"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
            className="flex flex-col items-center gap-3"
          >
            {/* Chevrons row */}
            <div
              className="flex items-center gap-6"
              style={{ textShadow: '0 0 15px rgba(255,255,255,0.6), 0 0 30px rgba(255,255,255,0.3)' }}
            >
              <motion.span
                animate={{ x: [-10, 0, -10], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronLeft size={32} className="text-white" />
              </motion.span>

              <motion.span
                className="text-white text-lg font-heading font-bold uppercase tracking-widest"
                animate={{ opacity: [0.5, 1, 0.5], scale: [0.97, 1.05, 0.97] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                Swipe
              </motion.span>

              <motion.span
                animate={{ x: [10, 0, 10], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronRight size={32} className="text-white" />
              </motion.span>
            </div>

            {/* Subtitle */}
            <motion.p
              className="text-white/60 text-xs font-heading tracking-wide"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              Swipe left or right to explore
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const STORAGE_KEY = 'swipeHintSeen';

export function shouldShowSwipeHint(): boolean {
  try {
    return !localStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
}

export function markSwipeHintSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch { /* noop */ }
}
