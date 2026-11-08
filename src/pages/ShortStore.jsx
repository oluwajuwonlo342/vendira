import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Store as StoreIcon } from 'lucide-react';
import api from '../api/axios';

const ShortStore = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | missing | error
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    api
      .get(`/stores/short/${encodeURIComponent(code)}`)
      .then((res) => {
        if (cancelled) return;
        const slug = res.data?.data?.slug;
        if (slug) {
          // Keep anything after the link, such as ?product=ID
          navigate(`/store/${slug}${window.location.search}`, { replace: true });
        } else {
          setStatus('missing');
        }
      })
      .catch((err) => {
        if (!cancelled) setStatus(err.response?.status === 404 ? 'missing' : 'error');
      });

    return () => { cancelled = true; };
  }, [code, navigate, attempt]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#25D366] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center text-center px-4">
      <StoreIcon className="w-12 h-12 text-gray-300 mb-3" />
      {status === 'missing' ? (
        <>
          <h1 className="text-xl font-bold text-gray-900">We couldn't find that store</h1>
          <p className="text-gray-500 mt-1 max-w-sm">The link may be mistyped, or the seller may have changed it. Ask them for their latest link.</p>
          <Link to="/" className="mt-5 px-6 py-3 bg-[#128C7E] hover:bg-[#075E54] text-white text-sm font-bold rounded-xl">Go to Vendira</Link>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold text-gray-900">Couldn't open this store</h1>
          <p className="text-gray-500 mt-1 max-w-sm">The server may be waking up or your connection dropped.</p>
          <button onClick={() => setAttempt((n) => n + 1)} className="mt-5 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl">Try again</button>
        </>
      )}
    </div>
  );
};

export default ShortStore;