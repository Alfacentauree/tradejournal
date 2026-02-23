import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';
import type { ISeriesApi, MouseEventParams } from 'lightweight-charts';
import { Settings, Eye, EyeOff, TrendingUp, BarChart2, Slash, Minus, Trash2, MousePointer2, MoveRight, Hand } from 'lucide-react';

interface ChartPoint {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface DrawnLine {
  id: string;
  type: 'trend' | 'hray' | 'ray';
  points: { time: number | string; price: number }[];
  color: string;
}

interface StockChartProps {
  data: ChartPoint[];
  ticker: string;
  height?: number;
  onTimeframeChange?: (timeframe: string) => void;
  entryPrice?: number;
  exitPrice?: number;
}

const StockChart: React.FC<StockChartProps> = ({ data, ticker, height = 450, onTimeframeChange, entryPrice, exitPrice }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  
  const [currentTimeframe, setCurrentTimeframe] = useState('1D');
  const [showSMA20, setShowSMA20] = useState(true);
  const [showEntryLine, setShowEntryLine] = useState(true);
  
  const [activeTool, setActiveTool] = useState<'trend' | 'hray' | 'ray' | 'move' | null>(null);
  const [drawnLines, setDrawnLines] = useState<DrawnLine[]>([]);
  const [tempPoints, setTempPoints] = useState<{ time: number | string; price: number }[]>([]);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [draggingLineId, setDraggingLineId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ time: number; price: number } | null>(null);

  const timeframes = ['1H', '4H', '1D', '1W', '1M'];

  const calculateSMA = (data: ChartPoint[], period: number) => {
    const smaData = [];
    if (data.length < period) return [];
    for (let i = period; i <= data.length; i++) {
      const slice = data.slice(i - period, i);
      const sum = slice.reduce((acc, val) => acc + val.close, 0);
      smaData.push({ time: data[i - 1].time, value: sum / period });
    }
    return smaData;
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#9ca3af' : '#374151';
    const gridColor = isDark ? '#1f2937' : '#f3f4f6';

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor },
      grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
      width: chartContainerRef.current.clientWidth,
      height,
      timeScale: { borderColor: gridColor, timeVisible: true },
      rightPriceScale: { borderColor: gridColor },
      crosshair: {
        vertLine: { color: isDark ? '#4b5563' : '#d1d5db', width: 0.5, style: LineStyle.Dashed },
        horzLine: { color: isDark ? '#4b5563' : '#d1d5db', width: 0.5, style: LineStyle.Dashed },
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981', downColor: '#ef4444', borderVisible: false,
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });

    candlestickSeries.setData(data as any);

    // Hit testing logic for moving lines
    const findLineAt = (time: number, price: number) => {
      const threshold = chart.priceScale('right').height() * 0.02; // 2% of height as threshold
      return drawnLines.find(line => {
        if (line.type === 'hray') {
          return Math.abs(line.points[0].price - price) < (data[0].close * 0.005) && (typeof line.points[0].time === 'number' ? time >= line.points[0].time : true);
        }
        // Trend line hit test (simplified distance to segment)
        if (line.points.length === 2) {
          const p1 = line.points[0];
          const p2 = line.points[1];
          const t1 = typeof p1.time === 'number' ? p1.time : 0;
          const t2 = typeof p2.time === 'number' ? p2.time : 0;
          if (time < Math.min(t1, t2) || time > Math.max(t1, t2)) return false;
          const expectedPrice = p1.price + (price - p1.price) * ((time - t1) / (t2 - t1)); // rough linear check
          return Math.abs(expectedPrice - price) < (data[0].close * 0.01);
        }
        return false;
      });
    };

    chart.subscribeClick((param: MouseEventParams) => {
      if (!param.point || !param.time) return;
      const price = candlestickSeries.coordinateToPrice(param.point.y);
      if (price === null) return;

      const timeNum = param.time as number;

      if (activeTool === 'move') {
        const line = findLineAt(timeNum, price);
        if (line) {
          setDraggingLineId(line.id);
          setDragStartPos({ time: timeNum, price });
          setIsDragging(true);
        }
        return;
      }

      const newPoint = { time: timeNum, price };
      if (activeTool === 'hray') {
        setDrawnLines(prev => [...prev, { id: Math.random().toString(), type: 'hray', points: [newPoint], color: isDark ? '#60a5fa' : '#2563eb' }]);
        setActiveTool('move');
      } else if (activeTool === 'trend' || activeTool === 'ray') {
        if (tempPoints.length === 0) {
          setTempPoints([newPoint]);
        } else {
          setDrawnLines(prev => [...prev, { id: Math.random().toString(), type: activeTool, points: [tempPoints[0], newPoint], color: isDark ? '#60a5fa' : '#2563eb' }]);
          setTempPoints([]);
          setActiveTool('move');
        }
      }
    });

