from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io
from datetime import datetime
import warnings

warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")

from .. import crud, models, schemas
from ..database import SessionLocal

router = APIRouter()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/trades/", response_model=schemas.TradeResponse)
def create_trade(trade: schemas.TradeCreate, db: Session = Depends(get_db)):
    return crud.create_trade(db=db, trade=trade)

@router.get("/trades/", response_model=List[schemas.TradeResponse])
def read_trades(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    trades = crud.get_trades(db, skip=skip, limit=limit)
    return trades

@router.get("/trades/{trade_id}", response_model=schemas.TradeResponse)
def read_trade(trade_id: int, db: Session = Depends(get_db)):
    db_trade = crud.get_trade(db, trade_id=trade_id)
    if db_trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    return db_trade

@router.put("/trades/{trade_id}", response_model=schemas.TradeResponse)
def update_trade(trade_id: int, trade: schemas.TradeCreate, db: Session = Depends(get_db)):
    db_trade = crud.update_trade(db, trade_id=trade_id, trade_update=trade)
    if db_trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    return db_trade

@router.put("/trades/{trade_id}/close", response_model=schemas.TradeResponse)
def close_trade(trade_id: int, exit_price: float, db: Session = Depends(get_db)):
    db_trade = crud.update_trade_exit(db, trade_id=trade_id, exit_price=exit_price)
    if db_trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    return db_trade

@router.delete("/trades/{trade_id}", response_model=schemas.TradeResponse)
def delete_trade(trade_id: int, db: Session = Depends(get_db)):
    db_trade = crud.delete_trade(db, trade_id=trade_id)
    if db_trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    return db_trade

@router.delete("/trades/all/clear")
def clear_all_trades(db: Session = Depends(get_db)):
    crud.delete_all_trades(db)
    return {"message": "All trades cleared successfully"}

@router.post("/trades/import")
async def import_trades(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    df = None
    
    try:
        if file.filename.endswith('.csv'):
            text_content = contents.decode('utf-8', errors='ignore')
            separator = '\t' if '\t' in text_content.split('\n')[0] else ','
            df = pd.read_csv(io.StringIO(text_content), sep=separator, header=None)
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents), header=None)
        else:
            raise HTTPException(status_code=400, detail="Invalid file format")
        
        # Find the header row (the row that contains 'Time' and 'Position')
        header_idx = -1
        for i, row in df.iterrows():
            row_list = [str(x).strip().lower() for x in row.tolist()]
            if 'time' in row_list and 'position' in row_list:
                header_idx = i
                break
        
        if header_idx == -1:
            raise HTTPException(status_code=400, detail="Could not find trade table header in file")

        # Set the columns and data
        df.columns = [str(x).strip() for x in df.iloc[header_idx]]
        df = df.iloc[header_idx + 1:] # Data starts after header

        def clean_num(val):
            if pd.isna(val) or str(val).strip() == "" or str(val).strip().lower() == 'nan': return 0.0
            if isinstance(val, (int, float)): return float(val)
            cleaned = "".join(c for c in str(val) if c.isdigit() or c in '.-')
            return float(cleaned) if cleaned else 0.0

        imported_count = 0
        for index, row in df.iterrows():
            # Stop if we hit a row that looks like a footer
            first_val = str(row.iloc[0]).lower()
            if any(x in first_val for x in ['orders', 'deals', 'total', 'balance']):
                break

            # Use column indices from the inspected Excel structure:
            # 0: Time, 1: Position, 2: Symbol, 3: Type, 4: Volume, 5: Price (Entry), 
            # 6: S / L, 7: T / P, 8: Time (Close), 9: Price (Exit), 10: Commission, 11: Swap, 12: Profit
            
            symbol = str(row.iloc[2]).strip()
            if not symbol or symbol.lower() == 'nan' or symbol.lower() == 'symbol':
                continue
            
            raw_type = str(row.iloc[3]).lower()
            direction = "Short" if "sell" in raw_type else "Long"
            
            entry_price = clean_num(row.iloc[5])
            exit_price = clean_num(row.iloc[9])
            pnl_val = clean_num(row.iloc[12])

            # Duplicate check:
            # We check if a trade with the same Symbol, Direction, Quantity, Entry Price, and Created At already exists.
            created_at_val = None
            time_val = row.iloc[0]
            if time_val and not pd.isna(time_val):
                try:
                    created_at_val = datetime.strptime(str(time_val).strip(), "%Y.%m.%d %H:%M:%S")
                except:
                    pass

            existing_trade = db.query(models.Trade).filter(
                models.Trade.pair == symbol,
                models.Trade.direction == direction,
                models.Trade.quantity == clean_num(row.iloc[4]),
                models.Trade.entry_price == entry_price,
                models.Trade.created_at == created_at_val
            ).first()

            if existing_trade:
                continue

            new_trade = models.Trade(
                pair=symbol,
                direction=direction,
                entry_price=entry_price,
                exit_price=exit_price,
                stop_loss=clean_num(row.iloc[6]),
                take_profit=clean_num(row.iloc[7]),
                quantity=clean_num(row.iloc[4]),
                commission=clean_num(row.iloc[10]),
                setup_name="Imported",
                emotions="Neutral",
                notes=f"Position: {row.iloc[1]}",
                pnl=pnl_val,
                is_win=pnl_val > 0,
                created_at=created_at_val
            )
            
            db.add(new_trade)
            imported_count += 1
            
        db.commit()
        return {"message": f"Successfully imported {imported_count} trades"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")
