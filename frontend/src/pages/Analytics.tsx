import { useQuery } from '@tanstack/react-query';
import { getDailyPnL, getPerformanceByDay, getPerformanceByHour, getDirectionPerformance } from '../api/trades';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Info, TrendingUp, TrendingDown, Trophy, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
import PnLCalendar from '../components/PnLCalendar';

const Analytics = () => {
  const { data: dailyPnL } = useQuery({ queryKey: ['dailyPnL'], queryFn: getDailyPnL });
  const { data: dayStats } = useQuery({ queryKey: ['dayStats'], queryFn: getPerformanceByDay });
  const { data: hourStats } = useQuery({ queryKey: ['hourStats'], queryFn: getPerformanceByHour });
  const { data: directionStats } = useQuery({ queryKey: ['directionStats'], queryFn: getDirectionPerformance });

  const { bestMonth, worstMonth } = useMemo(() => {
    if (!dailyPnL || dailyPnL.length === 0) return { bestMonth: null, worstMonth: null };

    const monthPnL: Record<string, number> = {};
    dailyPnL.forEach(entry => {
      const monthKey = entry.date.substring(0, 7); // YYYY-MM
      monthPnL[monthKey] = (monthPnL[monthKey] || 0) + entry.pnl;
    });

    const sortedMonths = Object.entries(monthPnL).sort((a, b) => b[1] - a[1]);

    const formatMonth = (key: string) => {
      const [year, month] = key.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    return {
      bestMonth: sortedMonths.length > 0 ? { name: formatMonth(sortedMonths[0][0]), pnl: sortedMonths[0][1] } : null,
      worstMonth: sortedMonths.length > 1 ? { name: formatMonth(sortedMonths[sortedMonths.length - 1][0]), pnl: sortedMonths[sortedMonths.length - 1][1] } : null
    };
  }, [dailyPnL]);

  return (
    <div className="space-y-8">
      {/* PnL Calendar Section with Stats Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <PnLCalendar dailyPnL={dailyPnL || []} />
        </div>
        
        <div className="flex flex-col gap-6">
          {/* Best Month Card */}
          <div className="bg-slate-50 dark:bg-gray-800 p-6 rounded-3xl border border-gray-300 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
            <div className="relative z-10">
              <div className="p-3 bg-emerald-500/10 rounded-2xl w-fit mb-4">
                <Trophy className="text-emerald-500" size={24} />
              </div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Peak Performance</h4>
              <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">Best Month</h3>
              {bestMonth ? (
                <>
                  <p className="text-xs font-bold text-gray-500 mb-4">{bestMonth.name}</p>
                  <div className="text-3xl font-black text-emerald-500 tabular-nums">
                    +${bestMonth.pnl.toFixed(2)}
                  </div>
                </>
              ) : (
                <p className="text-xs font-bold text-gray-400 italic">No data yet</p>
              )}
            </div>
          </div>

          {/* Worst Month Card */}
          <div className="bg-slate-50 dark:bg-gray-800 p-6 rounded-3xl border border-gray-300 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />
            <div className="relative z-10">
              <div className="p-3 bg-rose-500/10 rounded-2xl w-fit mb-4">
                <AlertCircle className="text-rose-500" size={24} />
              </div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Learning Curve</h4>
              <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">Worst Month</h3>
              {worstMonth ? (
                <>
                  <p className="text-xs font-bold text-gray-500 mb-4">{worstMonth.name}</p>
                  <div className="text-3xl font-black text-rose-500 tabular-nums">
                    ${worstMonth.pnl.toFixed(2)}
                  </div>
                </>
              ) : (
                <p className="text-xs font-bold text-gray-400 italic">No data yet</p>
              )}
            </div>
          </div>

          {/* Quick Tip Panel */}
          <div className="mt-auto p-6 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-500/20">
            <h4 className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] mb-3">Pro Insight</h4>
            <p className="text-xs font-medium leading-relaxed italic text-blue-50">
              "Consistency is not about never having a bad month, it's about making sure your best months outweigh your worst by a significant margin."
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Day of Week Performance */}
        <div className="bg-slate-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">PnL by Day of Week</h3>
            <Info size={14} className="text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} hide />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {dayStats?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Performance */}
        <div className="bg-slate-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">PnL by Time of Day</h3>
            <Info size={14} className="text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} hide />
                <Tooltip 
                   cursor={{fill: 'transparent'}}
                   contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {hourStats?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Win/Loss Ratio by Direction */}
      <div className="bg-slate-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Long vs Short Performance</h3>
            <Info size={14} className="text-gray-400" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="h-64 md:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={directionStats}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                <XAxis type="number" domain={[0, 100]} unit="%" axisLine={false} tickLine={false} />
                <YAxis dataKey="direction" type="category" axisLine={false} tickLine={false} width={60} />
                <Tooltip 
                   cursor={{fill: 'transparent'}}
                   contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
                <Bar name="Win Rate" dataKey="win_rate" radius={[0, 4, 4, 0]} barSize={30}>
                  {directionStats?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.direction === 'Long' ? '#3b82f6' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4 flex flex-col justify-center">
            {directionStats?.map((stat) => (
              <div key={stat.direction} className="p-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-900/30">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    stat.direction === 'Long' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}>
                    {stat.direction}
                  </span>
                  <span className={`text-sm font-bold ${stat.total_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.total_pnl >= 0 ? '+' : ''}{stat.total_pnl.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Wins</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stat.wins}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Losses</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stat.losses}</p>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${stat.direction === 'Long' ? 'bg-blue-500' : 'bg-orange-500'}`}
                    style={{ width: `${stat.win_rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
