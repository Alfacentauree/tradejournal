export interface Trade {
  id: number;
  created_at: string;
  pair: string;
  direction: 'Long' | 'Short';
  setup_name: string;
  entry_price: number;
  exit_price?: number;
  stop_loss: number;
  take_profit: number;
  quantity: number;
  commission: number;
  pnl?: number;
  is_win?: boolean;
  emotions: 'Neutral' | 'Greed' | 'Fear';
  mistakes?: string;
  notes?: string;
  image_url?: string;
}

export interface TradeCreate {
  pair: string;
  direction: 'Long' | 'Short';
  setup_name: string;
  entry_price: number;
  exit_price?: number;
  stop_loss: number;
  take_profit: number;
  quantity: number;
  notes?: string;
  emotions: 'Neutral' | 'Greed' | 'Fear';
  mistakes?: string;
}

export interface Stats {
  total_trades: number;
  win_rate: number;
  total_pnl: number;
  average_win: number;
  average_loss: number;
  profit_factor: number;
}

export interface EquityPoint {
  date: string;
  balance: number;
}

export interface DayPerformance {
  day: string;
  pnl: number;
  count: number;
}

export interface HourPerformance {
  hour: string;
  pnl: number;
  count: number;
}

export interface DailyPnL {
  date: string;
  pnl: number;
}

export interface DirectionPerformance {
  direction: string;
  total_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_pnl: number;
}
