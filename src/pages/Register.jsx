import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios'; // This points to http://localhost:5000/api

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  
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
      // Send registration data to your Express backend
      const response = await api.post('/auth/register', formData);
      
      // If successful, you can save the token to localStorage
      localStorage.setItem('vendira_token', response.data.token);
      
      // Redirect the vendor straight to their new dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FBF7] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center text-3xl font-black tracking-tight text-[#128C7E]">
          <Store className="w-8 h-8 mr-2 text-[#25D366]" />
          Vendira.
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your free account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/login" className="font-medium text-[#128C7E] hover:text-[#075E54]">
            log in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-emerald-50 sm:rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Business / Full Name</label>
              <div className="mt-1">
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#25D366] focus:border-[#25D366] sm:text-sm transition-colors"
                  placeholder="e.g. My Gadget Hub"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#25D366] focus:border-[#25D366] sm:text-sm transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">WhatsApp Number</label>
              <div className="mt-1">
                <input
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#25D366] focus:border-[#25D366] sm:text-sm transition-colors"
                  placeholder="08012345678"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <div className="mt-1">
                <input
                  name="password"
                  type="password"
                  required
                  minLength="6"
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#25D366] focus:border-[#25D366] sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#128C7E] hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-6">
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-500">
                <CheckCircle className="w-4 h-4 text-[#25D366] mr-2" /> No credit card required
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <CheckCircle className="w-4 h-4 text-[#25D366] mr-2" /> Setup takes less than 2 minutes
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;