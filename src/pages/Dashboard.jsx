import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Package,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Tags,
  Star,
  PlayCircle,   // <- add this
} from 'lucide-react';

import StoreManager from './dashboard/StoreManager';
import ProductManager from './dashboard/ProductManager';
import Reviews from './dashboard/Reviews';
import Overview from './dashboard/Overview';
import Settings from './dashboard/Settings';
import CategoryManager from './dashboard/CategoryManager';
import SiteFeedback from './dashboard/SiteFeedback';
import GettingStarted from './dashboard/GettingStarted';

const navLinks = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'My Store', path: '/dashboard/store', icon: Store },
  { name: 'Categories', path: '/dashboard/categories', icon: Tags },
  { name: 'Products', path: '/dashboard/products', icon: Package },
  { name: 'Reviews', path: '/dashboard/reviews', icon: MessageSquare },
  { name: 'Feedback', path: '/dashboard/feedback', icon: Star },
  { name: 'Settings', path: '/dashboard/settings', icon: SettingsIcon },
  { name: 'Getting Started', path: '/dashboard/guide', icon: PlayCircle },
  
];

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Ignore a trailing slash so /dashboard/ and /dashboard both match
  const currentPath = location.pathname.replace(/\/+$/, '') || '/';

  // Basic route protection
  useEffect(() => {
    const token = localStorage.getItem('vendira_token');
    if (!token) navigate('/login');
  }, [navigate]);

  // Close the drawer on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // While the mobile drawer is open: Escape closes it and the page behind doesn't scroll
  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  // Start each page at the top when navigating between dashboard sections
  useEffect(() => {
    document.getElementById('dashboard-scroll')?.scrollTo({ top: 0 });
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('vendira_token');
    navigate('/login');
  };

  const pageTitle = navLinks.find((link) => link.path === currentPath)?.name || 'Dashboard';

  return (
    // Fixed viewport height: sidebar and header stay put, only the content area scrolls
    <div className="h-screen h-[100dvh] bg-gray-50 flex font-sans overflow-hidden">

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 bg-white w-64 max-w-[85vw] border-r border-gray-200 z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:max-w-none md:flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex-shrink-0 flex items-center px-6 border-b border-gray-100">
            <span className="text-2xl font-black text-[#128C7E]">Vendira.</span>
            <button
              className="ml-auto md:hidden p-2 -mr-2"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1.5 sm:space-y-2 overflow-y-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPath === link.path;

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center px-4 py-3 rounded-xl font-semibold transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-[#128C7E]'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-[#25D366]' : 'text-gray-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 sm:p-4 border-t border-gray-100 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <header className="h-16 flex-shrink-0 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 lg:px-8">
          <button
            className="md:hidden -ml-2 mr-3 p-2 text-gray-500 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{pageTitle}</h1>
        </header>

        {/* id lets pages scroll their success/error banners into view */}
        <div id="dashboard-scroll" className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/guide" element={<GettingStarted />} />
            <Route path="/" element={<Overview />} />
            <Route path="/store" element={<StoreManager />} />
            <Route path="/categories" element={<CategoryManager />} />
            <Route path="/products" element={<ProductManager />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/feedback" element={<SiteFeedback />} />
            <Route path="/settings" element={<Settings />} />

          </Routes>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
