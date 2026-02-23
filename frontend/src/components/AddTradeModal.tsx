import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTrade } from '../api/trades';
import { X, Plus } from 'lucide-react';
import type { TradeCreate } from '../types/trade';

const schema = yup.object().shape({
  pair: yup.string().required('Symbol is required'),
  direction: yup.string().oneOf(['Long', 'Short']).required('Direction is required'),
  entry_price: yup.number().required('Entry price is required'),
  exit_price: yup.number().transform((value, originalValue) => (String(originalValue).trim() === '' ? undefined : value)).nullable(),
  stop_loss: yup.number().required('Stop loss is required'),
  take_profit: yup.number().required('Take profit is required'),
  quantity: yup.number().required('Quantity is required'),
  commission: yup.number().default(0),
  setup_name: yup.string().required('Setup name is required'),
  notes: yup.string(),
  emotions: yup.string().oneOf(['Neutral', 'Greed', 'Fear']).required('Emotion is required'),
  mistakes: yup.string(),
});

interface AddTradeModalProps {
  onClose: () => void;
}

const AddTradeModal: React.FC<AddTradeModalProps> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TradeCreate>({
    resolver: yupResolver(schema),
    defaultValues: {
      direction: 'Long',
      emotions: 'Neutral',
      commission: 0,
    } as any
  });

  const entryPrice = watch('entry_price');
  const direction = watch('direction');

  useEffect(() => {
    if (entryPrice && entryPrice > 0) {
      // Default: 1% SL and 2% TP
      const slPercent = 0.01;
      const tpPercent = 0.02;

      if (direction === 'Long') {
        setValue('stop_loss', Number((entryPrice * (1 - slPercent)).toFixed(5)));
        setValue('take_profit', Number((entryPrice * (1 + tpPercent)).toFixed(5)));
      } else {
        setValue('stop_loss', Number((entryPrice * (1 + slPercent)).toFixed(5)));
        setValue('take_profit', Number((entryPrice * (1 - tpPercent)).toFixed(5)));
      }
    }
  }, [entryPrice, direction, setValue]);

  const mutation = useMutation({
    mutationFn: createTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      onClose();
    },
  });

  const onSubmit = (data: TradeCreate) => {
    mutation.mutate(data);
  };

  const inputStyles = "p-2 border bg-slate-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-xl w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-50 dark:bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-300 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-slate-50 dark:bg-gray-900 z-10">
          <h2 className="text-xl font-black italic flex items-center gap-2">
            <Plus size={24} className="text-blue-500" />
            ADD NEW TRADE
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Symbol</label>
              <input {...register('pair')} placeholder="EURUSD, BTC, etc." className={inputStyles} />
              {errors.pair && <p className="text-red-500 text-[10px] ml-1">{errors.pair.message}</p>}
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Direction</label>
              <select {...register('direction')} className={inputStyles}>
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Entry Price</label>
              <input type="number" step="any" {...register('entry_price')} placeholder="0.00" className={inputStyles} />
              {errors.entry_price && <p className="text-red-500 text-[10px] ml-1">{errors.entry_price.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Exit Price (Optional)</label>
              <input type="number" step="any" {...register('exit_price')} placeholder="0.00" className={inputStyles} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Quantity</label>
              <input type="number" step="any" {...register('quantity')} placeholder="0.00" className={inputStyles} />
              {errors.quantity && <p className="text-red-500 text-[10px] ml-1">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Commission</label>
              <input type="number" step="any" {...register('commission')} placeholder="0.00" className={inputStyles} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Stop Loss</label>
              <input type="number" step="any" {...register('stop_loss')} placeholder="0.00" className={inputStyles} />
              {errors.stop_loss && <p className="text-red-500 text-[10px] ml-1">{errors.stop_loss.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Take Profit</label>
              <input type="number" step="any" {...register('take_profit')} placeholder="0.00" className={inputStyles} />
              {errors.take_profit && <p className="text-red-500 text-[10px] ml-1">{errors.take_profit.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Setup Name</label>
              <input {...register('setup_name')} placeholder="Breakout, Retest, etc." className={inputStyles} />
              {errors.setup_name && <p className="text-red-500 text-[10px] ml-1">{errors.setup_name.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Emotion</label>
              <select {...register('emotions')} className={inputStyles}>
                <option value="Neutral">Neutral</option>
                <option value="Greed">Greed</option>
                <option value="Fear">Fear</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Mistakes</label>
            <select {...register('mistakes')} className={inputStyles}>
              <option value="">No Mistakes</option>
              <option value="FOMO">FOMO</option>
              <option value="Early Entry">Early Entry</option>
              <option value="Early Exit">Early Exit</option>
              <option value="Late Entry">Late Entry</option>
              <option value="Revenge Trade">Revenge Trade</option>
              <option value="Overtrading">Overtrading</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Notes</label>
            <textarea {...register('notes')} placeholder="Trade details..." className={`${inputStyles} min-h-[100px]`} />
          </div>

          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
          >
            {mutation.isPending ? 'ADDING...' : 'ADD TRADE'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTradeModal;
