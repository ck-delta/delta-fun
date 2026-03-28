export const COIN_KEYS = ['BTC', 'ETH', 'SOL', 'BNB', 'HYPE', 'GOLD'] as const;
export type CoinKey = typeof COIN_KEYS[number];

export interface CoinConfig {
  id: string;            // CoinGecko API coin ID
  symbol: string;
  name: string;
  binanceSymbol?: string; // lowercase Binance WS symbol (e.g. 'btcusdt')
  tvSymbol: string;       // TradingView symbol (kept for reference)
}

export const COINS: Record<CoinKey, CoinConfig> = {
  BTC: {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    binanceSymbol: 'btcusdt',
    tvSymbol: 'BINANCE:BTCUSDT',
  },
  ETH: {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    binanceSymbol: 'ethusdt',
    tvSymbol: 'BINANCE:ETHUSDT',
  },
  SOL: {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    binanceSymbol: 'solusdt',
    tvSymbol: 'BINANCE:SOLUSDT',
  },
  BNB: {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    binanceSymbol: 'bnbusdt',
    tvSymbol: 'BINANCE:BNBUSDT',
  },
  HYPE: {
    id: 'hyperliquid',
    symbol: 'HYPE',
    name: 'Hyperliquid',
    // No Binance pair — falls back to CoinGecko REST polling
    tvSymbol: 'BYBIT:HYPEUSDT',
  },
  GOLD: {
    id: 'tether-gold',
    symbol: 'GOLD',
    name: 'Gold (XAU)',
    // No Binance pair — falls back to CoinGecko REST polling
    tvSymbol: 'TVC:GOLD',
  },
};
