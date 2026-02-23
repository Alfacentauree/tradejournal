import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { getTradeById, deleteTrade } from '../api/trades';
import { useState, useMemo } from 'react';
import { ArrowLeft, Calendar, Tag, Activity, DollarSign, AlertCircle, MessageSquare, Edit2, Trash2, Camera } from 'lucide-react';
import EditTradeModal from '../components/EditTradeModal';
import StockChart from '../components/StockChart';

const generateChartData = (basePrice: number, timeframe: string = '1D', points: number = 100) => {
  const data = [];
  let currentPrice = basePrice;
  const now = new Date();
  
  // Define interval in minutes based on timeframe
  let intervalMinutes = 1440; // 1D default
  switch (timeframe) {
    case '1H': intervalMinutes = 60; break;
    case '4H': intervalMinutes = 240; break;
    case '1D': intervalMinutes = 1440; break;
    case '1W': intervalMinutes = 10080; break;
    case '1M': intervalMinutes = 43200; break;
  }
  
  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
    // Lightweight charts needs unix timestamp for intra-day or ISO date for daily+
    const timestamp = Math.floor(time.getTime() / 1000);
    
    const volatility = basePrice * 0.02;
    const change = (Math.random() - 0.5) * volatility;
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * (volatility * 0.5);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.5);
    
    data.push({
      time: timestamp as any,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    });
    
    currentPrice = close;
  }
  
  return data;
};

const TradeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [timeframe, setTimeframe] = useState('1D');

  const { data: trade, isLoading, isError } = useQuery({
    queryKey: ['trade', id],
    queryFn: () => getTradeById(id!),
    enabled: !!id,
  });

  const chartData = useMemo(() => {
    if (!trade) return [];
    return generateChartData(trade.entry_price, timeframe, 150);
  }, [trade, timeframe]);

  const deleteMutation = useMutation({
    mutationFn: () => deleteTrade(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      navigate('/journal');
    },
  });

  if (isLoading) return <div className="p-8 text-center">Loading trade details...</div>;
  if (isError || !trade) return <div className="p-8 text-center text-red-500">Trade not found.</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Journal
        </button>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
          >
            <Edit2 size={16} />
            Edit Trade
          </button>
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to delete this trade?')) deleteMutation.mutate();
            }}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
          >
            <Trash2 size={16} />
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Metrics */}
        <div className="lg:w-1/3 space-y-6">
          <div className="bg-slate-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100">{trade.pair}</h2>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${
                  trade.direction === 'Long' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'
                }`}>
                  {trade.direction}
                </span>
              </div>
              <div className={`text-2xl font-black ${trade.pnl! >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trade.pnl ? `${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}` : 'OPEN'}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Entry Price</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">${trade.entry_price}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Exit Price</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{trade.exit_price ? `$${trade.exit_price}` : '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Quantity</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{trade.quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Commission</span>
                <span className="font-bold text-red-400">-${trade.commission || '0.00'}</span>
              </div>
              <div className="pt-4 border-t border-gray-300 dark:border-gray-700 flex justify-between text-base">
                <span className="font-bold text-gray-900 dark:text-gray-100">Net P&L</span>
                <span className={`font-black ${trade.pnl! >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${((trade.pnl || 0) - (trade.commission || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Trade Context</h4>
            <div className="space-y-4">
              <div className="flex items-center text-sm">
                <Calendar size={16} className="text-gray-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">{new Date(trade.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center text-sm">
                <Tag size={16} className="text-gray-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">{trade.setup_name}</span>
              </div>
              <div className="flex items-center text-sm">
                <Activity size={16} className="text-gray-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Emotion: {trade.emotions}</span>
              </div>
              {trade.mistakes && (
                <div className="flex items-start text-sm">
                  <AlertCircle size={16} className="text-orange-500 mr-3 mt-0.5" />
                  <span className="text-orange-600 dark:text-orange-400 font-medium">{trade.mistakes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Chart & Notes */}
        <div className="lg:w-2/3 space-y-6">
          {/* Main Chart */}
          <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700 overflow-hidden">
            <StockChart 
              data={chartData} 
              ticker={trade.pair} 
              height={450} 
              onTimeframeChange={(tf) => setTimeframe(tf)}
              entryPrice={trade.entry_price}
              exitPrice={trade.exit_price}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare size={20} className="text-blue-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Trade Notes</h3>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap text-sm">
                  {trade.notes || "No notes provided for this trade."}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <Camera size={20} className="text-purple-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Screenshot</h3>
              </div>
              {trade.image_url ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-300 dark:border-gray-700 aspect-video group cursor-zoom-in">
                  <img src={trade.image_url} alt="Trade Screenshot" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold px-3 py-1.5 bg-slate-50/20 backdrop-blur-md rounded-lg">View Full Resolution</span>
                  </div>
                </div>
              ) : (
                <div className="h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 space-y-2">
                  <Camera size={24} />
                  <span className="text-xs font-medium">No screenshot uploaded</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <EditTradeModal 
          trade={trade} 
          onClose={() => setIsEditModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default TradeDetail;
