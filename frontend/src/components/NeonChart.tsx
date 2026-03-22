import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import { useBinanceKlines, type Interval } from '../hooks/useBinanceKlines';
import type { CoinConfig } from '../lib/coins';

interface NeonChartProps {
  coin: CoinConfig;
  interval: Interval;
  onPriceUpdate?: (price: number) => void;
}

export default function NeonChart({ coin, interval, onPriceUpdate }: NeonChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const { candles, lastPrice } = useBinanceKlines(coin, interval);

  // Notify parent of price updates
  useEffect(() => {
    if (lastPrice !== null && onPriceUpdate) {
      onPriceUpdate(lastPrice);
    }
  }, [lastPrice, onPriceUpdate]);

  // Create chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#050505' },
        textColor: '#888888',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(34,34,34,0.5)' },
        horzLines: { color: 'rgba(34,34,34,0.5)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(136,136,136,0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(136,136,136,0.3)', width: 1, style: 2 },
      },
      timeScale: {
        borderColor: '#222222',
        timeVisible: true,
        secondsVisible: interval === '1s',
      },
      rightPriceScale: {
        borderColor: '#222222',
      },
      handleScroll: { vertTouchDrag: false },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff66',
      downColor: '#ff3366',
      wickUpColor: '#00ff66',
      wickDownColor: '#ff3366',
      borderUpColor: '#00ff66',
      borderDownColor: '#ff3366',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // ResizeObserver for responsive sizing
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [interval]);

  // Update data when candles change + auto-scroll to latest
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || candles.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    seriesRef.current.setData(candles as any);
    // Keep the latest candle visible (auto-scroll right)
    chartRef.current.timeScale().scrollToRealTime();
  }, [candles]);

  return (
    <div
      ref={containerRef}
      id="chart-container"
      className="w-full h-full"
    />
  );
}
