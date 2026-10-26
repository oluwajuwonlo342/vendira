import { ExternalLink } from 'lucide-react';

export const getVideoSource = (url) => {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    let youtubeId = null;
    if (host === 'youtu.be') youtubeId = u.pathname.slice(1);
    else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') youtubeId = u.searchParams.get('v');
      else if (/^\/(embed|shorts|live)\//.test(u.pathname)) youtubeId = u.pathname.split('/')[2];
    }
    if (youtubeId) return { type: 'embed', src: `https://www.youtube-nocookie.com/embed/${youtubeId}` };

    if (host === 'vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (/^\d+$/.test(id)) return { type: 'embed', src: `https://player.vimeo.com/video/${id}` };
    }

    const poster = host === 'res.cloudinary.com' ? url.replace(/\.[a-z0-9]+$/i, '.jpg') : undefined;
    return { type: 'file', src: url, poster };
  } catch {
    return null;
  }
};

const TutorialVideo = ({ url, title }) => {
  const source = getVideoSource(url);

  if (!source) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-bold text-[#128C7E]">
        Open video <ExternalLink className="w-4 h-4 ml-1" />
      </a>
    );
  }

  if (source.type === 'embed') {
    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          src={source.src}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }

  // preload="none" means nothing downloads until the vendor presses play (saves mobile data)
  return (
    <video
      src={source.src}
      poster={source.poster}
      controls
      preload="none"
      playsInline
      className="w-full aspect-video bg-black rounded-xl"
    />
  );
};

export default TutorialVideo;
