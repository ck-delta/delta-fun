import { useMemo, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';
import { useDeltaProducts } from '../hooks/useDeltaProducts';
import { displayBase } from '../lib/products';

export default function AssetSearch() {
  const { selectedSymbol, setSelectedSymbol } = useTradingContext();
  const { products, loading } = useDeltaProducts();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return products.slice(0, 40);
    return products
      .filter(p => p.symbol.includes(q) || p.description?.toUpperCase().includes(q))
      .slice(0, 60);
  }, [products, query]);

  const selected = products.find(p => p.symbol === selectedSymbol);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-sm px-md py-sm rounded-xl bg-bg-primary border border-divider hover:border-brand-border transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-baseline gap-sm min-w-0">
          <span className="text-lg font-bold tracking-tight text-fg-primary">
            {displayBase(selectedSymbol)}
          </span>
          <span className="text-xs text-fg-tertiary font-mono uppercase">{selectedSymbol}</span>
          {selected?.description && (
            <span className="text-xs text-fg-tertiary truncate hidden sm:inline">
              · {selected.description}
            </span>
          )}
        </div>
        <ChevronDown size={16} className={`text-fg-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full mt-2xs z-40 rounded-xl bg-bg-surface-alt border border-divider shadow-2xl animate-fade-in overflow-hidden">
          <div className="flex items-center gap-sm px-md py-sm border-b border-divider bg-bg-primary">
            <Search size={14} className="text-fg-tertiary" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search perps — BTC, ETH, SOL…"
              className="flex-1 bg-transparent outline-none text-sm text-fg-primary placeholder:text-fg-tertiary"
            />
          </div>
          <div className="max-h-[52vh] overflow-y-auto">
            {loading && <div className="px-md py-sm text-xs text-fg-tertiary">Loading Delta perps…</div>}
            {!loading && filtered.length === 0 && (
              <div className="px-md py-sm text-xs text-fg-tertiary">No match.</div>
            )}
            {filtered.map(p => {
              const active = p.symbol === selectedSymbol;
              return (
                <button
                  key={p.id}
                  onClick={() => { setSelectedSymbol(p.symbol); setOpen(false); setQuery(''); }}
                  className={`w-full flex items-center justify-between px-md py-sm text-left transition-colors ${
                    active ? 'bg-brand-muted' : 'hover:bg-bg-primary'
                  }`}
                >
                  <div className="flex items-baseline gap-sm min-w-0">
                    <span className={`text-sm font-semibold ${active ? 'text-brand-text' : 'text-fg-primary'}`}>
                      {displayBase(p.symbol)}
                    </span>
                    <span className="text-[11px] font-mono text-fg-tertiary">{p.symbol}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide text-fg-tertiary truncate pl-sm">
                    Perp
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
