import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Store, 
  Activity, 
  LogOut, 
  Menu, 
  X,
  Settings
} from 'lucide-react';

import AdminOverview from './AdminOverview';
import ManageVendors from './ManageVendors';
import ManageStores from './ManageStores';
import SystemSettings from './SystemSettings';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verify Admin Status
  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem('vendira_token');
      if (!token) return navigate('/login');

      try {
        // In a real app, decode token or call an /auth/admin/verify endpoint
        // For now, we assume the user object in localStorage has role: 'admin'
        const user = JSON.parse(localStorage.getItem('vendira_user') || '{}');
        if (user.role !== 'ADMIN') {
          navigate('/dashboard'); // Redirect normal vendors to their dashboard
        } else {
          setIsAdmin(true);
        }
      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('vendira_token');
    localStorage.removeItem('vendira_user');
    navigate('/login');
  };

  const adminLinks = [
    { name: 'Platform Overview', path: '/admin', icon: Activity },
    { name: 'Manage Vendors', path: '/admin/users', icon: Users },
    { name: 'All Stores', path: '/admin/stores', icon: Store },
    { name: 'System Settings', path: '/admin/settings', icon: Settings },
  ];

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Admin Sidebar - Darker theme to distinguish from Vendor Dashboard */}
      <aside className={`fixed inset-y-0 left-0 bg-slate-900 w-64 z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col text-slate-300">
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
            <Shield className="w-6 h-6 text-emerald-400 mr-2" />
            <span className="text-xl font-black text-white">Vendira Admin</span>
            <button className="ml-auto md:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Management</p>
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path || (location.pathname === '/admin/' && link.path === '/admin');
              
              return (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl font-semibold transition-colors ${ 
                    isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 hover:text-white' 
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800 bg-slate-950">
            <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-red-400 font-semibold rounded-xl hover:bg-red-400/10 transition-colors">
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 lg:px-8">
          <button className="md:hidden mr-4 text-gray-500 hover:text-gray-900" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {adminLinks.find(link => link.path === location.pathname)?.name || 'Admin Panel'}
          </h1>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<AdminOverview />} />
           <Route path="/users" element={<ManageVendors />} />
           <Route path="/stores" element={<ManageStores />} />
        
<Route path="/settings" element={<SystemSettings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;