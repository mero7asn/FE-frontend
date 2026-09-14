/**
 * useScreenProtection
 * ──────────────────────────────────────────────────────────────────────────
 * Comprehensive screen-capture / screenshot / video-recording protection.
 */

import { useEffect, useRef } from 'react';

const OVERLAY_ID = '__screen_protect_overlay__';

function createOverlay() {
  if (document.getElementById(OVERLAY_ID)) return;
  const el = document.createElement('div');
  el.id = OVERLAY_ID;
  Object.assign(el.style, {
    position:        'fixed',
    inset:           '0',
    zIndex:          '2147483647',
    background:      '#000',
    opacity:         '1',
    pointerEvents:   'none',
    transition:      'opacity 0.15s ease',
  });
  document.body.appendChild(el);
}

function removeOverlay() {
  const el = document.getElementById(OVERLAY_ID);
  if (el) {
    el.style.opacity = '0';
    setTimeout(() => el && el.parentNode && el.parentNode.removeChild(el), 200);
  }
}

function patchGetDisplayMedia() {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia = async () => {
        console.warn('[ScreenProtect] Screen recording attempt blocked.');
        throw new DOMException(
          'Screen capture is not permitted on this page.',
          'NotAllowedError'
        );
      };
    }
  } catch (e) {
    // Silently ignore
  }
}

function disableContextMenu(e) {
  e.preventDefault();
  return false;
}

function blockScreenshotKeys(e) {
  const key  = e.key  || '';
  const code = e.code || '';

  if (key === 'PrintScreen' || code === 'PrintScreen') {
    e.preventDefault();
    e.stopPropagation();
    createOverlay();
    setTimeout(removeOverlay, 500);
    return;
  }

  if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'p') {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if ((e.ctrlKey || e.metaKey) && e.shiftKey && key.toLowerCase() === 's') {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if (e.metaKey && e.shiftKey && key.toLowerCase() === 's') {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if (
    key === 'F12' ||
    ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key.toLowerCase()))
  ) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'u') {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 's') {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
}

function disableImageDrag() {
  document.querySelectorAll('img, video, canvas').forEach((el) => {
    el.setAttribute('draggable', 'false');
    el.addEventListener('dragstart', (e) => e.preventDefault(), { passive: false });
  });
}

let devToolsOpen = false;
function detectDevTools(onOpen) {
  const threshold = 160;

  setInterval(() => {
    const widthDiff  = window.outerWidth  - window.innerWidth  > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;

    if ((widthDiff || heightDiff) && !devToolsOpen) {
      devToolsOpen = true;
      onOpen();
    } else if (!widthDiff && !heightDiff && devToolsOpen) {
      devToolsOpen = false;
    }
  }, 1000);
}

export function useScreenProtection() {
  const blurTimerRef = useRef(null);

  useEffect(() => {
    patchGetDisplayMedia();

    document.addEventListener('contextmenu', disableContextMenu, { capture: true });
    document.addEventListener('keydown', blockScreenshotKeys, { capture: true });

    const handleBlur = () => {
      createOverlay();
      blurTimerRef.current = setTimeout(removeOverlay, 2000);
    };
    const handleFocus = () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      removeOverlay();
    };

    window.addEventListener('blur',  handleBlur);
    window.addEventListener('focus', handleFocus);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        createOverlay();
      } else {
        removeOverlay();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    disableImageDrag();
    const mutationObserver = new MutationObserver(disableImageDrag);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    detectDevTools(() => {
      createOverlay();
      console.warn('[ScreenProtect] DevTools detected.');
    });

    return () => {
      document.removeEventListener('contextmenu', disableContextMenu, { capture: true });
      document.removeEventListener('keydown', blockScreenshotKeys,    { capture: true });
      window.removeEventListener('blur',  handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      mutationObserver.disconnect();

      const overlay = document.getElementById(OVERLAY_ID);
      if (overlay) overlay.parentNode?.removeChild(overlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
