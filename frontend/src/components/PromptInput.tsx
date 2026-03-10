import { useState, type KeyboardEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useAnalysis } from '../hooks/useAnalysis';
import { useTradingContext } from '../context/TradingContext';

const PROMPT_CATEGORIES = [
  {
    label: 'Momentum',
    color: 'text-blue-400',
    prompts: [
      'Is RSI confirming the current trend direction?',
      'MACD histogram — is momentum accelerating or fading?',
      'Stochastic oversold + EMA support — long setup?',
    ],
  },
  {
    label: 'Bollinger / Vol',
    color: 'text-amber-400',
    prompts: [
      'Bollinger squeeze detected — which way will it break?',
      'Price touched BB lower band — mean reversion play?',
      'Is ATR high enough to trade this move?',
    ],
  },
  {
    label: 'EMA Structure',
    color: 'text-purple-400',
    prompts: [
      'EMA9 crossing EMA21 — is a trend starting?',
      'Price below EMA200 — dead-cat bounce or reversal?',
      'All EMAs aligned bullish — how strong is the trend?',
    ],
  },
  {
    label: 'Levels',
    color: 'text-green-400',
    prompts: [
      'How close is price to key support or resistance?',
      'Is price holding above or breaking the daily pivot?',
      'Buy at support now — what is the risk/reward?',
      'Day high or low — reversal or continuation expected?',
    ],
  },
  {
    label: 'Combos',
    color: 'text-rose-400',
    prompts: [
      'RSI oversold + MACD bullish cross — strong buy signal?',
      'Signal score is negative — wait for better entry?',
      'Should I buy or sell based on current RSI and EMA crossover?',
    ],
  },
];

export default function PromptInput() {
  const [prompt, setPrompt] = useState('');
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
    <div className="p-4 border-b border-[#374151]">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-purple-400" />
        <span className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">AI Analysis</span>
      </div>

      {/* Categorized prompts */}
      <div className="flex flex-col gap-1.5 mb-3">
        {PROMPT_CATEGORIES.map(cat => (
          <div key={cat.label} className="flex items-start gap-2">
            <span className={`text-[9px] font-semibold uppercase tracking-wide flex-shrink-0 w-[62px] pt-1 ${cat.color}`}>
              {cat.label}
            </span>
            <div className="flex flex-wrap gap-1">
              {cat.prompts.map(p => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#1f2937] text-[#9ca3af] hover:bg-[#374151] hover:text-white transition-colors border border-[#374151] leading-tight"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="relative">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about BTC/USD... (⌘+Enter to submit)"
          rows={2}
          className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b7280] resize-none focus:outline-none focus:border-purple-500 transition-colors pr-10"
        />
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isAnalyzing}
          className="absolute bottom-2.5 right-2.5 p-1.5 rounded-md bg-purple-600 hover:bg-purple-500 disabled:bg-[#374151] disabled:cursor-not-allowed transition-colors"
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
