from sqlalchemy import Boolean, Column, Float, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime

class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    pair = Column(String, index=True)
    direction = Column(String)
    setup_name = Column(String)
    entry_price = Column(Float)
    exit_price = Column(Float, nullable=True)
    stop_loss = Column(Float)
    take_profit = Column(Float)
    quantity = Column(Float)
    commission = Column(Float, default=0.0)
    pnl = Column(Float, nullable=True)
    is_win = Column(Boolean, nullable=True)
    emotions = Column(String)
    mistakes = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
