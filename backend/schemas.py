from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TradeBase(BaseModel):
    pair: str
    direction: str
    setup_name: str
    entry_price: float
    stop_loss: float
    take_profit: float
    quantity: float
    commission: Optional[float] = 0.0
    notes: Optional[str] = None
    emotions: str
    mistakes: Optional[str] = None

class TradeCreate(TradeBase):
    exit_price: Optional[float] = None


class TradeResponse(TradeBase):
    id: int
    created_at: datetime
    exit_price: Optional[float] = None
    pnl: Optional[float] = None
    is_win: Optional[bool] = None

    class Config:
        orm_mode = True
