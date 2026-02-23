import api from './axios';
import type { Trade, TradeCreate, Stats, DailyPnL, EquityPoint, DayPerformance, HourPerformance, DirectionPerformance } from '../types/trade';

export const getAllTrades = async (): Promise<Trade[]> => {
  const { data } = await api.get('/trades/');
  return data;
};

export const getTradeById = async (id: string): Promise<Trade> => {
  const { data } = await api.get(`/trades/${id}`);
  return data;
};

export const createTrade = async (tradeData: TradeCreate): Promise<Trade> => {
  const { data } = await api.post('/trades/', tradeData);
  return data;
};

export const updateTrade = async (id: number, tradeData: TradeCreate): Promise<Trade> => {
  const { data } = await api.put(`/trades/${id}`, tradeData);
  return data;
};

export const closeTrade = async (id: number, exitPrice: number): Promise<Trade> => {
  const { data } = await api.put(`/trades/${id}/close?exit_price=${exitPrice}`);
  return data;
};

export const deleteTrade = async (id: number): Promise<void> => {
  await api.delete(`/trades/${id}`);
};

export const clearAllTrades = async (): Promise<{ message: string }> => {
  const { data } = await api.delete('/trades/all/clear');
  return data;
};

export const getStats = async (): Promise<Stats> => {
  const { data } = await api.get('/stats/');
  return data;
};

export const getDailyPnL = async (): Promise<DailyPnL[]> => {
  const { data } = await api.get('/stats/daily-pnl');
  return data;
};

export const getEquityCurve = async (): Promise<EquityPoint[]> => {
  const { data } = await api.get('/stats/equity-curve');
  return data;
};

export const getPerformanceByDay = async (): Promise<DayPerformance[]> => {
  const { data } = await api.get('/stats/performance-by-day');
  return data;
};

export const getPerformanceByHour = async (): Promise<HourPerformance[]> => {
  const { data } = await api.get('/stats/performance-by-hour');
  return data;
};

export const getDirectionPerformance = async (): Promise<DirectionPerformance[]> => {
  const { data } = await api.get('/stats/direction-performance');
  return data;
};

export const importTrades = async (file: File): Promise<{ message: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/trades/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};
