import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { videoSources, videoPoster } from '../utils/video';

const ProductVideo = ({ url, title = 'Product video', className = 'w-full aspect-video bg-black rounded-xl' }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!url) return null;

  // Neither the original nor the converted copy could play
  if (failed) {
    return (
      <div className={`${className} flex flex-col items-center justify-center text-center text-white p-4`}>
        <p className="text-sm">This video couldn't be played here.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center text-sm font-bold underline"
        >
          <ExternalLink className="w-4 h-4 mr-1" /> Open video
        </a>
      </div>
    );
  }

  const sources = videoSources(url);

  // preload="none": nothing downloads until the viewer presses play
  return (
    <video
      key={url}
      controls
      playsInline
      preload="none"
      poster={videoPoster(url)}
      aria-label={title}
      className={`${className} object-contain`}
    >
      {sources.map((source, index) => (
        <source
          key={source.src}
          src={source.src}
          type={source.type}
          onError={index === sources.length - 1 ? () => setFailed(true) : undefined}
        />
      ))}
      Your browser can't play this video.
    </video>
  );
};

export default ProductVideo;
