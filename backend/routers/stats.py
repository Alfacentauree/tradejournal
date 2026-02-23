from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models
from ..database import SessionLocal

router = APIRouter()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/stats/")
def get_stats(db: Session = Depends(get_db)):
    closed_trades = db.query(models.Trade).filter(models.Trade.pnl != None).all()
    
    total_trades = len(closed_trades)
    if total_trades == 0:
        return {
            "total_trades": 0,
            "win_rate": 0,
            "total_pnl": 0,
            "average_win": 0,
            "average_loss": 0,
        }

    winning_trades = [t for t in closed_trades if t.is_win]
    losing_trades = [t for t in closed_trades if not t.is_win]

    win_rate = (len(winning_trades) / total_trades) * 100 if total_trades > 0 else 0
    total_pnl = sum(t.pnl for t in closed_trades)
    
    total_wins = sum(t.pnl for t in winning_trades)
    total_losses = abs(sum(t.pnl for t in losing_trades))
    profit_factor = total_wins / total_losses if total_losses > 0 else (total_wins if total_wins > 0 else 0)

    average_win = total_wins / len(winning_trades) if winning_trades else 0
    average_loss = sum(t.pnl for t in losing_trades) / len(losing_trades) if losing_trades else 0

    return {
        "total_trades": total_trades,
        "win_rate": win_rate,
        "total_pnl": total_pnl,
        "average_win": average_win,
        "average_loss": average_loss,
        "profit_factor": profit_factor,
    }

@router.get("/stats/equity-curve")
def get_equity_curve(db: Session = Depends(get_db)):
    trades = db.query(models.Trade).filter(models.Trade.pnl != None).order_by(models.Trade.created_at).all()
    
    curve = []
    cumulative_pnl = 0
    # Initial point
    curve.append({"date": "Start", "balance": 0})
    
    for trade in trades:
        cumulative_pnl += trade.pnl
        curve.append({
            "date": trade.created_at.strftime("%Y-%m-%d %H:%M"),
            "balance": round(cumulative_pnl, 2)
        })
    
    return curve

@router.get("/stats/performance-by-day")
def get_performance_by_day(db: Session = Depends(get_db)):
    # 0=Sunday, 1=Monday, ..., 6=Saturday in SQLite strftime('%w')
    stats = db.query(
        func.strftime('%w', models.Trade.created_at).label("day_index"),
        func.sum(models.Trade.pnl).label("total_pnl"),
        func.count(models.Trade.id).label("trade_count")
    ).filter(models.Trade.pnl != None).group_by("day_index").all()
    
    day_map = {0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat"}
    return [{"day": day_map[int(s.day_index)], "pnl": s.total_pnl, "count": s.trade_count} for s in stats]

@router.get("/stats/performance-by-hour")
def get_performance_by_hour(db: Session = Depends(get_db)):
    stats = db.query(
        func.strftime('%H', models.Trade.created_at).label("hour"),
        func.sum(models.Trade.pnl).label("total_pnl"),
        func.count(models.Trade.id).label("trade_count")
    ).filter(models.Trade.pnl != None).group_by("hour").order_by("hour").all()
    
    return [{"hour": f"{s.hour}:00", "pnl": s.total_pnl, "count": s.trade_count} for s in stats]

@router.get("/stats/daily-pnl")
def get_daily_pnl(db: Session = Depends(get_db)):
    # Group by date part of created_at
    daily_stats = db.query(
        func.date(models.Trade.created_at).label("date"),
        func.sum(models.Trade.pnl).label("total_pnl")
    ).filter(models.Trade.pnl != None).group_by("date").all()
    
    return [{"date": str(stat.date), "pnl": stat.total_pnl} for stat in daily_stats]

@router.get("/stats/direction-performance")
def get_direction_performance(db: Session = Depends(get_db)):
    # Calculate stats for Long and Short trades
    stats = db.query(
        models.Trade.direction,
        func.count(models.Trade.id).label("total_trades"),
        func.count(func.nullif(models.Trade.is_win, False)).label("wins"),
        func.sum(models.Trade.pnl).label("total_pnl")
    ).filter(models.Trade.pnl != None).group_by(models.Trade.direction).all()
    
    result = []
    for s in stats:
        win_rate = (s.wins / s.total_trades * 100) if s.total_trades > 0 else 0
        result.append({
            "direction": s.direction,
            "total_trades": s.total_trades,
            "wins": s.wins,
            "losses": s.total_trades - s.wins,
            "win_rate": round(win_rate, 2),
            "total_pnl": s.total_pnl or 0
        })
    return result
