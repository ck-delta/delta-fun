import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfitEntry {
  id: number;
  amount: number;
}

let addProfitFn: ((amount: number) => void) | null = null;

export function showProfitPopup(amount: number) {
  addProfitFn?.(amount);
}

export default function ProfitPopup() {
  const [entries, setEntries] = useState<ProfitEntry[]>([]);

  const addEntry = useCallback((amount: number) => {
    const id = Date.now() + Math.random();
    setEntries(prev => [...prev, { id, amount }]);
    setTimeout(() => {
      setEntries(prev => prev.filter(e => e.id !== id));
    }, 1500);
  }, []);

  useEffect(() => {
    addProfitFn = addEntry;
    return () => { addProfitFn = null; };
  }, [addEntry]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <AnimatePresence>
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -60, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute text-2xl font-bold font-mono text-accent-green text-glow-green"
          >
            +${Math.abs(entry.amount).toFixed(2)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
