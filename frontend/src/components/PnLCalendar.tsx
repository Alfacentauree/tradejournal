import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown, Target } from 'lucide-react';
import type { DailyPnL } from '../types/trade';

interface PnLCalendarProps {
  dailyPnL: DailyPnL[];
}

const PnLCalendar: React.FC<PnLCalendarProps> = ({ dailyPnL }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthStats = useMemo(() => {
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const entries = dailyPnL.filter(d => d.date.startsWith(monthStr));
    const total = entries.reduce((acc, curr) => acc + curr.pnl, 0);
    const wins = entries.filter(e => e.pnl > 0).length;
    const losses = entries.filter(e => e.pnl < 0).length;
    return { total, wins, losses };
  }, [dailyPnL, year, month]);

  const renderDays = () => {
    const totalDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square bg-gray-100/10 dark:bg-slate-50/[0.02] border border-gray-100 dark:border-white/[0.05]" />
      );
    }

    // Actual days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const entry = dailyPnL.find(e => e.date === dateStr);
      const pnl = entry ? entry.pnl : null;

      let cellStyles = "bg-slate-50 dark:bg-gray-800";
      let pnlStyles = "text-gray-400";
      let dotColor = "bg-transparent";

      if (pnl !== null) {
        if (pnl > 0) {
          cellStyles = "bg-emerald-500/20 dark:bg-emerald-500/30";
          pnlStyles = "text-emerald-700 dark:text-emerald-400 font-black";
          dotColor = "bg-emerald-600";
        } else if (pnl < 0) {
          cellStyles = "bg-rose-500/20 dark:bg-rose-500/30";
          pnlStyles = "text-rose-700 dark:text-rose-400 font-black";
          dotColor = "bg-rose-600";
        }
      }

      days.push(
        <div 
          key={d} 
          className={`relative aspect-square border border-gray-100 dark:border-white/[0.05] p-2 transition-all hover:scale-[1.02] hover:z-10 hover:shadow-lg group cursor-pointer ${cellStyles}`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors">
              {d}
            </span>
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
          </div>
          {pnl !== null && pnl !== 0 && (
            <div className="mt-auto text-center">
              <span className={`text-[10px] sm:text-xs ${pnlStyles}`}>
                {pnl > 0 ? '+' : ''}{pnl.toFixed(0)}
              </span>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-gray-800 rounded-3xl shadow-2xl shadow-blue-500/5 border border-gray-200 dark:border-gray-700/50 overflow-hidden">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <Calendar className="text-blue-500" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
                {monthNames[month]} <span className="text-blue-500">{year}</span>
              </h3>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Performance Journal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow">
              <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-600 mx-1" />
            <button onClick={nextMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow">
              <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Mini Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="flex flex-col bg-slate-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <TrendingUp size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Month P&L</span>
            </div>
            <span className={`text-sm font-black ${monthStats.total >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {monthStats.total >= 0 ? '+' : ''}${monthStats.total.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col bg-slate-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <Target size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Wins</span>
            </div>
            <span className="text-sm font-black text-gray-900 dark:text-gray-100">{monthStats.wins}</span>
          </div>
          <div className="flex flex-col bg-slate-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-rose-500 mb-1">
              <TrendingDown size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Losses</span>
            </div>
            <span className="text-sm font-black text-gray-900 dark:text-gray-100">{monthStats.losses}</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-7 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-[10px] font-black text-gray-400 uppercase tracking-tighter text-center py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-[1px] bg-gray-100 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-inner">
          {renderDays()}
        </div>
      </div>
    </div>
  );
};

export default PnLCalendar;
