import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllTrades, importTrades, deleteTrade, clearAllTrades } from '../api/trades';
import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, Calendar, Tag, AlertTriangle, FileUp, Edit2, Trash2, Plus, ChevronUp, ChevronDown, ArrowUpDown, ExternalLink, Trash } from 'lucide-react';
import EditTradeModal from '../components/EditTradeModal';
import AddTradeModal from '../components/AddTradeModal';
import type { Trade } from '../types/trade';

type SortConfig = {
  key: keyof Trade | 'date';
  direction: 'asc' | 'desc';
} | null;

const Journal = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<'All' | 'Wins' | 'Losses' | 'Open'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });

  const { data: trades, isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: getAllTrades,
  });

  const handleSort = (key: keyof Trade | 'date') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleRowClick = (id: number) => {
    navigate(`/trade/${id}`);
  };

  const SortIcon = ({ column }: { column: keyof Trade | 'date' }) => {
    if (!sortConfig || sortConfig.key !== column) return <ArrowUpDown size={12} className="ml-1 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="ml-1 text-blue-500" /> : <ChevronDown size={12} className="ml-1 text-blue-500" />;
  };

  const sortedAndFilteredTrades = useMemo(() => {
    if (!trades) return [];

    let result = trades.filter(trade => {
      const matchesFilter = 
        filter === 'All' || 
        (filter === 'Wins' && trade.pnl! > 0) || 
        (filter === 'Losses' && trade.pnl! < 0) || 
        (filter === 'Open' && !trade.exit_price);
      
      const matchesSearch = 
        trade.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trade.setup_name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'date') {
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
        } else {
          aValue = a[sortConfig.key as keyof Trade];
          bValue = b[sortConfig.key as keyof Trade];
        }

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [trades, filter, searchQuery, sortConfig]);

  const deleteMutation = useMutation({
    mutationFn: deleteTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: clearAllTrades,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });

  const importMutation = useMutation({
    mutationFn: importTrades,
    onSuccess: (data) => {
      alert(data.message);
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Import failed");
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete ALL trades? This action cannot be undone.')) {
      clearAllMutation.mutate();
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trade Journal</h1>
        
        {/* Filters & Search & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".csv, .xlsx, .xls"
          />
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-green-500/10"
          >
            <Plus size={16} />
            Add Trade
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
            className="flex items-center gap-1.5 h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 disabled:opacity-50"
          >
            <FileUp size={16} />
            {importMutation.isPending ? 'Importing...' : 'Import Excel'}
          </button>

          <button 
            onClick={handleClearAll}
            disabled={clearAllMutation.isPending}
            className="flex items-center gap-1.5 h-9 px-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/10 disabled:opacity-50"
          >
            <Trash size={16} />
            {clearAllMutation.isPending ? 'Clearing...' : 'Clear All'}
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search ticker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-9 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-56 text-xs"
            />
          </div>
          
          <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl border border-gray-300 dark:border-gray-700">
            {(['All', 'Wins', 'Losses', 'Open'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f 
                    ? 'bg-slate-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-gray-100/50 dark:bg-gray-900/50 border-b border-gray-300 dark:border-gray-700">
                <th 
                  className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-[120px] cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">Date <SortIcon column="date" /></div>
                </th>
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Symbol</th>
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-[80px]">Side</th>
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Setup</th>
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Entry/Exit</th>
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mistakes</th>
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">PnL</th>
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {sortedAndFilteredTrades?.map((trade) => (
                <tr 
                  key={trade.id} 
                  className="hover:bg-blue-50/10 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                  onClick={() => handleRowClick(trade.id)}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <Calendar size={12} className="mr-1.5 opacity-50" />
                      {new Date(trade.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-bold text-sm text-gray-900 dark:text-gray-100">{trade.pair}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${
                      trade.direction === 'Long' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'
                    }`}>
                      {trade.direction}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <Tag size={12} className="mr-1.5 text-blue-500 opacity-50" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{trade.setup_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-gray-900 dark:text-gray-200">${trade.entry_price}</span>
                    <span className="mx-1.5 opacity-30">→</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-200">{trade.exit_price ? `$${trade.exit_price}` : '-'}</span>
                  </td>
                  <td className="px-4 py-4">
                    {trade.mistakes ? (
                      <div className="inline-flex items-center text-[10px] bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-lg border border-orange-100 dark:border-orange-800/30">
                        <AlertTriangle size={10} className="mr-1" />
                        {trade.mistakes}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-300 dark:text-gray-600 italic">None</span>
                    )}
                  </td>
                  <td className={`px-4 py-4 text-sm font-black text-right ${trade.pnl! >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.pnl ? `${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setEditingTrade(trade)}
                        className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Delete this trade?')) deleteMutation.mutate(trade.id);
                        }}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedAndFilteredTrades?.length === 0 && (
            <div className="py-20 text-center text-gray-500">
              No trades found matching your filters.
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <AddTradeModal 
          onClose={() => setIsAddModalOpen(false)} 
        />
      )}

      {editingTrade && (
        <EditTradeModal 
          trade={editingTrade} 
          onClose={() => setEditingTrade(null)} 
        />
      )}
    </div>
  );
};

export default Journal;
