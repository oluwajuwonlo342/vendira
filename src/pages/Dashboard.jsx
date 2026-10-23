import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Package, 
  Settings as SettingsIcon, // Aliased to avoid conflict with the Settings page component
  LogOut, 
  Menu, 
  X, 
  MessageSquare,
  Tags // Added missing Tags import
} from 'lucide-react';

// Page Components
import StoreManager from './dashboard/StoreManager';
import ProductManager from './dashboard/ProductManager';
import Reviews from './dashboard/Reviews';
import Overview from './dashboard/Overview';
import Settings from './dashboard/Settings';
import CategoryManager from './dashboard/CategoryManager';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Basic route protection: kick user out if no token is found
  useEffect(() => {
    const token = localStorage.getItem('vendira_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('vendira_token');
    navigate('/login');
  };

  const navLinks = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Store', path: '/dashboard/store', icon: Store },
    { name: 'Categories', path: '/dashboard/categories', icon: Tags }, // Grouped Categories near Products
    { name: 'Products', path: '/dashboard/products', icon: Package },
    { name: 'Reviews', path: '/dashboard/reviews', icon: MessageSquare },
    { name: 'Settings', path: '/dashboard/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-white w-64 border-r border-gray-200 z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <span className="text-2xl font-black text-[#128C7E]">Vendira.</span>
            <button className="ml-auto md:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;
              // Exact match handling to prevent /dashboard highlighting on sub-routes
              const isActive = location.pathname === link.path || (location.pathname === '/dashboard/' && link.path === '/dashboard');
              
              return (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl font-semibold transition-colors ${ 
                    isActive 
                      ? 'bg-emerald-50 text-[#128C7E]' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900' 
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-[#25D366]' : 'text-gray-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100">
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 lg:px-8">
          <button 
            className="md:hidden mr-4 text-gray-500 hover:text-gray-900" 
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {navLinks.find(link => link.path === location.pathname)?.name || 'Dashboard'}
          </h1>
        </header>

        {/* Dashboard Pages Router */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/store" element={<StoreManager />} />
            <Route path="/categories" element={<CategoryManager />} />
            <Route path="/products" element={<ProductManager />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;