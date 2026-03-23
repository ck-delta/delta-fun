/* ── Chat Data Types & Constants ── */

// ── Conversation ──
export type ConversationId = 'general' | 'whale-alerts' | 'meme-vibes' | 'leaderboard' | string;
export type ConversationType = 'group' | 'dm' | 'leaderboard';

export interface Conversation {
  id: ConversationId;
  name: string;
  type: ConversationType;
  avatar: string;
  unreadCount: number;
  lastMessageTime: number;
}

// ── Messages ──
export interface ReactionData {
  count: number;
  userReacted: boolean;
}

export interface ReplyRef {
  id: string;
  username: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  conversationId: ConversationId;
  username: string;
  text: string;
  timestamp: number;
  isUser: boolean;
  replyTo: ReplyRef | null;
  reactions: Record<string, ReactionData>;
}

// ── Gamification ──
export interface UserProfile {
  username: string;
  xp: number;
  level: number;
  title: string;
  streakDays: number;
  lastActiveDate: string;
  messagesSent: number;
  reactionsGiven: number;
  reactionsReceived: number;
  achievements: string[];
  activeBadge: string | null;
}

export interface LevelDef {
  level: number;
  xpRequired: number;
  title: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: (p: UserProfile) => boolean;
  xpReward: number;
}

export interface DailyQuest {
  id: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  xpReward: number;
  type: 'messages_sent' | 'reactions_given';
}

export interface LeaderboardEntry {
  username: string;
  xp: number;
  level: number;
  title: string;
}

// ── Reaction emojis ──
export const REACTION_EMOJIS = ['👍', '🔥', '💎', '🚀', '😭'] as const;

// ── Levels ──
export const LEVELS: LevelDef[] = [
  { level: 1,  xpRequired: 0,     title: 'Newbie' },
  { level: 2,  xpRequired: 50,    title: 'Lurker' },
  { level: 3,  xpRequired: 150,   title: 'Chatter' },
  { level: 4,  xpRequired: 350,   title: 'Regular' },
  { level: 5,  xpRequired: 700,   title: 'Analyst' },
  { level: 6,  xpRequired: 1200,  title: 'Trader' },
  { level: 7,  xpRequired: 2000,  title: 'Veteran' },
  { level: 8,  xpRequired: 3500,  title: 'Whale' },
  { level: 9,  xpRequired: 6000,  title: 'Legend' },
  { level: 10, xpRequired: 10000, title: 'Diamond Hands' },
];

