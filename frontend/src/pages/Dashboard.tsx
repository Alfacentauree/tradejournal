import { useQuery } from '@tanstack/react-query';
import { getAllTrades, getStats, getEquityCurve } from '../api/trades';
import { TrendingUp, TrendingDown, Target, Zap, Activity, Trophy, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, 
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

const Dashboard = () => {
  const { data: trades, isLoading: tradesLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: getAllTrades,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  const { data: equityData, isLoading: equityLoading } = useQuery({
    queryKey: ['equityCurve'],
    queryFn: getEquityCurve,
  });

  const sortedTrades = useMemo(() => {
    if (!trades) return [];
    return [...trades].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [trades]);

  const { bestTrade, worstTrade } = useMemo(() => {
    const closed = trades?.filter(t => t.exit_price && t.pnl !== null) || [];
    if (closed.length === 0) return { bestTrade: null, worstTrade: null };
    
    const sortedByPnl = [...closed].sort((a, b) => b.pnl! - a.pnl!);
    return {
      bestTrade: sortedByPnl[0],
      worstTrade: sortedByPnl[sortedByPnl.length - 1]
    };
  }, [trades]);

  const pairDistribution = useMemo(() => {
    if (!trades) return [];
    const counts: Record<string, number> = {};
    trades.forEach(t => {
      counts[t.pair] = (counts[t.pair] || 0) + 1;
    });
    const sorted = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    if (sorted.length > 6) {
      const top5 = sorted.slice(0, 5);
      const othersValue = sorted.slice(5).reduce((acc, curr) => acc + curr.value, 0);
      return [...top5, { name: 'Others', value: othersValue }];
    }
    return sorted;
  }, [trades]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  if (tradesLoading || statsLoading || equityLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const recentTrades = sortedTrades.slice(0, 5);
  const closedTrades = trades?.filter(t => t.exit_price) || [];
  const displayTrades = [...closedTrades]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-20);
  const winCount = closedTrades.filter(t => t.is_win).length;
  const lossCount = closedTrades.length - winCount;

  const getWinRateColor = (rate: number) => {
    if (rate < 40) return '#ef4444'; // Red
    if (rate < 60) return '#f59e0b'; // Orange
    return '#10b981'; // Green
  };

  const winRateColor = getWinRateColor(stats?.win_rate || 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Activity className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <span className="text-[10px] font-medium text-gray-400 uppercase">Net P&L</span>
          </div>
          <div className={`text-xl font-bold ${stats?.total_pnl! >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats?.total_pnl! >= 0 ? '+' : ''}${stats?.total_pnl?.toFixed(2)}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">Total realized profit</p>
        </div>

        <div className="bg-slate-50 dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <div className="p-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Target className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
            <span className="text-[10px] font-medium text-gray-400 uppercase">Win Rate</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="h-16 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { value: stats?.win_rate || 0 },
                      { value: 100 - (stats?.win_rate || 0) }
                    ]}
                    cx="50%"
                    cy="85%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={30}
                    outerRadius={45}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill={winRateColor} />
                    <Cell fill="#e5e7eb" className="dark:fill-gray-700" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div 
                className="absolute top-[35px] left-1/2 -translate-x-1/2 text-lg font-bold"
                style={{ color: winRateColor }}
              >
                {stats?.win_rate?.toFixed(0)}%
              </div>
            </div>
          </div>
          <p className="text-[11px] text-center text-gray-500 mt-1">{stats?.total_trades} Trades</p>
        </div>

        <div className="bg-slate-50 dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <Zap className="text-orange-600 dark:text-orange-400" size={20} />
            </div>
            <span className="text-[10px] font-medium text-gray-400 uppercase">Profit Factor</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats?.profit_factor?.toFixed(2)}</div>
          <p className="text-[11px] text-gray-500 mt-0.5">Ratio Wins/Losses</p>
        </div>

        <div className="bg-slate-50 dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex space-x-1">
              <div className="p-1 bg-green-50 dark:bg-green-900/30 rounded-md">
                <TrendingUp className="text-green-600 dark:text-green-400" size={14} />
              </div>
              <div className="p-1 bg-red-50 dark:bg-red-900/30 rounded-md">
                <TrendingDown className="text-red-600 dark:text-red-400" size={14} />
              </div>
            </div>
            <span className="text-[10px] font-medium text-gray-400 uppercase">Avg W vs L</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-green-500 font-bold text-lg">${stats?.average_win?.toFixed(0)}</span>
            <span className="text-gray-300">/</span>
            <span className="text-red-500 font-bold text-lg">${Math.abs(stats?.average_loss || 0).toFixed(0)}</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">Risk:Reward Profile</p>
        </div>
      </div>

      {/* KPI Cards Row 2 (Best/Worst) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <Trophy className="text-green-600 dark:text-green-400" size={20} />
            </div>
            <span className="text-[10px] font-medium text-gray-400 uppercase">Best Trade</span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-xl font-bold text-green-500">
                {bestTrade ? `+$${bestTrade.pnl?.toFixed(2)}` : 'N/A'}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {bestTrade ? `${bestTrade.pair} (${bestTrade.direction})` : 'No closed trades'}
              </p>
            </div>
            {bestTrade && (
              <Link to={`/trade/${bestTrade.id}`} className="text-[10px] font-bold text-blue-500 hover:underline uppercase">View</Link>
            )}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
            </div>
            <span className="text-[10px] font-medium text-gray-400 uppercase">Worst Trade</span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-xl font-bold text-red-500">
                {worstTrade ? `$${worstTrade.pnl?.toFixed(2)}` : 'N/A'}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {worstTrade ? `${worstTrade.pair} (${worstTrade.direction})` : 'No closed trades'}
              </p>
            </div>
            {worstTrade && (
              <Link to={`/trade/${worstTrade.id}`} className="text-[10px] font-bold text-blue-500 hover:underline uppercase">View</Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Equity Curve Chart */}
        <div className="bg-slate-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-gray-100">Equity Curve (Account Growth)</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  minTickGap={30}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* PnL per Trade Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-gray-100">PnL per Trade</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayTrades} margin={{ bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis 
                  dataKey="pair" 
                  axisLine={false} 
                  tickLine={false} 
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 10 }}
                  height={60}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }}
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {displayTrades.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl! > 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Traded Pairs Pie Chart */}
        <div className="bg-slate-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-gray-100">Most Traded Pairs</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pairDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={0}
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                  stroke="none"
                >
                  {pairDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Recent Trades</h3>
          <Link to="/journal" className="text-blue-500 text-sm font-bold hover:underline bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-all hover:bg-blue-100 dark:hover:bg-blue-900/40">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 dark:bg-gray-900/50 text-gray-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Pair</th>
                <th className="px-6 py-4">Side</th>
                <th className="px-6 py-4">Entry</th>
                <th className="px-6 py-4">Exit</th>
                <th className="px-6 py-4">PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {recentTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-gray-100 dark:hover:bg-gray-900/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">
                    <Link to={`/trade/${trade.id}`} className="hover:text-blue-500 transition-colors">
                      {trade.pair}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                      trade.direction === 'Long' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'
                    }`}>
                      {trade.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">${trade.entry_price}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">${trade.exit_price || '-'}</td>
                  <td className={`px-6 py-4 text-sm font-bold ${trade.pnl! >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.pnl ? `${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
