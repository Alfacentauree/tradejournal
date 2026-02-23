import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart2, 
  PlusSquare, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  ShieldCheck
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/journal', label: 'Journal', icon: BookOpen },
    { path: '/analytics', label: 'Analytics', icon: BarChart2 },
    { path: '/propfirm', label: 'Prop Firm', icon: ShieldCheck },
  ];

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/journal': return 'Journal Log';
      case '/analytics': return 'Performance Analytics';
      case '/propfirm': return 'Prop Firm Challenge';
      case '/': default: return 'Dashboard';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full bg-slate-50 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-800 transition-all duration-300 z-50 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 flex items-center justify-between">
            {!isCollapsed && (
              <span className="text-xl font-black bg-gradient-to-r from-blue-500 to-amber-400 bg-clip-text text-transparent tracking-tighter">
                GUIDING LIGHT
              </span>
            )}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors mx-auto"
            >
              {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center p-3 rounded-xl transition-all group ${
                    isActive 
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Icon size={22} className={`${isActive ? 'text-blue-600 dark:text-blue-400' : 'group-hover:scale-110 transition-transform'}`} />
                  {!isCollapsed && (
                    <span className="ml-4 font-semibold text-sm tracking-wide">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-gray-300 dark:border-gray-800">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-2`}>
              {!isCollapsed && <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Theme</span>}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <header className="sticky top-0 bg-slate-50/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-300 dark:border-gray-800 z-40 p-6">
          <div className="container mx-auto">
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-gray-100 uppercase italic">
              {getPageTitle()}
            </h1>
          </div>
        </header>
        
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
