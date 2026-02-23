import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTrade } from '../api/trades';
import { X } from 'lucide-react';
import type { Trade, TradeCreate } from '../types/trade';

const schema = yup.object().shape({
  pair: yup.string().required(),
  direction: yup.string().oneOf(['Long', 'Short']).required(),
  entry_price: yup.number().required(),
  exit_price: yup.number().transform((value, originalValue) => (String(originalValue).trim() === '' ? undefined : value)).nullable(),
  stop_loss: yup.number().required(),
  take_profit: yup.number().required(),
  quantity: yup.number().required(),
  commission: yup.number().default(0),
  setup_name: yup.string().required(),
  notes: yup.string(),
  emotions: yup.string().oneOf(['Neutral', 'Greed', 'Fear']).required(),
  mistakes: yup.string(),
});

interface EditTradeModalProps {
  trade: Trade;
  onClose: () => void;
}

const EditTradeModal: React.FC<EditTradeModalProps> = ({ trade, onClose }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<TradeCreate>({
    resolver: yupResolver(schema),
    defaultValues: {
      pair: trade.pair,
      direction: trade.direction,
      entry_price: trade.entry_price,
      exit_price: trade.exit_price,
      stop_loss: trade.stop_loss,
      take_profit: trade.take_profit,
      quantity: trade.quantity,
      commission: trade.commission,
      setup_name: trade.setup_name,
      notes: trade.notes,
      emotions: trade.emotions,
      mistakes: trade.mistakes,
    } as any
  });

  const mutation = useMutation({
    mutationFn: (data: TradeCreate) => updateTrade(trade.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['trade', trade.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      onClose();
    },
  });

  const onSubmit = (data: TradeCreate) => {
    mutation.mutate(data);
  };

  const inputStyles = "p-2 border bg-slate-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-xl w-full text-sm";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-50 dark:bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-300 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-slate-50 dark:bg-gray-900 z-10">
          <h2 className="text-xl font-black italic">EDIT TRADE</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Symbol</label>
              <input {...register('pair')} className={inputStyles} />
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
              <input type="number" step="any" {...register('entry_price')} className={inputStyles} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Exit Price</label>
              <input type="number" step="any" {...register('exit_price')} className={inputStyles} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Quantity</label>
              <input type="number" step="any" {...register('quantity')} className={inputStyles} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Commission</label>
              <input type="number" step="any" {...register('commission')} className={inputStyles} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Stop Loss</label>
              <input type="number" step="any" {...register('stop_loss')} className={inputStyles} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Take Profit</label>
              <input type="number" step="any" {...register('take_profit')} className={inputStyles} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Setup Name</label>
              <input {...register('setup_name')} className={inputStyles} />
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
            <textarea {...register('notes')} className={`${inputStyles} min-h-[100px]`} />
          </div>

          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
          >
            {mutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditTradeModal;
