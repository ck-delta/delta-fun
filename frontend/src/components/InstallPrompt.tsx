import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share } from 'lucide-react';
import { fireBuyConfetti } from '../hooks/useDopamine';

interface InstallPromptProps {
  showPrompt: boolean;
  canInstall: boolean;
  isIOS: boolean;
  onInstall: () => Promise<boolean>;
  onDismiss: () => void;
}

export default function InstallPrompt({ showPrompt, canInstall, isIOS, onInstall, onDismiss }: InstallPromptProps) {
  const handleInstall = async () => {
    const accepted = await onInstall();
    if (accepted) {
      fireBuyConfetti();
    }
  };

  // Only show on mobile/tablet and when relevant
  const shouldShow = showPrompt && (canInstall || isIOS);
  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
        >
          <div className="bg-paper/95 backdrop-blur-lg border border-accent-green/30 rounded-card p-4 shadow-2xl shadow-accent-green/5">
            {/* Close button */}
            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 text-muted hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            {isIOS && !canInstall ? (
              /* iOS Safari — instructional guide */
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-accent-green/10 flex items-center justify-center">
                    <Download size={18} className="text-accent-green" />
                  </div>
                  <div>
                    <p className="text-white font-heading font-bold text-sm">Add to Home Screen</p>
                    <p className="text-muted text-[10px] font-heading">Full-screen trading app</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-[11px] text-white/80">
                    <span className="w-5 h-5 rounded-full bg-accent-green/10 text-accent-green flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                    <span>Tap <Share size={12} className="inline text-accent-blue" /> Share button below</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/80">
                    <span className="w-5 h-5 rounded-full bg-accent-green/10 text-accent-green flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                    <span>Scroll down and tap <strong className="text-white">Add to Home Screen</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/80">
                    <span className="w-5 h-5 rounded-full bg-accent-green/10 text-accent-green flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                    <span>Tap <strong className="text-white">Add</strong> to confirm</span>
                  </div>
                </div>

                <button
                  onClick={onDismiss}
                  className="w-full py-2 text-[11px] text-muted font-heading uppercase tracking-wide hover:text-white transition-colors"
                >
                  Got it
                </button>
              </>
            ) : (
              /* Android/Chrome — native install prompt */
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-accent-green/10 flex items-center justify-center">
                    <Download size={18} className="text-accent-green" />
                  </div>
                  <div>
                    <p className="text-white font-heading font-bold text-sm">Install Stocky Fun</p>
                    <p className="text-muted text-[10px] font-heading">Instant access · Full-screen · Real-time signals</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleInstall}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-accent-green text-black font-heading font-bold text-xs uppercase tracking-wide rounded-inner hover:bg-accent-green/90 transition-colors shadow-glow-green"
                  >
                    <Download size={14} />
                    Install App
                  </button>
                  <button
                    onClick={onDismiss}
                    className="px-4 py-2.5 text-muted text-[11px] font-heading uppercase tracking-wide hover:text-white transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
