import { useState, useEffect } from 'react';
import { PlayCircle, AlertCircle, Sparkles } from 'lucide-react';
import api from '../../api/axios';
import TutorialVideo from '../../components/TutorialVideo';

const GettingStarted = () => {
  const [welcome, setWelcome] = useState(null);
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/guide');
        setWelcome(res.data?.data?.welcome || null);
        setTutorials(res.data?.data?.tutorials || []);
      } catch (err) {
        console.error('Load guide failed:', err.response?.status, err.response?.data);
        setError(err.response?.data?.error || (err.response ? 'Could not load the guide.' : 'Cannot reach the server. Please try again.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-6">
        <div className="h-36 bg-gray-200 rounded-2xl"></div>
        <div className="h-64 bg-gray-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-10 space-y-6 sm:space-y-8">
      {error && (
        <div role="alert" className="p-3 sm:p-4 rounded-xl flex items-start bg-red-50 text-red-700 border border-red-100">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium break-words min-w-0">{error}</span>
        </div>
      )}

      {welcome && (
        <div className="bg-gradient-to-r from-[#128C7E] to-[#25D366] rounded-3xl p-5 sm:p-8 text-white shadow-lg">
          <div className="flex items-center text-emerald-100 text-xs sm:text-sm font-bold uppercase tracking-wide mb-2">
            <Sparkles className="w-4 h-4 mr-1.5" /> {welcome.subject}
          </div>
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line break-words">{welcome.message}</p>
        </div>
      )}

      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center mb-4">
          <PlayCircle className="w-6 h-6 mr-2 text-[#128C7E]" /> Video tutorials
        </h2>

        {tutorials.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white rounded-2xl border border-gray-100">
            <PlayCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Tutorials are coming soon. Check back shortly.</p>
          </div>
        ) : (
          <ol className="space-y-5 sm:space-y-6">
            {tutorials.map((t, index) => (
              <li key={t._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-50 text-[#128C7E] text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 break-words">{t.title}</h3>
                    {t.description && <p className="text-sm text-gray-500 mt-0.5 break-words">{t.description}</p>}
                  </div>
                </div>
                <TutorialVideo url={t.videoUrl} title={t.title} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};

export default GettingStarted;
