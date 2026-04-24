import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';

export default function Toast() {
  const { toast } = useTradingContext();
  if (!toast) return null;

  const tone = {
    success: 'bg-positive-muted border-positive/40 text-positive',
    error:   'bg-negative-muted border-negative/40 text-negative',
    info:    'bg-bg-surface-alt border-divider text-fg-primary',
  }[toast.type];

  const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? XCircle : Info;

  return (
    <div
      key={toast.id}
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 flex items-center gap-sm px-md py-sm rounded-lg border shadow-xl animate-fade-in ${tone}`}
    >
      <Icon size={14} />
      <span className="text-xs font-medium">{toast.message}</span>
    </div>
  );
}