    // Handle Dragging via Crosshair Move
    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      if (!isDragging || !draggingLineId || !dragStartPos || !param.point || !param.time) return;
      
      const currentPrice = candlestickSeries.coordinateToPrice(param.point.y);
      if (currentPrice === null) return;
      
      const currentTime = param.time as number;
      const priceDelta = currentPrice - dragStartPos.price;
      const timeDelta = currentTime - dragStartPos.time;

      setDrawnLines(prev => prev.map(line => {
        if (line.id !== draggingLineId) return line;
        return {
          ...line,
          points: line.points.map(p => ({
            time: typeof p.time === 'number' ? p.time + timeDelta : p.time,
            price: p.price + priceDelta
          }))
        };
      }));

      setDragStartPos({ time: currentTime, price: currentPrice });
    });

    // End Drag on Mouse Up
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDraggingLineId(null);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);

    // Render Drawn Lines
    drawnLines.forEach(line => {
      const series = chart.addLineSeries({ color: line.color, lineWidth: 2, lineStyle: LineStyle.Solid, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false });
      if (line.type === 'hray') {
        const lineData = data
          .filter(d => (typeof d.time === 'number' && typeof line.points[0].time === 'number' ? d.time >= line.points[0].time : true))
          .map(d => ({ time: d.time, value: line.points[0].price }));
        series.setData(lineData as any);
      } else {
        series.setData(line.points.map(p => ({ time: p.time, value: p.price })) as any);
        if (line.type === 'ray') {
          const lastPoint = data[data.length - 1];
          series.setData([...line.points.map(p => ({ time: p.time, value: p.price })), { time: lastPoint.time, value: line.points[1].price }] as any);
        }
      }
    });

    // Indicators & Markers
    if (entryPrice && data.length > 0) {
      candlestickSeries.setMarkers([{ time: data[Math.floor(data.length * 0.2)].time, position: 'belowBar', color: '#3b82f6', shape: 'arrowUp', text: `Entry @ ${entryPrice}` }]);
      if (showEntryLine) candlestickSeries.createPriceLine({ price: entryPrice, color: '#3b82f6', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'Entry' });
    }

    if (showSMA20 && data.length > 20) {
      const sma20 = chart.addLineSeries({ color: '#3b82f6', lineWidth: 1, title: 'SMA 20', lastValueVisible: false, priceLineVisible: false });
      sma20.setData(calculateSMA(data, 20) as any);
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    return () => { window.removeEventListener('mouseup', handleMouseUp); chart.remove(); };
  }, [data, height, showSMA20, showEntryLine, drawnLines, activeTool, tempPoints, isDragging, draggingLineId]);

  return (
    <div className="flex w-full bg-slate-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700">
      <div className="w-12 flex flex-col items-center py-4 border-r border-gray-300 dark:border-gray-700 bg-gray-100/30 dark:bg-gray-900/30 gap-4">
        <button onClick={() => setActiveTool('move')} title="Move / Select" className={`p-2 rounded-lg transition-colors ${activeTool === 'move' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
          <Hand size={18} />
        </button>
        <div className="w-6 h-[1px] bg-gray-200 dark:bg-gray-700" />
        <button onClick={() => setActiveTool('trend')} title="Trend Line" className={`p-2 rounded-lg transition-colors ${activeTool === 'trend' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
          <Slash size={18} />
        </button>
        <button onClick={() => setActiveTool('hray')} title="Horizontal Ray" className={`p-2 rounded-lg transition-colors ${activeTool === 'hray' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
          <Minus size={18} />
        </button>
        <button onClick={() => setActiveTool('ray')} title="Ray Line" className={`p-2 rounded-lg transition-colors ${activeTool === 'ray' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
          <MoveRight size={18} />
        </button>
        <button onClick={() => setDrawnLines([])} title="Clear All" className="mt-auto p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5"><BarChart2 size={14} className="text-blue-500" /><span className="text-[11px] font-bold uppercase">{ticker}</span></div>
            <div className="flex bg-gray-200/50 dark:bg-gray-800 p-0.5 rounded-lg">
              {timeframes.map(tf => (
                <button key={tf} onClick={() => {setCurrentTimeframe(tf); onTimeframeChange?.(tf)}} className={`px-2 py-1 rounded-md text-[10px] font-bold ${currentTimeframe === tf ? 'bg-slate-50 dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500'}`}>{tf}</button>
              ))}
            </div>
          </div>
          {isDragging && <div className="text-[10px] font-bold text-blue-500 animate-pulse">DRAGGING...</div>}
        </div>
        <div ref={chartContainerRef} className={`w-full relative ${isDragging ? 'cursor-grabbing' : activeTool === 'move' ? 'cursor-grab' : 'cursor-crosshair'}`} />
      </div>
    </div>
  );
};

export default StockChart;
