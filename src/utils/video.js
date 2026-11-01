const MIME_BY_EXT = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  ogg: 'video/ogg',
  '3gp': 'video/3gpp',
};

const isCloudinaryVideo = (url) => /^https?:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\//i.test(url || '');

const extOf = (url) => ((String(url).split('?')[0].match(/\.([a-z0-9]+)$/i) || [])[1] || '').toLowerCase();

const swapExtension = (url, ext) => url.replace(/\.[a-z0-9]+(\?.*)?$/i, `.${ext}$1`);

// The original file first (it plays instantly when the browser supports it), then a
// converted MP4 copy from Cloudinary as a fallback. Phones often record .mov or HEVC
// video that Chrome and Android browsers can't play, and the converted copy fixes that.
export const videoSources = (url) => {
  if (!url) return [];
  const sources = [{ src: url, type: MIME_BY_EXT[extOf(url)] }];

  if (isCloudinaryVideo(url)) {
    const converted = swapExtension(
      url.replace('/video/upload/', '/video/upload/f_mp4,q_auto,w_1280,c_limit/'),
      'mp4'
    );
    if (converted !== url) sources.push({ src: converted, type: 'video/mp4' });
  }
  return sources;
};

// A still frame from the video, shown before it plays
export const videoPoster = (url) => {
  if (!isCloudinaryVideo(url)) return undefined;
  return swapExtension(url.replace('/video/upload/', '/video/upload/so_0,w_800,c_limit,q_auto/'), 'jpg');
};
