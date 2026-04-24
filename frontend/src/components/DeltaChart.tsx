import { useEffect, useRef } from 'react';
import {
  createChart, CandlestickSeries, LineSeries,
  type IChartApi, type ISeriesApi, type CandlestickData, type LineData, type Time,
} from 'lightweight-charts';
import type { Candle } from '../lib/api';

interface DeltaChartProps {
  candles: Candle[];
  height?: number;
}

// Lightweight EMA — small duplicate of backend so the chart is self-contained.
function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

function bollinger(values: number[], period = 20, mult = 2) {
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const middle: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period);
    upper[i] = mean + mult * std;
    middle[i] = mean;
    lower[i] = mean - mult * std;
  }
  return { upper, middle, lower };
}

const DB_150 = '#18191E';
const DIVIDER = 'rgba(255,255,255,0.08)';
const POSITIVE = '#00A876';
const NEGATIVE = '#EB5454';
const EMA20_COLOR = '#FE8935';  // orange-400 (brand India accent)
const EMA50_COLOR = '#3895ED';  // blue-400
const EMA200_COLOR = '#9276FF'; // purple-400
const BB_COLOR = 'rgba(142,146,152,0.5)';

export default function DeltaChart({ candles, height = 320 }: DeltaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ema20Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ema200Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: DB_150 },
        textColor: '#8E9298',
        fontFamily: "'Space Mono','JetBrains Mono',ui-monospace,monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: DIVIDER },
        horzLines: { color: DIVIDER },
      },
      crosshair: {
        vertLine: { color: 'rgba(142,146,152,0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(142,146,152,0.3)', width: 1, style: 2 },
      },
      rightPriceScale: { borderColor: DIVIDER },
      timeScale: { borderColor: DIVIDER, timeVisible: true, secondsVisible: false },
      handleScroll: { vertTouchDrag: false },
    });

    candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: POSITIVE,
      downColor: NEGATIVE,
      wickUpColor: POSITIVE,
      wickDownColor: NEGATIVE,
      borderVisible: false,
    });

    bbUpperRef.current = chart.addSeries(LineSeries, {
      color: BB_COLOR, lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false,
    });
    bbLowerRef.current = chart.addSeries(LineSeries, {
      color: BB_COLOR, lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false,
    });
    ema20Ref.current = chart.addSeries(LineSeries, {
      color: EMA20_COLOR, lineWidth: 2, priceLineVisible: false, lastValueVisible: false, title: 'EMA20',
    });
    ema50Ref.current = chart.addSeries(LineSeries, {
      color: EMA50_COLOR, lineWidth: 2, priceLineVisible: false, lastValueVisible: false, title: 'EMA50',
    });
    ema200Ref.current = chart.addSeries(LineSeries, {
      color: EMA200_COLOR, lineWidth: 2, priceLineVisible: false, lastValueVisible: false, title: 'EMA200',
    });

    chartRef.current = chart;

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height: h } = entry.contentRect;
        chart.applyOptions({ width, height: h });
      }
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, []);

  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;

    const candleData: CandlestickData<Time>[] = candles.map(c => ({
      time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close,
    }));
    candleSeriesRef.current?.setData(candleData);

    const closes = candles.map(c => c.close);
    const ema20 = ema(closes, 20);
    const ema50 = ema(closes, 50);
    const ema200 = ema(closes, 200);
    const bb = bollinger(closes);

    const toLine = (arr: (number | null)[]): LineData<Time>[] =>
      candles
        .map((c, i) => ({ time: c.time as Time, value: arr[i] ?? NaN }))
        .filter(d => Number.isFinite(d.value));

    ema20Ref.current?.setData(toLine(ema20));
    ema50Ref.current?.setData(toLine(ema50));
    ema200Ref.current?.setData(toLine(ema200));
    bbUpperRef.current?.setData(toLine(bb.upper));
    bbLowerRef.current?.setData(toLine(bb.lower));

    chartRef.current.timeScale().scrollToRealTime();
  }, [candles]);

  return <div ref={containerRef} style={{ height }} className="w-full" />;
}
