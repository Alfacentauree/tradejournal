import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Analytics from './pages/Analytics';
import TradeDetail from './pages/TradeDetail';
import PropFirm from './pages/PropFirm';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/trade/:id" element={<Layout><TradeDetail /></Layout>} />
        <Route path="/journal" element={<Layout><Journal /></Layout>} />
        <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
        <Route path="/propfirm" element={<Layout><PropFirm /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
