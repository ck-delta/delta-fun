import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useTradingContext } from './TradingContext';
import {
  type ConversationId, type Conversation, type ChatMessage, type ReplyRef,
  type UserProfile, type DailyQuest, type LeaderboardEntry, type LevelDef,
  DEFAULT_CONVERSATIONS,
  DM_REPLIES_MENTOR, DM_REPLIES_BOT, DM_REPLIES_FRIEND,
  randomId, randomPick, generateFakeMessage, seedConversation, seedDM,
  createDefaultProfile, createDefaultLeaderboard, generateDailyQuests,
  getLevelForXP, ACHIEVEMENTS,
} from '../lib/chatTypes';
import { fireCompletionConfetti } from '../hooks/useDopamine';

/* ── localStorage keys ── */
const MSGS_PREFIX = 'stocky_chat_msgs_';
const PROFILE_KEY = 'stocky_chat_profile';
const QUESTS_KEY = 'stocky_chat_quests';
const QUESTS_DATE_KEY = 'stocky_chat_quests_date';
const LEADERBOARD_KEY = 'stocky_chat_leaderboard';
const OLD_MSGS_KEY = 'stocky_chat_messages';
const OLD_REACTED_KEY = 'stocky_chat_reacted';
const MAX_MSGS = 100;

/* ── helpers ── */
function loadMessages(id: ConversationId): ChatMessage[] {
  try {
    const raw = localStorage.getItem(MSGS_PREFIX + id);
    if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length) return arr; }
  } catch { /* ignore */ }
  // Seed defaults
  if (id.startsWith('dm-')) return seedDM(id);
  if (id === 'leaderboard') return [];
  return seedConversation(id);
}

function saveMessages(id: ConversationId, msgs: ChatMessage[]) {
  try { localStorage.setItem(MSGS_PREFIX + id, JSON.stringify(msgs.slice(0, MAX_MSGS))); } catch { /* ignore */ }
}

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return createDefaultProfile();
}

function saveProfile(p: UserProfile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

function loadQuests(): DailyQuest[] {
  try {
    const dateStr = localStorage.getItem(QUESTS_DATE_KEY);
    const today = new Date().toISOString().slice(0, 10);
    if (dateStr === today) {
      const raw = localStorage.getItem(QUESTS_KEY);
      if (raw) return JSON.parse(raw);
    }
    // New day — reset
    localStorage.setItem(QUESTS_DATE_KEY, today);
  } catch { /* ignore */ }
  return generateDailyQuests();
}

function saveQuests(q: DailyQuest[]) {
  try { localStorage.setItem(QUESTS_KEY, JSON.stringify(q)); } catch { /* ignore */ }
}

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return createDefaultLeaderboard();
}

function saveLeaderboard(lb: LeaderboardEntry[]) {
  try { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(lb)); } catch { /* ignore */ }
}

function migrateOldData() {
  try {
    const old = localStorage.getItem(OLD_MSGS_KEY);
    if (old) {
      localStorage.setItem(MSGS_PREFIX + 'general', old);
      localStorage.removeItem(OLD_MSGS_KEY);
      localStorage.removeItem(OLD_REACTED_KEY);
    }
  } catch { /* ignore */ }
}

function getStreakMultiplier(days: number): number {
  if (days >= 6) return 2;
  if (days >= 3) return 1.5;
  return 1;
}

/* ── Context type ── */
interface ChatContextValue {
  conversations: Conversation[];
  activeConversationId: ConversationId;
  setActiveConversation: (id: ConversationId) => void;
  messages: ChatMessage[];
  sendMessage: (text: string, replyTo?: ReplyRef | null) => void;
  addReaction: (messageId: string, emoji: string) => void;
  profile: UserProfile;
  quests: DailyQuest[];
  leaderboard: LeaderboardEntry[];
  pendingLevelUp: LevelDef | null;
  pendingAchievement: { name: string; icon: string; xpReward: number } | null;
  dismissLevelUp: () => void;
  dismissAchievement: () => void;
  showProfileCard: boolean;
  setShowProfileCard: (v: boolean) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { livePrice } = useTradingContext();

  // ── Migration ──
  useEffect(() => { migrateOldData(); }, []);

