import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Reply, Trophy, ChevronRight } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';
import { useLongPress } from '../hooks/useLongPress';
import {
  type ChatMessage, type ReplyRef, type LeaderboardEntry,
  REACTION_EMOJIS, formatRelativeTime, getNextLevel,
} from '../lib/chatTypes';

/* ═══════════════════════════════════════════
   Conversation Tabs (horizontal scroll)
   ═══════════════════════════════════════════ */

function ConversationTabs() {
  const { conversations, activeConversationId, setActiveConversation } = useChatContext();
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide bg-paper border-b border-border-subtle flex-shrink-0">
      {conversations.map(c => {
        const isActive = c.id === activeConversationId;
        return (
          <button
            key={c.id}
            onClick={() => setActiveConversation(c.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-heading font-semibold whitespace-nowrap transition-all border flex-shrink-0 ${
              isActive
                ? c.type === 'leaderboard'
                  ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/30'
                  : c.type === 'dm'
                    ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30'
                    : 'bg-accent-purple/10 text-accent-purple border-accent-purple/30'
                : 'text-muted border-transparent hover:text-white'
            }`}
          >
            <span className="text-xs">{c.avatar}</span>
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Profile Bar (XP progress strip)
   ═══════════════════════════════════════════ */

function ProfileBar() {
  const { profile, setShowProfileCard } = useChatContext();
  const next = getNextLevel(profile.level);
  const progressPct = next ? Math.min(100, Math.round((profile.xp / next.xpRequired) * 100)) : 100;

  return (
    <button
      onClick={() => setShowProfileCard(true)}
      className="flex items-center gap-2 px-3 py-1 bg-body border-b border-border-subtle flex-shrink-0 hover:bg-surface transition-colors"
    >
      <span className="text-[10px] text-accent-green font-heading font-bold">Lv.{profile.level}</span>
      <div className="flex-1 h-1 bg-border-strong rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-green rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <span className="text-[9px] text-muted font-mono">{profile.xp} XP</span>
      <ChevronRight size={10} className="text-muted" />
    </button>
  );
}

/* ═══════════════════════════════════════════
   Reaction Picker (5 emojis)
   ═══════════════════════════════════════════ */

function ReactionPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="absolute -top-10 left-0 z-30 flex items-center gap-1 bg-paper border border-border-subtle rounded-full px-2 py-1 shadow-2xl"
    >
      {REACTION_EMOJIS.map(emoji => (
        <button
          key={emoji}
          onClick={() => { onSelect(emoji); onClose(); }}
          className="text-lg hover:scale-125 transition-transform p-0.5"
        >
          {emoji}
        </button>
      ))}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Message Bubble
   ═══════════════════════════════════════════ */

function MessageBubble({ msg, onReply }: { msg: ChatMessage; onReply: (ref: ReplyRef) => void }) {
  const { addReaction } = useChatContext();
  const [showPicker, setShowPicker] = useState(false);

  const longPressHandlers = useLongPress(() => setShowPicker(true), 500);

  const isUser = msg.isUser;
  const reactions = Object.entries(msg.reactions).filter(([, r]) => r.count > 0);

  return (
    <div className={`flex flex-col mb-2 px-3 ${isUser ? 'items-end' : 'items-start'}`}>
      {/* Username + time */}
      <div className={`flex items-center gap-1.5 mb-0.5 ${isUser ? 'flex-row-reverse' : ''}`}>
        <span className={`text-[10px] font-bold font-heading ${isUser ? 'text-accent-green' : 'text-accent-purple'}`}>
          {msg.username}
        </span>
        <span className="text-[8px] text-muted">{formatRelativeTime(msg.timestamp)}</span>
      </div>

      {/* Bubble */}
      <div className="relative max-w-[85%]" {...longPressHandlers}>
        <AnimatePresence>
          {showPicker && (
            <ReactionPicker
              onSelect={(emoji) => addReaction(msg.id, emoji)}
              onClose={() => setShowPicker(false)}
            />
          )}
        </AnimatePresence>

        <div
          className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
            isUser
              ? 'bg-accent-green/15 text-white rounded-br-sm'
              : 'bg-surface text-white rounded-bl-sm'
          }`}
        >
          {/* Reply quote */}
          {msg.replyTo && (
            <div className="mb-1.5 px-2 py-1 border-l-2 border-accent-purple/50 bg-body/50 rounded text-[11px] text-muted">
              <span className="font-semibold text-accent-purple text-[10px]">{msg.replyTo.username}</span>
              <p className="truncate">{msg.replyTo.text}</p>
            </div>
          )}
          {msg.text}
        </div>

        {/* Reply button */}
        <button
          onClick={() => onReply({ id: msg.id, username: msg.username, text: msg.text })}
          className={`absolute top-1 ${isUser ? '-left-6' : '-right-6'} text-muted hover:text-white transition-colors opacity-0 group-hover:opacity-100`}
          style={{ opacity: 0.3 }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
        >
          <Reply size={12} />
        </button>
      </div>

      {/* Reactions row */}
      {reactions.length > 0 && (
        <div className={`flex items-center gap-1 mt-0.5 ${isUser ? 'flex-row-reverse' : ''}`}>
          {reactions.map(([emoji, r]) => (
            <span
              key={emoji}
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                r.userReacted ? 'bg-accent-purple/20 border border-accent-purple/30' : 'bg-surface'
              }`}
            >
              {emoji} {r.count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Leaderboard View (inline, not modal)
   ═══════════════════════════════════════════ */

function LeaderboardView() {
  const { leaderboard, profile } = useChatContext();

  // Insert user at correct position
  const userEntry: LeaderboardEntry = {
    username: profile.username,
    xp: profile.xp,
    level: profile.level,
    title: profile.title,
  };

  const combined = [...leaderboard, userEntry].sort((a, b) => b.xp - a.xp).slice(0, 10);

  const rankEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
        <Trophy size={16} className="text-accent-amber" />
        <span className="text-white font-heading font-bold text-sm">Leaderboard</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2" style={{ touchAction: 'pan-y' }}>
        {combined.map((entry, i) => {
          const isYou = entry.username === '@You';
          return (
            <div
              key={`${entry.username}-${i}`}
              className={`flex items-center gap-3 px-4 py-2.5 ${
                isYou ? 'bg-accent-green/5 border-l-2 border-accent-green' : ''
              }`}
            >
              <span className="text-sm w-6 text-center">
                {i < 3 ? rankEmojis[i] : <span className="text-muted text-xs font-mono">{i + 1}</span>}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-heading font-semibold truncate ${isYou ? 'text-accent-green' : 'text-white'}`}>
                  {entry.username} {isYou && '(You)'}
                </p>
                <p className="text-[10px] text-muted">{entry.title} · Lv.{entry.level}</p>
              </div>
              <span className="text-[11px] font-mono text-accent-amber font-semibold">{entry.xp.toLocaleString()} XP</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Profile Card (modal)
   ═══════════════════════════════════════════ */

function ProfileCardModal() {
  const { profile, quests, showProfileCard, setShowProfileCard } = useChatContext();
  if (!showProfileCard) return null;

  const next = getNextLevel(profile.level);
  const progressPct = next ? Math.min(100, Math.round((profile.xp / next.xpRequired) * 100)) : 100;

  return (
    <div className="absolute inset-0 z-40 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowProfileCard(false)}>
      <div className="bg-paper border border-border-subtle rounded-card p-4 w-full max-w-xs space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="text-white font-heading font-bold text-sm">Your Profile</span>
          <button onClick={() => setShowProfileCard(false)} className="text-muted hover:text-white"><X size={16} /></button>
        </div>

        {/* Level + XP */}
        <div className="text-center">
          <p className="text-2xl font-bold font-heading text-accent-green">Lv.{profile.level}</p>
          <p className="text-xs text-muted font-heading">{profile.title}</p>
          <div className="mt-2 h-2 bg-border-strong rounded-full overflow-hidden">
            <div className="h-full bg-accent-green rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-[10px] text-muted mt-1 font-mono">
            {profile.xp} / {next?.xpRequired ?? '∞'} XP
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-surface rounded-inner p-2">
            <p className="text-white font-mono text-sm font-bold">{profile.messagesSent}</p>
            <p className="text-[9px] text-muted font-heading">Messages</p>
          </div>
          <div className="bg-surface rounded-inner p-2">
            <p className="text-white font-mono text-sm font-bold">{profile.reactionsGiven}</p>
            <p className="text-[9px] text-muted font-heading">Reactions</p>
          </div>
          <div className="bg-surface rounded-inner p-2">
            <p className="text-white font-mono text-sm font-bold">{profile.streakDays}</p>
            <p className="text-[9px] text-muted font-heading">Streak 🔥</p>
          </div>
        </div>

        {/* Daily Quests */}
        <div>
          <p className="text-[10px] text-muted font-heading uppercase tracking-wide mb-1">Daily Quests</p>
          {quests.map(q => (
            <div key={q.id} className="flex items-center gap-2 mb-1">
              <div className="flex-1">
                <p className={`text-[11px] ${q.completed ? 'text-accent-green line-through' : 'text-white'}`}>{q.description}</p>
                <div className="h-1 bg-border-strong rounded-full overflow-hidden mt-0.5">
                  <div
                    className={`h-full rounded-full ${q.completed ? 'bg-accent-green' : 'bg-accent-amber'}`}
                    style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-[9px] text-muted font-mono">{q.progress}/{q.target}</span>
            </div>
          ))}
        </div>

        {/* Achievements count */}
        <p className="text-[10px] text-muted font-heading text-center">
          {profile.achievements.length} / 10 achievements unlocked
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Export: CommunityChat
   ═══════════════════════════════════════════ */

export default function CommunityChat() {
  const { messages, sendMessage, activeConversationId, pendingLevelUp, pendingAchievement, dismissLevelUp, dismissAchievement } = useChatContext();
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyRef | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLeaderboard = activeConversationId === 'leaderboard';

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    sendMessage(inputText, replyTo);
    setInputText('');
    setReplyTo(null);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }, [inputText, replyTo, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Clear reply when switching conversations
  useEffect(() => { setReplyTo(null); }, [activeConversationId]);

  return (
    <div className="flex flex-col h-full bg-body relative">
      <ConversationTabs />
      <ProfileBar />

      {isLeaderboard ? (
        <LeaderboardView />
      ) : (
        <>
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto py-2"
            style={{ touchAction: 'pan-y' }}
          >
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} onReply={setReplyTo} />
            ))}
            {messages.length === 0 && (
              <p className="text-center text-muted text-xs py-8 font-heading">No messages yet. Say something!</p>
            )}
          </div>

          {/* Reply bar */}
          <AnimatePresence>
            {replyTo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-3 py-1.5 bg-surface border-t border-border-subtle flex items-center gap-2 overflow-hidden flex-shrink-0"
              >
                <div className="flex-1 min-w-0 border-l-2 border-accent-purple pl-2">
                  <p className="text-[10px] text-accent-purple font-semibold">{replyTo.username}</p>
                  <p className="text-[11px] text-muted truncate">{replyTo.text}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-muted hover:text-white flex-shrink-0">
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compose bar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-paper border-t border-border-subtle flex-shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Say something..."
              className="flex-1 bg-surface text-white text-[13px] px-3 py-2 rounded-full border border-border-subtle placeholder:text-muted focus:outline-none focus:border-accent-purple/50"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-purple text-white transition-all hover:bg-accent-purple/80 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send size={14} />
            </button>
          </div>
        </>
      )}

      {/* Gamification overlays */}
      <ProfileCardModal />

      {/* Level Up overlay */}
      <AnimatePresence>
        {pendingLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={dismissLevelUp}
          >
            <div className="bg-paper border border-accent-green/40 rounded-card p-6 text-center shadow-glow-green" onClick={e => e.stopPropagation()}>
              <p className="text-4xl mb-2">🎉</p>
              <p className="text-xl font-heading font-bold text-accent-green">Level {pendingLevelUp.level}!</p>
              <p className="text-sm text-muted font-heading mt-1">{pendingLevelUp.title}</p>
              <button onClick={dismissLevelUp} className="mt-4 px-6 py-2 bg-accent-green text-black font-heading font-bold rounded-full text-xs uppercase tracking-wide">
                Nice!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement toast */}
      <AnimatePresence>
        {pendingAchievement && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute top-12 left-3 right-3 z-50 bg-paper border border-accent-amber/40 rounded-inner p-3 flex items-center gap-3 shadow-2xl"
            onClick={dismissAchievement}
          >
            <span className="text-2xl">🏅</span>
            <div className="flex-1">
              <p className="text-xs font-heading font-bold text-accent-amber">{pendingAchievement.name}</p>
              <p className="text-[10px] text-muted">+{pendingAchievement.xpReward} XP</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