export function getLevelForXP(xp: number): LevelDef {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(currentLevel: number): LevelDef | null {
  const idx = LEVELS.findIndex(l => l.level === currentLevel);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

// ── Achievements ──
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_msg',   name: 'First Words',      description: 'Send your first message',      icon: 'MessageCircle', requirement: p => p.messagesSent >= 1,    xpReward: 25 },
  { id: 'msg_10',      name: 'Getting Chatty',    description: 'Send 10 messages',             icon: 'MessageSquare', requirement: p => p.messagesSent >= 10,   xpReward: 50 },
  { id: 'msg_50',      name: 'Motormouth',        description: 'Send 50 messages',             icon: 'Megaphone',     requirement: p => p.messagesSent >= 50,   xpReward: 100 },
  { id: 'msg_100',     name: 'Chat Legend',        description: 'Send 100 messages',            icon: 'Crown',         requirement: p => p.messagesSent >= 100,  xpReward: 200 },
  { id: 'react_first', name: 'First Reaction',    description: 'React to a message',           icon: 'ThumbsUp',      requirement: p => p.reactionsGiven >= 1,  xpReward: 25 },
  { id: 'react_50',    name: 'Reaction Machine',  description: 'Give 50 reactions',            icon: 'Zap',           requirement: p => p.reactionsGiven >= 50, xpReward: 100 },
  { id: 'streak_3',    name: 'On a Roll',         description: '3-day chat streak',            icon: 'Flame',         requirement: p => p.streakDays >= 3,      xpReward: 75 },
  { id: 'streak_7',    name: 'Weekly Warrior',    description: '7-day chat streak',            icon: 'Trophy',        requirement: p => p.streakDays >= 7,      xpReward: 150 },
  { id: 'level_5',     name: 'Analyst Rank',      description: 'Reach Level 5',                icon: 'TrendingUp',    requirement: p => p.level >= 5,           xpReward: 100 },
  { id: 'level_10',    name: 'Diamond Hands',     description: 'Reach Level 10',               icon: 'Diamond',       requirement: p => p.level >= 10,          xpReward: 200 },
];

// ── Default conversations ──
export const DEFAULT_CONVERSATIONS: Conversation[] = [
  { id: 'general',      name: 'General',      type: 'group',       avatar: '💬', unreadCount: 0, lastMessageTime: Date.now() },
  { id: 'whale-alerts', name: 'Whale Alerts', type: 'group',       avatar: '🐋', unreadCount: 0, lastMessageTime: Date.now() },
  { id: 'meme-vibes',   name: 'Meme & Vibes', type: 'group',       avatar: '😂', unreadCount: 0, lastMessageTime: Date.now() },
  { id: 'leaderboard',  name: 'Leaderboard',  type: 'leaderboard', avatar: '🏆', unreadCount: 0, lastMessageTime: 0 },
  { id: 'dm-mentor',    name: 'CryptoMentor', type: 'dm',          avatar: '🧠', unreadCount: 0, lastMessageTime: Date.now() - 300000 },
  { id: 'dm-bot',       name: 'TradingBot',   type: 'dm',          avatar: '🤖', unreadCount: 0, lastMessageTime: Date.now() - 600000 },
  { id: 'dm-friend',    name: 'MarketFriend', type: 'dm',          avatar: '👋', unreadCount: 0, lastMessageTime: Date.now() - 900000 },
];

// ── Fake usernames (Indian) ──
export const FAKE_USERNAMES = [
  '@ArjunTrader', '@PriyaCrypto', '@RahulWhale', '@AnanyaGold',
  '@VikramCharts', '@DeepikaDegen', '@KaranHODL', '@NehaMacro',
  '@AmitBull', '@PoojaSignals', '@RohanFOMO', '@MeghaDCA',
  '@SureshGains', '@DivyaMoon', '@ManishATR',
];

// ── Fake message pools ──
export const FAKE_MESSAGES_GENERAL = [
  'Gold holding strong above $2400 💪',
  'BTC consolidating, breakout feels close',
  'Nifty looking bullish post-RBI policy',
  'DXY weakening = metals pump incoming',
  'Fed minutes tomorrow, stay sharp everyone',
  'Silver catching up to gold ratio finally',
  'Anyone watching crude? Brent looking heavy',
  'Support at $68k looking solid for BTC',
  'Gold $2500 target by end of quarter?',
  'Sensex hitting ATH, global risk-on mood',
  'USDINR range tightening, RBI intervention?',
  'Copper demand rising with China stimulus',
  'BTC dominance falling, alts might run',
  'Treasury yields dropping = gold bullish',
  'Natural gas breakout from weekly range',
  'MCX gold near all-time highs, be careful',
  'Dollar index at support, bounce or break?',
  'Accumulating physical gold on every dip',
  'BTC hash rate at ATH, network stronger than ever',
  'Oil inventories data in 2 hours, watch out',
];

export const FAKE_MESSAGES_WHALE = [
  'WHALE ALERT: 500 BTC moved from Binance to cold wallet 🐋',
  'Large BUY order: 2,000 oz Gold at $PRICE spotted on COMEX',
  'WHALE ALERT: 10,000 ETH withdrawn from exchange 🐋',
  'Massive sell wall at $PRICE cleared for BTC — bulls in control',
  'WHALE ALERT: $50M USDT minted on Tron — incoming pump? 🐋',
  'Large Gold futures position opened: 500 contracts long at $PRICE',
  'WHALE ALERT: Unknown wallet accumulated 1,200 BTC today 🐋',
  'Institutional buy: 5,000 oz Silver at $PRICE on London fix',
  'WHALE ALERT: $25M BTC moved to Coinbase — potential sell pressure 🐋',
  'MCX Gold open interest surging — big players loading up',
];

export const FAKE_MESSAGES_MEME = [
  'is this financial advice? asking for a friend 😅',
  'my portfolio looking like a rollercoaster today 🎢',
  'buy the dip they said... which dip exactly? 📉📉📉',
  'wen moon bhai? 🚀',
  'me explaining crypto to my parents: 🤡',
  'charts go up, charts go down, you can\'t explain that',
  'just sold my bottom again, you\'re welcome 🙏',
  'trust the process they said... process of losing money?',
  'the real treasure was the losses we made along the way ❤️',
  'who needs sleep when you have 24/7 crypto markets',
  'my stop loss: exists. Market: and I took that personally',
  'portfolio down 5% but vibes are immaculate ✨',
  'not financial advice but DEFINITELY financial advice',
  'every dip is a buying opportunity if you close your eyes',
  'imagine not being in this trade rn 😂',
];

export const DM_REPLIES_MENTOR = [
  'Good analysis! Have you checked the RSI divergence on 4H?',
  'Be patient, the setup needs confirmation on a higher timeframe',
  'Risk management is key — never risk more than 2% per trade',
  'Gold tends to rally in this macro environment, keep that in mind',
  'I\'d wait for a pullback to the 20 EMA before entering',
  'Volume is the most underrated indicator. Watch it closely.',
  'That\'s a solid entry if your stop is below the support',
  'Remember: the trend is your friend until the bend at the end',
  'Check the correlation between DXY and your gold trade',
  'Smart move! Always trade with the larger trend',
];

export const DM_REPLIES_BOT = [
  '📊 Signal Update: BTC neutral at current levels. Wait for breakout.',
  '⚡ Alert: Gold approaching key resistance zone at $2,450',
  '📈 Trend: 4H chart showing bullish momentum building',
  '🎯 Target: Next resistance at $PRICE, stop below $SUPPORT',
  '📊 Analysis: RSI cooling off from overbought, healthy pullback',
  '⚡ Alert: Volume spike detected on BTC 15m chart',
  '📈 Signal: EMA golden cross forming on daily timeframe',
  '🎯 Update: Support holding well, bias remains bullish',
  '📊 Note: Volatility decreasing — squeeze breakout imminent',
  '⚡ Alert: Large order flow detected at key level',
];

export const DM_REPLIES_FRIEND = [
  'Haha yeah the market is wild today!',
  'I\'m holding, not selling in this dip no way',
  'Bro did you see that candle? Insane 😂',
  'Same here, DCAing every week like clockwork',
  'Let\'s see what happens after the US market opens',
  'I think gold is the move right now tbh',
  'My buddy at a hedge fund says institutions are buying',
  'Taking profits here, been a good run!',
  'Weekend markets are always weird, don\'t overtrade',
  'Charts looking spicy ngl 🌶️',
];

// ── Helpers ──
export function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function formatRelativeTime(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function generateFakeMessage(conversationId: ConversationId, minutesAgo = 0, priceStr?: string): ChatMessage {
  let pool: readonly string[];
  let username: string;

  switch (conversationId) {
    case 'whale-alerts':
      pool = FAKE_MESSAGES_WHALE;
      username = '🐋 WhaleBot';
      break;
    case 'meme-vibes':
      pool = FAKE_MESSAGES_MEME;
      username = randomPick(FAKE_USERNAMES);
      break;
    default:
      pool = FAKE_MESSAGES_GENERAL;
      username = randomPick(FAKE_USERNAMES);
  }

  let text = randomPick(pool);
  if (priceStr) {
    text = text.replace(/\$PRICE/g, priceStr).replace(/\$SUPPORT/g, `$${(parseFloat(priceStr.replace(/[,$]/g, '')) * 0.98).toLocaleString()}`);
  } else {
    text = text.replace(/\$PRICE/g, '$68,500').replace(/\$SUPPORT/g, '$67,100');
  }

  return {
    id: randomId(),
    conversationId,
    username,
    text,
    timestamp: Date.now() - minutesAgo * 60000,
    isUser: false,
    replyTo: null,
    reactions: {},
  };
}

export function seedConversation(conversationId: ConversationId): ChatMessage[] {
  const gaps = [0, 1, 3, 5, 8, 12, 18, 25, 35, 48, 65, 85];
  return gaps.map(m => generateFakeMessage(conversationId, m));
}

export function seedDM(conversationId: string): ChatMessage[] {
  const names: Record<string, string> = {
    'dm-mentor': '🧠 CryptoMentor',
    'dm-bot': '🤖 TradingBot',
    'dm-friend': '👋 MarketFriend',
  };
  const pools: Record<string, readonly string[]> = {
    'dm-mentor': DM_REPLIES_MENTOR,
    'dm-bot': DM_REPLIES_BOT,
    'dm-friend': DM_REPLIES_FRIEND,
  };
  const pool = pools[conversationId] ?? DM_REPLIES_FRIEND;
  const name = names[conversationId] ?? 'Unknown';

  return [5, 15, 40, 90].map(m => ({
    id: randomId(),
    conversationId,
    username: name,
    text: randomPick(pool).replace(/\$PRICE/g, '$68,500').replace(/\$SUPPORT/g, '$67,100'),
    timestamp: Date.now() - m * 60000,
    isUser: false,
    replyTo: null,
    reactions: {},
  }));
}

// ── Default profile ──
export function createDefaultProfile(): UserProfile {
  return {
    username: '@You',
    xp: 0,
    level: 1,
    title: 'Newbie',
    streakDays: 0,
    lastActiveDate: '',
    messagesSent: 0,
    reactionsGiven: 0,
    reactionsReceived: 0,
    achievements: [],
    activeBadge: null,
  };
}

// ── Default leaderboard ──
export function createDefaultLeaderboard(): LeaderboardEntry[] {
  return [
    { username: '@ArjunTrader',  xp: 8500,  level: 9,  title: 'Legend' },
    { username: '@PriyaCrypto',  xp: 6200,  level: 9,  title: 'Legend' },
    { username: '@RahulWhale',   xp: 4800,  level: 8,  title: 'Whale' },
    { username: '@AnanyaGold',   xp: 3200,  level: 7,  title: 'Veteran' },
    { username: '@VikramCharts', xp: 2400,  level: 7,  title: 'Veteran' },
    { username: '@NehaMacro',    xp: 1800,  level: 6,  title: 'Trader' },
    { username: '@AmitBull',     xp: 1100,  level: 5,  title: 'Analyst' },
    { username: '@KaranHODL',    xp: 600,   level: 4,  title: 'Regular' },
    { username: '@MeghaDCA',     xp: 300,   level: 3,  title: 'Chatter' },
    { username: '@RohanFOMO',    xp: 100,   level: 2,  title: 'Lurker' },
  ];
}

// ── Daily quests ──
export function generateDailyQuests(): DailyQuest[] {
  return [
    { id: 'q_msgs',   description: 'Send 5 messages',  target: 5,  progress: 0, completed: false, xpReward: 50, type: 'messages_sent' },
    { id: 'q_reacts', description: 'React 10 times',   target: 10, progress: 0, completed: false, xpReward: 50, type: 'reactions_given' },
  ];
}
