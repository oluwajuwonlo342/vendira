import { Link } from 'react-router-dom';

const EmptyState = ({ icon: Icon, title, description, actionLabel, to }) => (
  <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-10">
    {Icon && (
      <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#128C7E] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7" />
      </div>
    )}
    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-500 mt-1.5">{description}</p>
    {actionLabel && to && (
      <Link to={to} className="inline-block mt-5 px-6 py-3 bg-[#128C7E] hover:bg-[#075E54] text-white text-sm font-bold rounded-xl transition-colors">
        {actionLabel}
      </Link>
    )}
  </div>
);

export default EmptyState;
