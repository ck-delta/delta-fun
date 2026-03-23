import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Send, Users } from 'lucide-react';
import { fireCompletionConfetti } from '../hooks/useDopamine';

/* ── types ── */

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  upvotes: number;
  downvotes: number;
  isUser: boolean;
}

/* ── constants ── */

const STORAGE_KEY = 'stocky_chat_messages';
const REACTED_KEY = 'stocky_chat_reacted';
const MAX_MESSAGES = 100;

const FAKE_USERNAMES = [
  '@BTCWhale42', '@MoonShotKing', '@DumpIncoming', '@CryptoSniper69',
  '@DiamondHands99', '@PaperHandsPete', '@SatoshiStan', '@BearTrapKing',
  '@LiquidationLarry', '@GreenCandleGuru', '@RedWickRicky', '@HODLQueen',
  '@DegenerateTrader', '@WhaleWatcher', '@FOMOKid',
];

const FAKE_MESSAGES = [
  'BTC about to rip faces off 🔥',
  'double top forming, shorting here',
  'wen lambo',
  'just DCA and chill bro',
  'RSI oversold on 15m, loading up',
  'bears in shambles rn 😂',
  'this pump is fake, be careful',
  'support at 68k looking solid',
  '$100k is not a meme',
  'imagine not being long here lmao',
  'liquidation cascade incoming, watch out',
  'EMA golden cross forming on 4H 👀',
  'just aped in with my rent money',
  'resistance at 70k, selling there',
  'HODLing since 2020, never selling',
  'volume is insane rn, something brewing',
  'stop loss hunting by whales again',
  'this is the dip you buy',
  'bearish divergence on MACD, be warned',
  'next stop: moon 🚀🚀🚀',
];

/* ── helpers ── */

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatRelativeTime(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function generateFakeMessage(minutesAgo = 0): ChatMessage {
  return {
    id: randomId(),
    username: randomPick(FAKE_USERNAMES),
    text: randomPick(FAKE_MESSAGES),
    timestamp: Date.now() - minutesAgo * 60000,
    upvotes: Math.floor(Math.random() * 120),
    downvotes: Math.floor(Math.random() * 15),
    isUser: false,
  };
}

function seedMessages(): ChatMessage[] {
  const gaps = [0, 1, 2, 4, 7, 11, 16, 22, 30, 42, 55, 70];
  return gaps.map(m => generateFakeMessage(m));
}

function loadMessages(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ChatMessage[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return seedMessages();
}

function loadReacted(): Set<string> {
  try {
    const stored = localStorage.getItem(REACTED_KEY);
    if (stored) return new Set(JSON.parse(stored) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

/* ── component ── */

export default function CommunityChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [inputText, setInputText] = useState('');
  const [reactedIds, setReactedIds] = useState<Set<string>>(loadReacted);
  const [onlineCount] = useState(() => 120 + Math.floor(Math.random() * 330));
  const [poppedId, setPoppedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(0, MAX_MESSAGES)));
    } catch { /* ignore */ }
  }, [messages]);

  // Persist reacted
  useEffect(() => {
    try {
      localStorage.setItem(REACTED_KEY, JSON.stringify([...reactedIds]));
    } catch { /* ignore */ }
  }, [reactedIds]);

  // Auto-generate fake messages every 45-60s
  useEffect(() => {
    const delay = 45000 + Math.random() * 15000;
    const interval = setInterval(() => {
      setMessages(prev => [generateFakeMessage(), ...prev].slice(0, MAX_MESSAGES));
    }, delay);
    return () => clearInterval(interval);
  }, []);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: randomId(),
      username: '@You',
      text,
      timestamp: Date.now(),
      upvotes: 0,
      downvotes: 0,
      isUser: true,
    };
    setMessages(prev => [msg, ...prev].slice(0, MAX_MESSAGES));
    setInputText('');
    fireCompletionConfetti();
    // Scroll to top
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }, [inputText]);

  const handleVote = useCallback((id: string, type: 'up' | 'down') => {
    if (reactedIds.has(id)) return;
    setMessages(prev =>
      prev.map(m =>
        m.id === id
          ? { ...m, [type === 'up' ? 'upvotes' : 'downvotes']: (type === 'up' ? m.upvotes : m.downvotes) + 1 }
          : m
      )
    );
    setReactedIds(prev => new Set(prev).add(id));
    setPoppedId(id);
    setTimeout(() => setPoppedId(null), 400);
  }, [reactedIds]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-body">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-paper border-b border-border-subtle flex-shrink-0">
        <span className="text-white font-heading font-bold text-sm tracking-tight">
          Community
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-accent-purple font-heading">
          <Users size={11} />
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
          {onlineCount} online
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-2 space-y-2"
        style={{ touchAction: 'pan-y' }}
      >
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`mx-3 p-3 rounded-inner ${
              msg.isUser
                ? 'bg-surface border border-accent-purple/40'
                : 'bg-surface'
            }`}
            style={msg.isUser ? { boxShadow: '0 0 12px rgba(168, 85, 247, 0.15)' } : undefined}
          >
            {/* Username + time */}
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[11px] font-bold font-heading ${msg.isUser ? 'text-accent-purple' : 'text-accent-green'}`}>
                {msg.username}
              </span>
              <span className="text-[9px] text-muted font-heading">
                {formatRelativeTime(msg.timestamp)}
              </span>
            </div>

            {/* Message text */}
            <p className="text-white text-[13px] leading-relaxed mb-2">{msg.text}</p>

            {/* Vote buttons */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => handleVote(msg.id, 'up')}
                disabled={reactedIds.has(msg.id)}
                animate={poppedId === msg.id ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-1 text-[11px] font-mono transition-colors ${
                  reactedIds.has(msg.id)
                    ? 'text-accent-green/50 cursor-default'
                    : 'text-muted hover:text-accent-green'
                }`}
              >
                <ThumbsUp size={12} />
                {msg.upvotes}
              </motion.button>
              <motion.button
                onClick={() => handleVote(msg.id, 'down')}
                disabled={reactedIds.has(msg.id)}
                animate={poppedId === msg.id ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-1 text-[11px] font-mono transition-colors ${
                  reactedIds.has(msg.id)
                    ? 'text-accent-red/50 cursor-default'
                    : 'text-muted hover:text-accent-red'
                }`}
              >
                <ThumbsDown size={12} />
                {msg.downvotes}
              </motion.button>
            </div>
          </div>
        ))}
      </div>

      {/* Compose bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-paper border-t border-border-subtle flex-shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Say something..."
          className="flex-1 bg-surface text-white text-[13px] px-3 py-2 rounded-inner border border-border-subtle placeholder:text-muted focus:outline-none focus:border-accent-purple/50"
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="flex items-center justify-center w-9 h-9 rounded-inner bg-accent-purple text-white transition-all hover:bg-accent-purple/80 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
