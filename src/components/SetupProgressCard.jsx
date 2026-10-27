import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Store, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import api from '../api/axios';

const SetupProgressCard = () => {
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    let cancelled = false;
    api
      .get('/onboarding')
      .then((res) => !cancelled && setState({ status: 'ready', data: res.data?.data }))
      .catch(() => !cancelled && setState({ status: 'error', data: null })); // optional card: stay quiet on errors
    return () => { cancelled = true; };
  }, []);

  if (state.status === 'loading') return <div className="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>;
  if (state.status === 'error' || !state.data) return null;

  const { store, checklist, progress, isPublished, nextStep } = state.data;

  // Nothing left to do: hide the card
  if (isPublished && progress.percent === 100) return null;

  // Empty state: no store yet
  if (!store) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 sm:p-8 text-center sm:text-left sm:flex sm:items-center sm:gap-6">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#128C7E] flex items-center justify-center mx-auto sm:mx-0 mb-4 sm:mb-0 flex-shrink-0">
          <Store className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Create your store in about 3 minutes</h2>
          <p className="text-sm text-gray-500 mt-1">We'll guide you step by step. Your progress is saved as you go, so you can stop and come back any time.</p>
        </div>
        <Link to="/dashboard/setup" className="mt-4 sm:mt-0 inline-flex items-center justify-center px-6 py-3 bg-[#128C7E] hover:bg-[#075E54] text-white text-sm font-bold rounded-xl transition-colors w-full sm:w-auto">
          Start setup <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    );
  }

  const remaining = checklist.filter((i) => !i.done && !i.optional);

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
            <Rocket className="w-5 h-5 mr-2 text-[#128C7E] flex-shrink-0" />
            {isPublished ? 'Your store is live. Finish your profile' : 'Finish setting up your store'}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {progress.done} of {progress.total} steps done.{' '}
            {!isPublished && "Customers can't see your store until you publish it."}
          </p>
        </div>
        <span className="text-2xl font-black text-[#128C7E]">{progress.percent}%</span>
      </div>

      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mt-4">
        <div className="h-full bg-[#25D366] rounded-full transition-all" style={{ width: `${progress.percent}%` }} />
      </div>

      <ul className="mt-4 space-y-2">
        {remaining.slice(0, 3).map((item) => (
          <li key={item.key}>
            <Link to={`/dashboard/setup?step=${item.step}`} className="flex items-center text-sm text-gray-700 hover:text-[#128C7E] font-medium">
              <Circle className="w-4 h-4 mr-2 text-gray-300 flex-shrink-0" /> {item.label}
            </Link>
          </li>
        ))}
        {remaining.length > 3 && <li className="text-xs text-gray-400 pl-6">+ {remaining.length - 3} more</li>}
        {remaining.length === 0 && (
          <li className="flex items-center text-sm text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Everything is ready. Publish when you want to go live.
          </li>
        )}
      </ul>

      <Link
        to={`/dashboard/setup?step=${nextStep}`}
        className="mt-5 inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-[#128C7E] hover:bg-[#075E54] text-white text-sm font-bold rounded-xl transition-colors"
      >
        Continue setup <ArrowRight className="w-4 h-4 ml-2" />
      </Link>
    </div>
  );
};

export default SetupProgressCard;
