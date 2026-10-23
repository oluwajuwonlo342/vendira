import { useState } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import { Shield, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react'; 
import api from '../../api/axios'; 

const AdminLogin = () => { 
  const navigate = useNavigate(); 
  const [formData, setFormData] = useState({ email: '', password: '' }); 
  const [error, setError] = useState(''); 
  const [loading, setLoading] = useState(false); 

  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    setError(''); 
    setLoading(true); 

    try { 
      const res = await api.post('/auth/login', formData); 
      console.log("Backend Login Response:", res.data); // Useful for debugging in F12 console
      
      // Safely extract token and user, checking both standard and nested 'data' structures
      const token = res.data.token || res.data.data?.token;
      const user = res.data.user || res.data.data?.user;

      if (!user) {
        setError('Login successful, but user data is missing from the server response.');
        setLoading(false);
        return;
      }

      // Strict Role Check: Reject non-admins immediately 
      if (user.role !== 'ADMIN') { 
        setError('Access denied. This portal is strictly for platform administrators.'); 
        setLoading(false); 
        return; 
      } 

      // If they are an admin, save credentials and route to the admin dashboard 
      localStorage.setItem('vendira_token', token); 
      localStorage.setItem('vendira_user', JSON.stringify(user)); 
      
      navigate('/admin'); 
    } catch (err) { 
      console.error("Login Error Details:", err);
      // Prioritize the exact server error message
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        'Invalid email or password.'
      ); 
      setLoading(false); 
    } 
  }; 

  return ( 
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans"> 
      <div className="w-full max-w-md"> 
        {/* Logo/Header */} 
        <div className="text-center mb-10"> 
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl mb-4 border border-slate-800 shadow-xl"> 
            <Shield className="w-8 h-8 text-emerald-400" /> 
          </div> 
          <h1 className="text-3xl font-black text-white tracking-tight">Vendira Admin</h1> 
          <p className="text-slate-400 mt-2 text-sm font-medium">Secure Platform Management</p> 
        </div> 
        
        {/* Login Card */} 
        <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-800"> 
          {error && ( 
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start text-red-400"> 
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" /> 
              <span className="text-sm font-semibold">{error}</span> 
            </div> 
          )} 
          
          <form onSubmit={handleSubmit} className="space-y-6"> 
            <div> 
              <label className="block text-sm font-bold text-slate-300 mb-2">Administrator Email</label> 
              <div className="relative"> 
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"> 
                  <Mail className="h-5 w-5 text-slate-500" /> 
                </div> 
                <input 
                  type="email" 
                  required 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-slate-600" 
                  placeholder="admin@vendira.com" 
                /> 
              </div> 
            </div> 
            
            <div> 
              <label className="block text-sm font-bold text-slate-300 mb-2">Master Password</label> 
              <div className="relative"> 
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"> 
                  <Lock className="h-5 w-5 text-slate-500" /> 
                </div> 
                <input 
                  type="password" 
                  required 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-slate-600" 
                  placeholder="••••••••" 
                /> 
              </div> 
            </div> 
            
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full flex items-center justify-center px-4 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition-colors disabled:opacity-70 mt-4" 
            > 
              {loading ? 'Authenticating...' : ( 
                <>Secure Login <ArrowRight className="w-5 h-5 ml-2" /></> 
              )} 
            </button> 
          </form> 
        </div> 
        
        <div className="text-center mt-8"> 
          <p className="text-xs text-slate-600 font-medium flex items-center justify-center"> 
            <Lock className="w-3 h-3 mr-1" /> End-to-end encrypted connection 
          </p> 
        </div> 
      </div> 
    </div> 
  ); 
}; 

export default AdminLogin;