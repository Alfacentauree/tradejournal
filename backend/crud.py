from sqlalchemy.orm import Session
from . import models, schemas

def create_trade(db: Session, trade: schemas.TradeCreate):
    trade_data = trade.dict()
    exit_price = trade_data.get("exit_price")

    if exit_price is not None:
        entry_price = trade_data["entry_price"]
        quantity = trade_data["quantity"]
        direction = trade_data["direction"]

        if direction == "Long":
            pnl = (exit_price - entry_price) * quantity
        else:
            pnl = (entry_price - exit_price) * quantity
        
        trade_data["pnl"] = pnl
        trade_data["is_win"] = pnl > 0

    db_trade = models.Trade(**trade_data)
    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)
    return db_trade

def get_trades(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Trade).offset(skip).limit(limit).all()

def get_trade(db: Session, trade_id: int):
    return db.query(models.Trade).filter(models.Trade.id == trade_id).first()

def update_trade_exit(db: Session, trade_id: int, exit_price: float):
    db_trade = get_trade(db, trade_id)
    if db_trade:
        db_trade.exit_price = exit_price
        if db_trade.direction == "Long":
            pnl = (exit_price - db_trade.entry_price) * db_trade.quantity
        else:
            pnl = (db_trade.entry_price - exit_price) * db_trade.quantity
        db_trade.pnl = pnl
        db_trade.is_win = pnl > 0
        db.commit()
        db.refresh(db_trade)
    return db_trade

def delete_trade(db: Session, trade_id: int):
    db_trade = get_trade(db, trade_id)
    if db_trade:
        db.delete(db_trade)
        db.commit()
    return db_trade

def delete_all_trades(db: Session):
    try:
        db.query(models.Trade).delete()
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise e

def update_trade(db: Session, trade_id: int, trade_update: schemas.TradeCreate):
    db_trade = get_trade(db, trade_id)
    if not db_trade:
        return None
    
    update_data = trade_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_trade, key, value)
    
    # Recalculate PnL if necessary
    if db_trade.exit_price is not None:
        if db_trade.direction == "Long":
            db_trade.pnl = (db_trade.exit_price - db_trade.entry_price) * db_trade.quantity
        else:
            db_trade.pnl = (db_trade.entry_price - db_trade.exit_price) * db_trade.quantity
        db_trade.is_win = db_trade.pnl > 0
    
    db.commit()
    db.refresh(db_trade)
    return db_trade
