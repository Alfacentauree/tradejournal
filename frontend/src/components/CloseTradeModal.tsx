import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { closeTrade } from '../api/trades';

interface CloseTradeModalProps {
  tradeId: number;
  onClose: () => void;
}

const CloseTradeModal = ({ tradeId, onClose }: CloseTradeModalProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm<{ exit_price: number }>();

  const mutation = useMutation({
    mutationFn: (data: { exit_price: number }) => closeTrade(tradeId, data.exit_price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      onClose();
    },
  });

  const onSubmit = (data: { exit_price: number }) => {
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
      <div className="bg-slate-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Close Trade</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            type="number"
            step="any"
            {...register('exit_price', { required: true, valueAsNumber: true })}
            placeholder="Enter Exit Price"
            className="p-2 border bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded w-full mb-4"
          />
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="bg-gray-1000 hover:bg-gray-600 text-white p-2 rounded mr-2">
              Cancel
            </button>
            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded">
              Confirm & Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CloseTradeModal;
