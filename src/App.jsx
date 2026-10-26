import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// We will create these components next
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Storefront from './pages/Storefront';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TutorialVideo from './components/TutorialVideo';


function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Routes>
          {/* =========================================
              VENDIRA PUBLIC MARKETING SITE
              ========================================= */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/contact" element={<Contact />} />

          {/* =========================================
              VENDOR AUTHENTICATION
              ========================================= */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* =========================================
              VENDOR SECURE DASHBOARD
              ========================================= */}
          {/* Note: We will add a PrivateRoute wrapper here later to protect this */}
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/tutorial-video" element={<TutorialVideo />} />
<Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* =========================================
              PUBLIC CUSTOMER STOREFRONTS
              ========================================= */}
          <Route path="/store/:storeSlug" element={<Storefront />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
