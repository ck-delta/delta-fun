import { useState, type KeyboardEvent } from 'react';
import { Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useAnalysis } from '../hooks/useAnalysis';
import { useTradingContext } from '../context/TradingContext';

const DEFAULT_PROMPTS = [
  'EMA 9 direction — bullish or bearish?',
  'RSI signal — overbought, oversold, or neutral?',
  'Is RSI confirming the current trend direction?',
  'MACD histogram — is momentum accelerating or fading?',
  'How close is price to key support or resistance?',
];

const PROMPT_CATEGORIES = [
  {
    label: 'Momentum',
    color: 'text-accent-blue',
    prompts: [
      'Is RSI confirming the current trend direction?',
      'MACD histogram — is momentum accelerating or fading?',
      'Stochastic oversold + EMA support — long setup?',
    ],
  },
  {
    label: 'Bollinger / Vol',
    color: 'text-accent-amber',
    prompts: [
      'Bollinger squeeze detected — which way will it break?',
      'Price touched BB lower band — mean reversion play?',
      'Is ATR high enough to trade this move?',
    ],
  },
  {
    label: 'EMA Structure',
    color: 'text-accent-purple',
    prompts: [
      'EMA9 crossing EMA21 — is a trend starting?',
      'Price below EMA200 — dead-cat bounce or reversal?',
      'All EMAs aligned bullish — how strong is the trend?',
    ],
  },
  {
    label: 'Levels',
    color: 'text-accent-green',
    prompts: [
      'How close is price to key support or resistance?',
      'Is price holding above or breaking the daily pivot?',
      'Buy at support now — what is the risk/reward?',
      'Day high or low — reversal or continuation expected?',
    ],
  },
  {
    label: 'Combos',
    color: 'text-accent-red',
    prompts: [
      'RSI oversold + MACD bullish cross — strong buy signal?',
      'Signal score is negative — wait for better entry?',
      'Should I buy or sell based on current RSI and EMA crossover?',
    ],
  },
];

export default function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const [showAll, setShowAll] = useState(false);
  const { analyze } = useAnalysis();
  const { isAnalyzing } = useTradingContext();

  const handleSubmit = async () => {
    if (!prompt.trim() || isAnalyzing) return;
    await analyze(prompt);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 border-b border-border-subtle">
      {/* Mobile: 5 default prompts as scrollable pills */}
      {!showAll && (
        <div className="lg:hidden mb-3">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {DEFAULT_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                className="text-[11px] px-2.5 py-1.5 rounded-full bg-surface text-muted hover:bg-surface-hover hover:text-white hover:border-accent-green/30 transition-all border border-border-subtle leading-snug whitespace-nowrap flex-shrink-0"
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center gap-1 text-[10px] text-muted hover:text-white transition-colors mt-2 font-heading"
          >
            Show More <ChevronDown size={10} />
          </button>
        </div>
      )}

      {/* Mobile expanded / Desktop always: full categorized prompts */}
      <div className={showAll ? 'mb-3' : 'hidden lg:block mb-3'}>
        {showAll && (
          <button
            onClick={() => setShowAll(false)}
            className="flex items-center gap-1 text-[10px] text-muted hover:text-white transition-colors mb-2 font-heading lg:hidden"
          >
            Show Less <ChevronUp size={10} />
          </button>
        )}
        <div className="flex flex-col gap-1.5">
          {PROMPT_CATEGORIES.map(cat => (
            <div key={cat.label} className="flex items-start gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wide flex-shrink-0 w-[68px] pt-1 font-heading ${cat.color}`}>
                {cat.label}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {cat.prompts.map(p => (
                  <button
                    key={p}
                    onClick={() => { setPrompt(p); setShowAll(false); }}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-surface text-muted hover:bg-surface-hover hover:text-white hover:border-accent-green/30 transition-all border border-border-subtle leading-snug"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about BTC/USD... (⌘+Enter to submit)"
          rows={2}
          className="w-full bg-paper border border-border-subtle rounded-inner px-4 py-3.5 text-sm text-white placeholder-muted-dim resize-none focus:outline-none focus:border-accent-green focus:shadow-glow-green transition-all pr-12"
        />
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isAnalyzing}
          className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-accent-purple hover:bg-accent-purple/80 hover:shadow-glow-purple disabled:bg-border-strong disabled:cursor-not-allowed transition-all"
        >
          {isAnalyzing ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={14} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
