import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { ComponentProps } from 'react';

type Props = ComponentProps<typeof motion.button>;

export default function MotionButton({ children, ...props }: Props) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      whileTap={reduced ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
