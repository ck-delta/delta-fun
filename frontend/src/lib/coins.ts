export const COIN_KEYS = ['BTC', 'ETH', 'SOL', 'BNB', 'HYPE'] as const;
export type CoinKey = typeof COIN_KEYS[number];

export interface CoinConfig {
  id: string;          // CoinGecko API coin ID
  symbol: string;
  name: string;
  tvSymbol: string;    // TradingView widget symbol
  geckoNet?: string;   // GeckoTerminal network slug
  geckoPool?: string;  // Pool address
  geckoLabel?: string; // Pair label for chart header
}

export const COINS: Record<CoinKey, CoinConfig> = {
  BTC: {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    tvSymbol: 'BINANCE:BTCUSDT',
    geckoNet: 'eth',
    geckoPool: '0x9db9e0e53058c89e5b94e29621a205198648425b',
    geckoLabel: 'WBTC·USDT · ETH',
  },
  ETH: {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    tvSymbol: 'BINANCE:ETHUSDT',
    geckoNet: 'eth',
    geckoPool: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
    geckoLabel: 'ETH·USDC · ETH',
  },
  SOL: {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    tvSymbol: 'BINANCE:SOLUSDT',
    geckoNet: 'solana',
    geckoPool: '58oQChx4yWmvKqoKj2wFKGsRaVNBxGEFKfHRpkBqS7oX',
    geckoLabel: 'SOL·USDC · Solana',
  },
  BNB: {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    tvSymbol: 'BINANCE:BNBUSDT',
    geckoNet: 'bsc',
    geckoPool: '0x36696169c63e42cd08ce11f5deebbcebae652050',
    geckoLabel: 'BNB·USDT · BSC',
  },
  HYPE: {
    id: 'hyperliquid',
    symbol: 'HYPE',
    name: 'Hyperliquid',
    tvSymbol: 'BYBIT:HYPEUSDT',
    // No reliable GeckoTerminal pool — TradingView only
  },
};

export function geckoUrl(coin: CoinConfig): string | null {
  if (!coin.geckoNet || !coin.geckoPool) return null;
  return `https://www.geckoterminal.com/${coin.geckoNet}/pools/${coin.geckoPool}?embed=1&info=0&swaps=0&light_chart=0&chart_type=price&resolution=15m&bg_color=111827`;
}

export function tvUrl(coin: CoinConfig): string {
  return `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(coin.tvSymbol)}&interval=15&theme=dark&style=1&timezone=Asia%2FCalcutta&hide_side_toolbar=0&allow_symbol_change=0&save_image=0&hidevolume=0`;
}
