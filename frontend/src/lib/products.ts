export interface DeltaProduct {
  id: number;
  symbol: string;          // e.g. 'BTCUSD'
  description: string;
  contract_type: string;   // 'perpetual_futures'
  underlying: string;      // 'BTC'
  quoting: string;         // 'USD' | 'USDT'
}

export function displayBase(symbol: string): string {
  // Strip trailing USD/USDT for a short label on the UI.
  return symbol.replace(/USDT?$/, '') || symbol;
}
