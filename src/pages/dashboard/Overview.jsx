import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  TrendingUp,
  MessageSquare,
  ExternalLink,
  PlusCircle,
  Store,
  RefreshCcw,
  Copy,
  Check,
  Share2,
  MessageCircle,
  PlayCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import api from '../../api/axios';
import SetupProgressCard from '../../components/SetupProgressCard';

const HELP_DISMISSED_KEY = 'vendira_help_popup_dismissed';

// Clipboard API needs HTTPS; fall back to the old method elsewhere (e.g. plain http on a LAN)
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

const readDismissed = () => {
  try {
    return localStorage.getItem(HELP_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
};