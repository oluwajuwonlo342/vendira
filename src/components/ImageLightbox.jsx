import { useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const SWIPE_MIN_PX = 50;

const ImageLightbox = ({ images, index, onIndexChange, onClose, alt = '' }) => {
  const total = images.length;
  const image = images[index];
  const touchStart = useRef(null);
  const closeButton = useRef(null);
  const thumbs = useRef([]);

  // Moves forward or back and wraps around at either end, like a carousel
  const go = useCallback(
    (direction) => {
      if (total < 2) return;
      onIndexChange((index + direction + total) % total);
    },
    [index, total, onIndexChange]
  );

  // Keyboard: Escape closes, arrow keys move
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [go, onClose]);

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

  // Load the neighbouring photos ahead of time so swiping feels instant
  useEffect(() => {
    if (total < 2) return;
    [1, -1].forEach((direction) => {
      const preload = new Image();
      preload.src = images[(index + direction + total) % total].url;
    });
  }, [index, images, total]);

  // Keep the active thumbnail in view
  useEffect(() => {
    thumbs.current[index]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [index]);

  const onTouchStart = (e) => {
    // Ignore pinch gestures so zooming doesn't change the photo
    if (e.touches.length !== 1) {
      touchStart.current = null;
      return;
    }
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = (e) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    // Only count mostly-horizontal swipes, so scrolling and pinching aren't mistaken for a swipe
    if (Math.abs(dx) > SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
      go(dx < 0 ? 1 : -1);
    }
  };

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/95 flex flex-col select-none overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-label={alt ? `${alt}, full size photos` : 'Full size photos'}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 text-white">
        <span className="text-sm font-semibold" aria-live="polite">
          {total > 1 ? `${index + 1} / ${total}` : ''}
        </span>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          aria-label="Close image viewer"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Photo */}
      <div
        className="relative flex-1 min-h-0 px-2 sm:px-16"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          key={image.url}
          src={image.url}
          alt={alt}
          draggable={false}
          className="w-full h-full object-contain"
          style={{ touchAction: 'pan-y pinch-zoom' }}
        />

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {total > 1 ? (
        <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] justify-start sm:justify-center">
          {images.map((img, i) => (
            <button
              key={img.public_id || i}
              ref={(el) => { thumbs.current[i] = el; }}
              type="button"
              onClick={() => onIndexChange(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-opacity ${
                i === index ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div className="pb-[max(1rem,env(safe-area-inset-bottom))]" />
      )}
    </div>
  );
};

export default ImageLightbox;
