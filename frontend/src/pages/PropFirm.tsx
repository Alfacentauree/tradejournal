import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllTrades } from '../api/trades';
import { Target, AlertTriangle, Zap, Clock, ShieldCheck, Calculator, Info, ShieldAlert, Save, RefreshCw } from 'lucide-react';

const PropFirm = () => {
  const { data: trades, isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: getAllTrades,
  });

  // Load settings from localStorage or use defaults
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('propFirmSettings');
    return saved ? JSON.parse(saved) : {
      startingBalance: 100000,
      profitTargetPercent: 8, // Stored as whole number for the form
      maxDrawdownPercent: 10,
      maxDailyLossPercent: 5,
      tp1RR: 1,
      tp2RR: 3,
      partialAllocation: 50,
      tradesToPass: 2,
    };
  });

  const [isEditing, setIsEditing] = useState(false);

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('propFirmSettings', JSON.stringify(settings));
  }, [settings]);

  const targetProfit = settings.startingBalance * (settings.profitTargetPercent / 100);
  const maxDDLimit = settings.startingBalance * (1 - (settings.maxDrawdownPercent / 100));

  const stats = useMemo(() => {
    if (!trades) return { currentBalance: settings.startingBalance, totalPnl: 0, dailyOpen: settings.startingBalance };
    
    const totalPnl = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const currentBalance = settings.startingBalance + totalPnl;
    const dailyOpen = settings.startingBalance; 

    const remainingTarget = Math.max(0, targetProfit - totalPnl);
    const remainingDD = currentBalance - maxDDLimit;
    const remainingDaily = currentBalance - (dailyOpen * (1 - (settings.maxDailyLossPercent / 100)));

    const avgRR = (settings.tp1RR * (settings.partialAllocation / 100)) + (settings.tp2RR * (1 - (settings.partialAllocation / 100)));
    const idealRisk = remainingTarget / (avgRR * settings.tradesToPass);
    const safeRisk = Math.min(idealRisk, remainingDD * 0.25, remainingDaily * 0.8);
    
    let status = { code: '✅ HEALTHY', color: 'text-green-500' };
    if (remainingDD < settings.startingBalance * 0.03) status = { code: '⚠️ WARNING', color: 'text-orange-500' };
    if (currentBalance <= maxDDLimit) status = { code: '❌ FAIL', color: 'text-red-500' };

    return {
      currentBalance,
      totalPnl,
      remainingTarget,
      remainingDD,
      remainingDaily,
      suggestedRisk: safeRisk,
      suggestedRiskPercent: (safeRisk / currentBalance) * 100,
      status,
      avgRR
    };
  }, [trades, settings, targetProfit, maxDDLimit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  if (isLoading) return <div className="p-8 text-center">Loading Prop Firm Tool...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-gray-800 p-6 rounded-3xl border border-gray-300 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <ShieldCheck className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">Golden Bullet Tracker</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Prop Firm Risk Management System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Challenge Status</span>
            <span className={`text-sm font-black uppercase tracking-widest ${stats.status.color}`}>{stats.status.code}</span>
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
              isEditing ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {isEditing ? <Save size={14} /> : <Calculator size={14} />}
            {isEditing ? 'Save Settings' : 'Edit Master Key'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Master Key Form */}
        <div className="space-y-6">
           <div className="bg-slate-50 dark:bg-gray-800 p-6 rounded-3xl border border-gray-300 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2">
                    <Calculator size={18} className="text-blue-500" />
                    <h3 className="font-black text-sm uppercase tracking-wider">Master Key</h3>
                 </div>
                 {isEditing && <span className="text-[10px] font-black text-blue-500 animate-pulse uppercase">Editing Mode</span>}
              </div>
              
              <div className="space-y-5">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block">Starting Account Balance ($)</label>
                    <input 
                      type="number" 
                      name="startingBalance"
                      value={settings.startingBalance} 
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all ${
                        isEditing ? 'bg-slate-50 dark:bg-gray-900 border-2 border-blue-500 ring-4 ring-blue-500/10' : 'bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 opacity-70'
                      }`} 
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block">Profit Target (%)</label>
                       <input 
                         type="number" 
                         name="profitTargetPercent"
                         value={settings.profitTargetPercent} 
                         onChange={handleInputChange}
                         disabled={!isEditing}
                         className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all ${
                            isEditing ? 'bg-slate-50 dark:bg-gray-900 border-2 border-blue-500' : 'bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
                         }`} 
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block">Max Drawdown (%)</label>
                       <input 
                         type="number" 
                         name="maxDrawdownPercent"
                         value={settings.maxDrawdownPercent} 
                         onChange={handleInputChange}
                         disabled={!isEditing}
                         className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all ${
                            isEditing ? 'bg-slate-50 dark:bg-gray-900 border-2 border-blue-500' : 'bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
                         }`} 
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block">Daily Loss (%)</label>
                       <input 
                         type="number" 
                         name="maxDailyLossPercent"
                         value={settings.maxDailyLossPercent} 
                         onChange={handleInputChange}
                         disabled={!isEditing}
                         className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all ${
                            isEditing ? 'bg-slate-50 dark:bg-gray-900 border-2 border-blue-500' : 'bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
                         }`} 
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block">Trades to Pass</label>
                       <input 
                         type="number" 
                         name="tradesToPass"
                         value={settings.tradesToPass} 
                         onChange={handleInputChange}
                         disabled={!isEditing}
                         className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all ${
                            isEditing ? 'bg-slate-50 dark:bg-gray-900 border-2 border-blue-500' : 'bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
                         }`} 
                       />
                    </div>
                 </div>

                 <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-3 block">Risk:Reward Setup (TP1 / TP2)</label>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-2xl border border-blue-200 dark:border-blue-800">
                          <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase block mb-1 text-center">TP1 RR</span>
                          <input type="number" name="tp1RR" value={settings.tp1RR} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-transparent text-center text-sm font-black outline-none" />
                       </div>
                       <div className="bg-purple-50/50 dark:bg-purple-900/10 p-3 rounded-2xl border border-purple-200 dark:border-purple-800">
                          <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase block mb-1 text-center">TP2 RR</span>
                          <input type="number" name="tp2RR" value={settings.tp2RR} onChange={handleInputChange} disabled={!isEditing} className="w-full bg-transparent text-center text-sm font-black outline-none" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Live Metrics & Smart Risk */}
        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-gray-800 p-5 rounded-3xl border border-gray-300 dark:border-gray-700">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Target Remaining</span>
                 <div className="text-xl font-black text-blue-500 tabular-nums">${Math.ceil(stats.remainingTarget).toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800 p-5 rounded-3xl border border-gray-300 dark:border-gray-700">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">DD Bacha Hai</span>
                 <div className="text-xl font-black text-red-500 tabular-nums">${Math.floor(stats.remainingDD).toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800 p-5 rounded-3xl border border-gray-300 dark:border-gray-700">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Daily Buffer</span>
                 <div className="text-xl font-black text-orange-500 tabular-nums">${Math.floor(stats.remainingDaily).toLocaleString()}</div>
              </div>
           </div>

           {/* Recommended Risk Card */}
           <div className="bg-gradient-to-br from-blue-600 to-indigo-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
              <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-6">
                    <div className="p-1.5 bg-slate-50/20 rounded-lg backdrop-blur-sm">
                       <Zap size={18} className="text-blue-200 fill-blue-200" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">Smart Risk Algorithm</h3>
                 </div>
                 
                 <div className="flex flex-col md:flex-row md:items-end gap-10">
                    <div>
                       <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block mb-2">Suggested Next Risk</span>
                       <div className="text-6xl font-black tabular-nums tracking-tighter transition-all group-hover:scale-105 origin-left">
                          ${Math.floor(stats.suggestedRisk).toLocaleString()}
                       </div>
                    </div>
                    <div className="pb-1.5">
                       <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block mb-2">Percentage</span>
                       <div className="text-3xl font-black tabular-nums">{stats.suggestedRiskPercent.toFixed(2)}%</div>
                    </div>
                 </div>

                 <div className="mt-10 p-5 bg-slate-50/5 backdrop-blur-xl rounded-2xl border border-white/10">
                    <div className="flex items-start gap-4">
                       <div className="mt-1 p-1 bg-blue-500/20 rounded-md">
                          <Info size={14} className="text-blue-200" />
                       </div>
                       <p className="text-[11px] font-medium text-blue-100 leading-relaxed">
                          This calculation uses a <b>recovery-weighted formula</b>. It aims to hit your remaining <b>${Math.ceil(stats.remainingTarget).toLocaleString()}</b> target in <b>{settings.tradesToPass}</b> wins, while ensuring you can survive a 4-loss streak within your <b>${Math.floor(stats.remainingDD).toLocaleString()}</b> drawdown limit.
                       </p>
                    </div>
                 </div>
              </div>
              <div className="absolute -right-10 -top-10 w-64 h-64 bg-slate-50/5 rounded-full blur-3xl" />
           </div>

           <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-2xl border border-orange-200 dark:border-orange-800/30 flex items-center gap-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-xl">
                 <ShieldAlert className="text-orange-600 dark:text-orange-500" size={24} />
              </div>
              <div>
                 <p className="text-[11px] font-black text-orange-800 dark:text-orange-400 uppercase tracking-tight mb-0.5">Safety Protocol Active</p>
                 <p className="text-[10px] text-orange-600 dark:text-orange-500 font-bold italic">Risk is dynamically throttled to prevent violations of the {settings.maxDailyLossPercent}% daily loss rule.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PropFirm;
