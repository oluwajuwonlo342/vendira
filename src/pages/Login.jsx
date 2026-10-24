import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Store, LogIn, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

const inputClass =
  'appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] text-base sm:text-sm transition-colors';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const passwordReset = Boolean(location.state?.passwordReset);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: formData.email.trim(),
        password: formData.password,
      });
      localStorage.setItem('vendira_token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach the server. Check your connection and try again.');
      } else {
        setError(err.response.data?.error || err.response.data?.message || 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#F4FBF7] flex flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8 font-sans">
      <div className="mx-auto w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center text-2xl sm:text-3xl font-black tracking-tight text-[#128C7E]">
          <Store className="w-7 h-7 sm:w-8 sm:h-8 mr-2 text-[#25D366]" />
          Vendira.
        </Link>
        <h2 className="mt-5 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-[#128C7E] hover:text-[#075E54] whitespace-nowrap">
            Create a free store
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mt-8 mx-auto w-full max-w-md">
        <div className="bg-white py-6 px-5 sm:py-8 sm:px-10 shadow-xl border border-emerald-50 rounded-2xl">

          {passwordReset && !error && (
            <div role="status" className="mb-4 bg-emerald-50 border border-emerald-100 p-3 sm:p-4 flex items-start rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800">Your password was updated. Log in with your new password.</p>
            </div>
          )}

          {error && (
            <div role="alert" className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 flex items-start rounded-r-lg">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 break-words min-w-0">{error}</p>
            </div>
          )}

          <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-sm font-medium text-[#128C7E] hover:text-[#075E54]">
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-base sm:text-sm font-bold text-white bg-[#128C7E] hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <LogIn className="w-4 h-4 ml-2" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
