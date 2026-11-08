import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Save,
  Store,
  AlertCircle,
  CheckCircle,
  Camera,
  Image as ImageIcon,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import api from '../../api/axios';
import EmptyState from '../../components/EmptyState';
import { CURRENCIES } from '../../utils/money';
import { normalizeWhatsapp, buildWhatsAppUrl, WHATSAPP_HELP } from '../../utils/whatsapp';
import { suggestSlugs } from '../../utils/slug';
import LocationFields from '../../components/LocationFields';
import ShortLinkCard from '../../components/ShortLinkCard';

const MAX_PICK_MB = 15; // reject only absurdly large originals; everything else is shrunk first
const UPLOAD_TIMEOUT_MS = 120000;

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] transition-colors';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Clipboard API needs HTTPS; fall back to the old method elsewhere
const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy approach
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
};

// Shrinks a photo in the browser so uploads are small and fast on slow mobile data.
// Falls back to the original file if anything goes wrong.
const compressImage = (file, maxSide, quality = 0.82) =>
  new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
      return resolve(file);
    }
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      if (scale === 1 && file.size < 300 * 1024) return resolve(file); // already small

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

      // JPEGs stay JPEG; PNGs become WebP so logo transparency is kept
      const outType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) return resolve(file);
          const ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png';
          const name = file.name.replace(/\.[^.]+$/, '') + '.' + ext;
          resolve(new File([blob], name, { type: blob.type }));
        },
        outType,
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });

const describeError = (error) => {
  if (error.response) {
    return (
      error.response.data?.error ||
      error.response.data?.message ||
      `Save failed (error ${error.response.status}). Please try again.`
    );
  }
  if (error.code === 'ECONNABORTED') {
    return 'The upload took too long and timed out. Try again on a stronger connection.';
  }
  return 'Could not reach the server. It may be waking up (this can take up to a minute) or your connection dropped. Please try again.';
};