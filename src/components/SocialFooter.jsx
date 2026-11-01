import { Globe } from 'lucide-react';

const svgProps = { width: 20, height: 20, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: 'false' };
const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const FacebookIcon = () => (
  <svg {...svgProps} {...strokeProps}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = () => (
  <svg {...svgProps} {...strokeProps}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TikTokIcon = () => (
  <svg {...svgProps} {...strokeProps}>
    <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
    <path d="M14 3c.3 2.6 2.1 4.6 5 4.9" />
  </svg>
);

const XIcon = () => (
  <svg {...svgProps} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const WebsiteIcon = () => <Globe className="w-5 h-5" aria-hidden="true" />;

// Display order, with each network's icon and colour
const NETWORKS = [
  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon, color: 'bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5]' },
  { key: 'facebook', label: 'Facebook', Icon: FacebookIcon, color: 'bg-[#1877F2]' },
  { key: 'tiktok', label: 'TikTok', Icon: TikTokIcon, color: 'bg-black' },
  { key: 'twitter', label: 'X (Twitter)', Icon: XIcon, color: 'bg-gray-900' },
  { key: 'website', label: 'Website', Icon: WebsiteIcon, color: 'bg-[#128C7E]' },
];

const isSafeUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

// Only networks the vendor actually filled in, with a valid web link
export const getSocialEntries = (links) =>
  NETWORKS.filter((n) => links?.[n.key] && isSafeUrl(links[n.key])).map((n) => ({ ...n, url: links[n.key] }));

const SocialFooter = ({ links, storeName }) => {
  const entries = getSocialEntries(links);

  // No links saved: show nothing at all
  if (entries.length === 0) return null;

  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center gap-4 text-center">
        <p className="text-sm font-bold text-gray-900">Follow {storeName}</p>

        <ul className="flex flex-wrap justify-center gap-3">
          {entries.map(({ key, label, Icon, color, url }) => (
            <li key={key}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label={`${storeName} on ${label}`}
                title={label}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-sm hover:opacity-90 hover:scale-105 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366] ${color}`}
              >
                <Icon />
              </a>
            </li>
          ))}
        </ul>

        <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} {storeName}</p>
      </div>
    </footer>
  );
};

export default SocialFooter;
