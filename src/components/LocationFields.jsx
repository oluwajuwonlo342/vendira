import { ExternalLink, Store, Globe } from 'lucide-react';
import { buildAddressText, mapsSearchUrl } from '../utils/maps';

export const NG_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] transition-colors';

// values: { state, city, address, hasPhysicalStore, mapLink }
// onChange(field, value)
const LocationFields = ({ values, onChange, idPrefix = 'loc' }) => {
  const physical = Boolean(values.hasPhysicalStore);
  const previewQuery = buildAddressText({
    address: values.address,
    city: values.city,
    state: values.state,
    country: NG_STATES.includes(values.state) ? 'Nigeria' : '',
  });

  const Choice = ({ active, icon: Icon, title, hint, onClick }) => (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex-1 text-left p-3.5 rounded-xl border-2 transition-colors ${
        active ? 'border-[#128C7E] bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <span className="flex items-center font-bold text-sm text-gray-900">
        <Icon className={`w-4 h-4 mr-2 ${active ? 'text-[#128C7E]' : 'text-gray-400'}`} /> {title}
      </span>
      <span className="block text-xs text-gray-500 mt-1">{hint}</span>
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor={`${idPrefix}-state`} className="block text-sm font-semibold text-gray-700 mb-1">State</label>
          <input
            id={`${idPrefix}-state`}
            type="text"
            list={`${idPrefix}-states`}
            autoComplete="address-level1"
            value={values.state}
            onChange={(e) => onChange('state', e.target.value)}
            className={inputClass}
            placeholder="e.g. Oyo"
          />
          <datalist id={`${idPrefix}-states`}>{NG_STATES.map((s) => <option key={s} value={s} />)}</datalist>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-city`} className="block text-sm font-semibold text-gray-700 mb-1">City or town</label>
          <input
            id={`${idPrefix}-city`}
            type="text"
            autoComplete="address-level2"
            value={values.city}
            onChange={(e) => onChange('city', e.target.value)}
            className={inputClass}
            placeholder="e.g. Ibadan"
          />
        </div>
      </div>

      <div>
        <p id={`${idPrefix}-kind`} className="block text-sm font-semibold text-gray-700 mb-2">Can customers visit you in person?</p>
        <div role="radiogroup" aria-labelledby={`${idPrefix}-kind`} className="flex flex-col sm:flex-row gap-3">
          <Choice
            active={!physical}
            icon={Globe}
            title="No, I sell online"
            hint="Only your city and state are shown. Your street address stays private."
            onClick={() => onChange('hasPhysicalStore', false)}
          />
          <Choice
            active={physical}
            icon={Store}
            title="Yes, I have a physical shop"
            hint="Your address, directions and a map are shown on your store."
            onClick={() => onChange('hasPhysicalStore', true)}
          />
        </div>
      </div>

      {physical && (
        <div className="space-y-5 bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div>
            <label htmlFor={`${idPrefix}-address`} className="block text-sm font-semibold text-gray-700 mb-1">Shop address</label>
            <input
              id={`${idPrefix}-address`}
              type="text"
              maxLength={200}
              autoComplete="street-address"
              value={values.address}
              onChange={(e) => onChange('address', e.target.value)}
              className={inputClass}
              placeholder="e.g. 12 Ring Road, opposite First Bank"
            />
            <p className="text-xs text-gray-500 mt-1">Add a landmark. It helps the map find the right spot.</p>
          </div>

          <div>
            <label htmlFor={`${idPrefix}-maplink`} className="block text-sm font-semibold text-gray-700 mb-1">
              Google Maps link <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id={`${idPrefix}-maplink`}
              type="url"
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
              value={values.mapLink}
              onChange={(e) => onChange('mapLink', e.target.value)}
              className={inputClass}
              placeholder="https://maps.app.goo.gl/..."
            />
            <p className="text-xs text-gray-500 mt-1">
              The most accurate option. In Google Maps, open your shop, tap Share, then Copy link.
            </p>
          </div>

          {values.address.trim() && (
            <a
              href={mapsSearchUrl(previewQuery)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-bold text-[#128C7E] underline"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" /> Check this address on the map
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationFields;
