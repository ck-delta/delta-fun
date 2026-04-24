import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';
import {
  loadTrades, loadClosed, enrichTrades, closeTrade, resetWallet,
  type StoredTrade, type ClosedTrade, type LiveTrade,
} from '../lib/tradesStore';
import { displayBase } from '../lib/products';

export default function PositionsList() {
  const { livePrice, selectedSymbol, tradesVersion, bumpTrades, showToast } = useTradingContext();
  const [openTrades, setOpenTrades] = useState<StoredTrade[]>([]);
  const [closed, setClosed] = useState<ClosedTrade[]>([]);
  const [tab, setTab] = useState<'open' | 'history'>('open');

  useEffect(() => {
    setOpenTrades(loadTrades());
    setClosed(loadClosed());
  }, [tradesVersion]);

  // Build a price map where only the selected symbol has a live price.
  const priceMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (livePrice !== null) map[selectedSymbol] = livePrice;
    return map;
  }, [livePrice, selectedSymbol]);

  const enriched: LiveTrade[] = useMemo(
    () => enrichTrades(openTrades, priceMap),
    [openTrades, priceMap],
  );

  // Auto-close any liquidated positions on the selected symbol.
  useEffect(() => {
    const liquidated = enriched.filter(t => t.symbol === selectedSymbol && t.isLiquidated);
    if (liquidated.length === 0) return;
    for (const t of liquidated) {
      closeTrade(t.id, t.liquidationPrice);
      showToast(`${t.symbol} ${t.side.toUpperCase()} liquidated @ $${t.liquidationPrice.toFixed(2)}`, 'error');
    }
    bumpTrades();
  }, [enriched, selectedSymbol, bumpTrades, showToast]);

  const handleClose = (trade: LiveTrade) => {
    const exit = trade.currentPrice;
    const closed = closeTrade(trade.id, exit);
    if (!closed) return;
    bumpTrades();
    const sign = closed.realizedPnl >= 0 ? '+' : '';
    showToast(
      `Closed ${trade.symbol} ${trade.side.toUpperCase()} · ${sign}$${closed.realizedPnl.toFixed(2)}`,
      closed.realizedPnl >= 0 ? 'success' : 'error',
    );
  };

  const handleReset = () => {
    if (!window.confirm('Reset paper wallet to $10,000 and clear all positions?')) return;
    resetWallet();
    bumpTrades();
    showToast('Paper wallet reset', 'info');
  };

  return (
    <div className="rounded-xl bg-bg-surface-alt border border-divider overflow-hidden">
      <div className="flex items-center justify-between border-b border-divider bg-bg-primary">
        <div className="flex">
          <button
            onClick={() => setTab('open')}
            className={`px-md py-sm text-xs uppercase tracking-wide transition-colors ${
              tab === 'open' ? 'text-brand-text border-b-2 border-brand-border' : 'text-fg-tertiary hover:text-fg-primary'
            }`}
          >
            Open · {enriched.length}
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-md py-sm text-xs uppercase tracking-wide transition-colors ${
              tab === 'history' ? 'text-brand-text border-b-2 border-brand-border' : 'text-fg-tertiary hover:text-fg-primary'
            }`}
          >
            History · {closed.length}
          </button>
        </div>
        <button
          onClick={handleReset}
          className="px-md py-xs text-[11px] text-fg-tertiary hover:text-negative transition-colors"
        >
          Reset wallet
        </button>
      </div>

      {tab === 'open' && (
        enriched.length === 0 ? (
          <div className="p-lg text-sm text-fg-tertiary text-center">No open positions yet. Place a paper trade above.</div>
        ) : (
          <ul>
            {enriched.map(t => {
              const isPos = t.pnl >= 0;
              return (
                <li key={t.id} className="px-md py-sm border-b border-divider last:border-b-0">
                  <div className="flex items-center justify-between gap-sm mb-2xs">
                    <div className="flex items-baseline gap-sm min-w-0">
                      <span className="font-semibold text-fg-primary">{displayBase(t.symbol)}</span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${t.side === 'buy' ? 'text-positive' : 'text-negative'}`}>
                        {t.side === 'buy' ? 'Long' : 'Short'} · {t.leverage}×
                      </span>
                      <span className="text-[10px] text-fg-tertiary font-mono truncate">
                        ${t.margin} margin
                      </span>
                    </div>
                    <button
                      onClick={() => handleClose(t)}
                      className="flex items-center gap-2xs px-sm py-2xs rounded-md text-[11px] text-fg-secondary hover:text-fg-primary hover:bg-bg-primary transition-colors"
                    >
                      <X size={11} /> Close
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-sm text-[11px] font-mono">
                    <div>
                      <div className="text-fg-tertiary text-[10px] uppercase">Entry</div>
                      <div className="text-fg-primary">${t.entryPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-fg-tertiary text-[10px] uppercase">Mark</div>
                      <div className="text-fg-primary">
                        {t.symbol === selectedSymbol
                          ? `$${t.currentPrice.toFixed(2)}`
                          : <span className="text-fg-tertiary">—</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-fg-tertiary text-[10px] uppercase">PnL</div>
                      <div className={isPos ? 'text-positive' : 'text-negative'}>
                        {isPos ? '+' : ''}${t.pnl.toFixed(2)}
                        <span className="ml-2xs text-[10px] opacity-70">
                          ({isPos ? '+' : ''}{t.pnlPct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2xs text-[10px] text-fg-tertiary font-mono">
                    Liq ${t.liquidationPrice.toFixed(2)}
                  </div>
                </li>
              );
            })}
          </ul>
        )
      )}

      {tab === 'history' && (
        closed.length === 0 ? (
          <div className="p-lg text-sm text-fg-tertiary text-center">No closed trades yet.</div>
        ) : (
          <ul className="max-h-[40vh] overflow-y-auto">
            {closed.map(t => {
              const isPos = t.realizedPnl >= 0;
              return (
                <li key={t.id} className="px-md py-sm border-b border-divider last:border-b-0 flex items-center justify-between text-[12px]">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-sm">
                      <span className="font-semibold text-fg-primary">{displayBase(t.symbol)}</span>
                      <span className={`text-[10px] uppercase tracking-wider font-bold ${t.side === 'buy' ? 'text-positive' : 'text-negative'}`}>
                        {t.side === 'buy' ? 'Long' : 'Short'}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-fg-tertiary">
                      ${t.entryPrice.toFixed(2)} → ${t.exitPrice.toFixed(2)} · ${t.margin}
                    </div>
                  </div>
                  <div className={`text-right font-mono ${isPos ? 'text-positive' : 'text-negative'}`}>
                    {isPos ? '+' : ''}${t.realizedPnl.toFixed(2)}
                    <div className="text-[10px] opacity-70">{isPos ? '+' : ''}{t.realizedPnlPct.toFixed(1)}%</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      )}
    </div>
  );
}
