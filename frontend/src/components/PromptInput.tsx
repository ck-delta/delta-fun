import { useState, type KeyboardEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useAnalysis } from '../hooks/useAnalysis';
import { useTradingContext } from '../context/TradingContext';

const EXAMPLE_PROMPTS = [
  'Predict next 15-minute direction based on EMA movements',
  'What color will the next candle be based on the last 5 candles?',
  'Is BTC oversold or overbought right now?',
  'Should I buy or sell based on current RSI and EMA crossover?',
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

      {/* Example prompts */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {EXAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => setPrompt(p)}
            className="text-[10px] px-2 py-1 rounded bg-[#1f2937] text-[#9ca3af] hover:bg-[#374151] hover:text-white transition-colors border border-[#374151] leading-tight"
          >
            {p.length > 35 ? p.slice(0, 35) + '…' : p}
          </button>
        ))}
      </div>

      <div className="relative">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about BTC/USD... (⌘+Enter to submit)"
          rows={3}
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
