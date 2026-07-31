(function () {
  'use strict';

  // ── REDIRECT TARGET when tampering detected ────────────────────────────────
  function die() {
    document.documentElement.innerHTML = '';
    window.location.replace('about:blank');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 1. BLOCK CONTEXT MENU (right-click)
  // ══════════════════════════════════════════════════════════════════════════
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    return false;
  }, true);

  // ══════════════════════════════════════════════════════════════════════════
  // 2. BLOCK SOURCE-VIEW & COPY KEYBOARD SHORTCUTS (F12 / DevTools allowed)
  // ══════════════════════════════════════════════════════════════════════════
  var BLOCKED_CTRL = ['u','s','p','h'];

  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    // Block Ctrl+U (view-source), Ctrl+S (save), Ctrl+P (print), Ctrl+H (history)
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && BLOCKED_CTRL.includes(k)) {
      e.preventDefault(); e.stopImmediatePropagation(); return false;
    }
  }, true);

  // ══════════════════════════════════════════════════════════════════════════
  // 3–7. DevTools detection removed — F12 and DevTools are allowed
  // ══════════════════════════════════════════════════════════════════════════

  // ══════════════════════════════════════════════════════════════════════════
  // 8. BLOCK TEXT SELECTION & DRAG
  // ══════════════════════════════════════════════════════════════════════════
  document.addEventListener('selectstart', function (e) {
    if (!['INPUT','TEXTAREA'].includes(e.target.tagName)) {
      e.preventDefault(); return false;
    }
  }, true);
  document.addEventListener('dragstart', function (e) {
    e.preventDefault(); return false;
  }, true);
  document.addEventListener('copy',  function (e) { e.preventDefault(); }, true);
  document.addEventListener('cut',   function (e) { e.preventDefault(); }, true);
  document.addEventListener('paste', function (e) {
    if (!['INPUT','TEXTAREA'].includes(e.target.tagName)) {
      e.preventDefault();
    }
  }, true);

  // ══════════════════════════════════════════════════════════════════════════
  // 9. BLOCK PRINT
  // ══════════════════════════════════════════════════════════════════════════
  var _origPrint = window.print;
  window.addEventListener('beforeprint', function (e) {
    if (window.__cardExportAllowed === true) {
      return;
    }
    e.preventDefault();
    window.stop();
    return false;
  });
  // Override window.print itself
  try {
    Object.defineProperty(window, 'print', {
      value: function () {
        if (window.__cardExportAllowed === true) {
          if (typeof _origPrint === 'function') {
            _origPrint.call(window);
          }
        }
      },
      writable: false,
      configurable: false
    });
  } catch (ex) {}


  // ══════════════════════════════════════════════════════════════════════════
  // 10. DISABLE VIEW-SOURCE PROTOCOL
  // ══════════════════════════════════════════════════════════════════════════
  window.addEventListener('beforeunload', function (e) {
    var url = document.activeElement && document.activeElement.href;
    if (url && url.startsWith('view-source:')) {
      e.preventDefault();
      return false;
    }
  });

  // 11. Console freeze removed — DevTools allowed

  // ══════════════════════════════════════════════════════════════════════════
  // 12. MUTATION OBSERVER — detects if someone injects script tags into DOM
  // ══════════════════════════════════════════════════════════════════════════
  var _observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.tagName === 'SCRIPT') {
          var src = node.src || '';
          var allowed = ['localhost', window.location.hostname, 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
          var isAllowed = allowed.some(function (h) { return src.includes(h) || src === ''; });
          if (!isAllowed) {
            node.parentNode && node.parentNode.removeChild(node);
            die();
          }
        }
      });
    });
  });
  _observer.observe(document.documentElement, { childList: true, subtree: true });

  // ══════════════════════════════════════════════════════════════════════════
  // 13. IFRAME / EMBED PROTECTION — refuse to run inside a frame
  // ══════════════════════════════════════════════════════════════════════════
  if (window.top !== window.self) {
    die();
  }

  // 14. Mobile devtools block removed — DevTools allowed

}());