  // ── Core state ──
  const [conversations] = useState<Conversation[]>(DEFAULT_CONVERSATIONS);
  const [activeConversationId, setActiveConvoId] = useState<ConversationId>('general');
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(() => {
    const map: Record<string, ChatMessage[]> = {};
    for (const c of DEFAULT_CONVERSATIONS) {
      if (c.type !== 'leaderboard') map[c.id] = loadMessages(c.id);
    }
    return map;
  });
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [quests, setQuests] = useState<DailyQuest[]>(loadQuests);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(loadLeaderboard);
  const [pendingLevelUp, setPendingLevelUp] = useState<LevelDef | null>(null);
  const [pendingAchievement, setPendingAchievement] = useState<{ name: string; icon: string; xpReward: number } | null>(null);
  const [showProfileCard, setShowProfileCard] = useState(false);

  const livePriceRef = useRef(livePrice);
  useEffect(() => { livePriceRef.current = livePrice; }, [livePrice]);

  // ── Active messages ──
  const messages = messagesMap[activeConversationId] ?? [];

  const setActiveConversation = useCallback((id: ConversationId) => {
    setActiveConvoId(id);
  }, []);

  // ── Persist messages on change ──
  useEffect(() => {
    Object.entries(messagesMap).forEach(([id, msgs]) => saveMessages(id, msgs));
  }, [messagesMap]);

  // ── Persist profile ──
  useEffect(() => { saveProfile(profile); }, [profile]);
  useEffect(() => { saveQuests(quests); }, [quests]);
  useEffect(() => { saveLeaderboard(leaderboard); }, [leaderboard]);

  // ── XP + achievement engine ──
  const awardXP = useCallback((amount: number) => {
    setProfile(prev => {
      const mult = getStreakMultiplier(prev.streakDays);
      const xpGain = Math.round(amount * mult);
      const newXP = prev.xp + xpGain;
      const newLevelDef = getLevelForXP(newXP);
      const leveledUp = newLevelDef.level > prev.level;

      if (leveledUp) {
        setPendingLevelUp(newLevelDef);
      }

      const updated: UserProfile = {
        ...prev,
        xp: newXP,
        level: newLevelDef.level,
        title: newLevelDef.title,
      };

      // Check achievements
      for (const a of ACHIEVEMENTS) {
        if (!updated.achievements.includes(a.id) && a.requirement(updated)) {
          updated.achievements = [...updated.achievements, a.id];
          updated.xp += a.xpReward;
          setPendingAchievement({ name: a.name, icon: a.icon, xpReward: a.xpReward });
          break; // one at a time
        }
      }

      return updated;
    });
  }, []);

