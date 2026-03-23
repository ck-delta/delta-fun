import { Sparkles, ShoppingCart, MessageCircle } from 'lucide-react';

interface BottomNavProps {
  activePanel: number;
  onPanelChange: (idx: number) => void;
}

const TABS = [
  { label: 'Analyze', icon: Sparkles, activeColor: 'text-accent-green', glowColor: 'shadow-glow-green', dotColor: 'bg-accent-green' },
  { label: 'Trade', icon: ShoppingCart, activeColor: 'text-accent-amber', glowColor: '', dotColor: 'bg-accent-amber' },
  { label: 'Chat', icon: MessageCircle, activeColor: 'text-accent-purple', glowColor: 'shadow-glow-purple', dotColor: 'bg-accent-purple' },
] as const;

export default function BottomNav({ activePanel, onPanelChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur-md border-t border-border-subtle flex lg:hidden"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
    >
      {TABS.map((tab, i) => {
        const Icon = tab.icon;
        const isActive = activePanel === i;
        return (
          <button
            key={tab.label}
            onClick={() => onPanelChange(i)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[52px] transition-all ${
              isActive ? tab.activeColor : 'text-muted'
            }`}
          >
            <Icon size={20} />
            <span className="text-[9px] font-heading font-semibold uppercase tracking-wider">
              {tab.label}
            </span>
            {isActive && (
              <span className={`w-1 h-1 rounded-full ${tab.dotColor} animate-pulse`} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
