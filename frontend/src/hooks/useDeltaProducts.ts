import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { DeltaProduct } from '../lib/products';

export function useDeltaProducts() {
  const [products, setProducts] = useState<DeltaProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getProducts()
      .then(list => {
        if (cancelled) return;
        // Sort: majors first, then alphabetical.
        const majors = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD', 'DOGEUSD'];
        const score = (s: string) => {
          const i = majors.indexOf(s);
          return i === -1 ? 1000 : i;
        };
        list.sort((a, b) => {
          const d = score(a.symbol) - score(b.symbol);
          return d !== 0 ? d : a.symbol.localeCompare(b.symbol);
        });
        setProducts(list);
        setError(null);
      })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { products, loading, error };
}