  // ── Update streak ──
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (profile.lastActiveDate !== today) {
      setProfile(prev => {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const isConsecutive = prev.lastActiveDate === yesterday;
        return {
          ...prev,
          lastActiveDate: today,
          streakDays: isConsecutive ? prev.streakDays + 1 : 1,
        };
      });
    }
  }, [profile.lastActiveDate]);

  // ── Send message ──
  const sendMessage = useCallback((text: string, replyTo?: ReplyRef | null) => {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: randomId(),
      conversationId: activeConversationId,
      username: '@You',
      text: text.trim(),
      timestamp: Date.now(),
      isUser: true,
      replyTo: replyTo ?? null,
      reactions: {},
    };

    setMessagesMap(prev => ({
      ...prev,
      [activeConversationId]: [msg, ...(prev[activeConversationId] ?? [])].slice(0, MAX_MSGS),
    }));

    // XP
    const xp = 5 + Math.floor(Math.random() * 11);
    awardXP(xp);

    // Update profile stats
    setProfile(prev => ({ ...prev, messagesSent: prev.messagesSent + 1 }));

    // Quest progress
    setQuests(prev => prev.map(q => {
      if (q.type === 'messages_sent' && !q.completed) {
        const newProgress = q.progress + 1;
        const completed = newProgress >= q.target;
        if (completed) awardXP(q.xpReward);
        return { ...q, progress: newProgress, completed };
      }
      return q;
    }));

    fireCompletionConfetti();

    // DM auto-reply
    if (activeConversationId.startsWith('dm-')) {
      const convoId = activeConversationId;
      const delay = 30000 + Math.random() * 30000;
      setTimeout(() => {
        const pools: Record<string, readonly string[]> = {
          'dm-mentor': DM_REPLIES_MENTOR,
          'dm-bot': DM_REPLIES_BOT,
          'dm-friend': DM_REPLIES_FRIEND,
        };
        const names: Record<string, string> = {
          'dm-mentor': '🧠 CryptoMentor',
          'dm-bot': '🤖 TradingBot',
          'dm-friend': '👋 MarketFriend',
        };
        const pool = pools[convoId] ?? DM_REPLIES_FRIEND;
        let replyText = randomPick(pool);
        const price = livePriceRef.current;
        if (price) {
          replyText = replyText.replace(/\$PRICE/g, `$${price.toLocaleString()}`).replace(/\$SUPPORT/g, `$${(price * 0.98).toLocaleString()}`);
        }
        const reply: ChatMessage = {
          id: randomId(),
          conversationId: convoId,
          username: names[convoId] ?? 'Unknown',
          text: replyText,
          timestamp: Date.now(),
          isUser: false,
          replyTo: null,
          reactions: {},
        };
        setMessagesMap(prev => ({
          ...prev,
          [convoId]: [reply, ...(prev[convoId] ?? [])].slice(0, MAX_MSGS),
        }));
      }, delay);
    }
  }, [activeConversationId, awardXP]);

  // ── Add reaction ──
  const addReaction = useCallback((messageId: string, emoji: string) => {
    setMessagesMap(prev => {
      const msgs = prev[activeConversationId];
      if (!msgs) return prev;
      return {
        ...prev,
        [activeConversationId]: msgs.map(m => {
          if (m.id !== messageId) return m;
          const existing = m.reactions[emoji] ?? { count: 0, userReacted: false };
          if (existing.userReacted) return m; // already reacted
          return {
            ...m,
            reactions: {
              ...m.reactions,
              [emoji]: { count: existing.count + 1, userReacted: true },
            },
          };
        }),
      };
    });

    awardXP(1);
    setProfile(prev => ({ ...prev, reactionsGiven: prev.reactionsGiven + 1 }));

    // Quest progress
    setQuests(prev => prev.map(q => {
      if (q.type === 'reactions_given' && !q.completed) {
        const newProgress = q.progress + 1;
        const completed = newProgress >= q.target;
        if (completed) awardXP(q.xpReward);
        return { ...q, progress: newProgress, completed };
      }
      return q;
    }));
  }, [activeConversationId, awardXP]);

  // ── Auto-fake messages for groups ──
  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];

    const groups: { id: string; minMs: number; maxMs: number }[] = [
      { id: 'general', minMs: 20000, maxMs: 60000 },
      { id: 'whale-alerts', minMs: 30000, maxMs: 90000 },
      { id: 'meme-vibes', minMs: 25000, maxMs: 70000 },
    ];

    for (const g of groups) {
      const delay = g.minMs + Math.random() * (g.maxMs - g.minMs);
      const interval = setInterval(() => {
        const price = livePriceRef.current;
        const priceStr = price ? `$${price.toLocaleString()}` : undefined;
        const msg = generateFakeMessage(g.id, 0, priceStr);
        setMessagesMap(prev => ({
          ...prev,
          [g.id]: [msg, ...(prev[g.id] ?? [])].slice(0, MAX_MSGS),
        }));
      }, delay);
      intervals.push(interval);
    }

    // Leaderboard shuffle every 5 min
    const lbInterval = setInterval(() => {
      setLeaderboard(prev => {
        const updated = prev.map(e => ({
          ...e,
          xp: e.xp + Math.floor(Math.random() * 50),
        }));
        updated.sort((a, b) => b.xp - a.xp);
        return updated;
      });
    }, 300000);
    intervals.push(lbInterval);

    return () => intervals.forEach(clearInterval);
  }, []);

  const dismissLevelUp = useCallback(() => setPendingLevelUp(null), []);
  const dismissAchievement = useCallback(() => setPendingAchievement(null), []);

  return (
    <ChatContext.Provider value={{
      conversations, activeConversationId, setActiveConversation,
      messages, sendMessage, addReaction,
      profile, quests, leaderboard,
      pendingLevelUp, pendingAchievement,
      dismissLevelUp, dismissAchievement,
      showProfileCard, setShowProfileCard,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be inside ChatProvider');
  return ctx;
}
