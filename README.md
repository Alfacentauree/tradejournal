# 📊 TradeJournal

A professional-grade trading journal and performance analytics application designed for serious traders and Prop Firm challengers. Track your trades, analyze your consistency, and manage your risk with a modern, high-performance interface.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)
![React](https://img.shields.io/badge/Frontend-React-61DAFB.svg)

## ✨ Features

- **Dashboard:** Real-time metrics including Net P&L, Win Rate, Profit Factor, and Equity Curve.
- **Advanced Journal:** Detailed trade logging with support for entry/exit prices, setup names, and mistake tracking.
- **Performance Analytics:** 
  - **PnL Calendar:** A beautiful, revamped calendar view to track daily consistency.
  - **Monthly Insights:** Automatically identifies your best and worst performing months.
  - **DOW/Hourly Analysis:** Analyze performance based on the day of the week and time of day.
- **Prop Firm Tool:** Built-in risk calculator and drawdown tracker specifically for Prop Firm challenges (funded accounts).
- **Modern UI:** "Dimmed" light mode and deep dark mode for reduced eye strain during long trading sessions.

## 🛠 Tech Stack

- **Frontend:** React (TypeScript), Vite, Tailwind CSS, Lucide React (Icons), Recharts (Graphs).
- **Backend:** FastAPI (Python), SQLAlchemy (ORM).
- **Database:** SQLite.
- **State Management:** TanStack Query (React Query).

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/tradejournal.git
   cd tradejournal
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start Backend:**
   ```bash
   cd backend
   # Make sure venv is active
   uvicorn main:app --reload
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
*Built for traders, by traders.*
