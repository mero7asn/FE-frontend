(function () {
  'use strict';

  var _detectionCount = 0;
  var _maxDetections = 3;

  function onDetected(method) {
    _detectionCount++;
    console.warn('Screenshot/recording attempt detected via: ' + method);
    
    // Temporarily blank the screen
    document.body.style.opacity = '0';
    setTimeout(function() {
      document.body.style.opacity = '1';
    }, 100);

    if (_detectionCount >= _maxDetections) {
      document.documentElement.innerHTML = '<h1 style="text-align:center;margin-top:200px;">Access Restricted</h1>';
      setTimeout(function() {
        window.location.replace('about:blank');
      }, 2000);
    }
  }

  // visibilitychange and blur removed — triggered by normal tab switching

  // ══════════════════════════════════════════════════════════════════════════
  // 3. KEYBOARD SHORTCUTS — PrintScreen, Win+Shift+S (Windows), Cmd+Shift+3/4/5 (Mac)
  // ══════════════════════════════════════════════════════════════════════════
  document.addEventListener('keyup', function(e) {
    // PrintScreen key
    if (e.key === 'PrintScreen' || e.keyCode === 44) {
      onDetected('PrintScreen');
      e.preventDefault();
    }
  }, true);

  document.addEventListener('keydown', function(e) {
    var k = (e.key || '').toLowerCase();
    
    // Windows: Win+Shift+S (Snip & Sketch)
    if (e.metaKey && e.shiftKey && k === 's') {
      onDetected('Win+Shift+S');
      e.preventDefault();
    }
    
    // Mac: Cmd+Shift+3/4/5 (screenshot shortcuts)
    if (e.metaKey && e.shiftKey && ['3','4','5'].includes(k)) {
      onDetected('Mac screenshot shortcut');
      e.preventDefault();
    }

    // PrintScreen
    if (e.keyCode === 44) {
      onDetected('PrintScreen keydown');
      e.preventDefault();
    }
  }, true);

  // ══════════════════════════════════════════════════════════════════════════
  // 4. MEDIA CAPTURE API — detect screen recording via getDisplayMedia
  // ══════════════════════════════════════════════════════════════════════════
  if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    var _origGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getDisplayMedia = function() {
      onDetected('getDisplayMedia API');
      return Promise.reject(new Error('Screen capture blocked'));
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 5. CLIPBOARD MONITOR — detect when content copied (often precedes screenshot)
  // ══════════════════════════════════════════════════════════════════════════
  document.addEventListener('copy', function(e) {
    if (!['INPUT','TEXTAREA'].includes(e.target.tagName)) {
      onDetected('copy event');
    }
  });

  // pointerlockchange and fullscreenchange removed — triggered by normal tab switching

  // ══════════════════════════════════════════════════════════════════════════
  // 8. CANVAS POISONING — makes screenshots appear corrupted in some tools
  // Bypass: set window.__cardExportAllowed = true before trusted card export
  // ══════════════════════════════════════════════════════════════════════════
  var _origToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function() {
    if (window.__cardExportAllowed === true) {
      return _origToDataURL.apply(this, arguments);
    }
    onDetected('canvas.toDataURL() called');
    // Return corrupted/blank image
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  };

  var _origToBlob = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = function() {
    if (window.__cardExportAllowed === true) {
      return _origToBlob.apply(this, arguments);
    }
    onDetected('canvas.toBlob() called');
    return null;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 9. PREVENT HTML2CANVAS / DOM-TO-IMAGE libraries
  // ══════════════════════════════════════════════════════════════════════════
  Object.defineProperty(window, 'html2canvas', {
    get: function() { onDetected('html2canvas library'); return undefined; },
    set: function() {},
    configurable: true
  });

  Object.defineProperty(window, 'domtoimage', {
    get: function() { onDetected('dom-to-image library'); return undefined; },
    set: function() {},
    configurable: false
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 10. DETECT OBS / STREAMLABS via User-Agent and browser fingerprint
  // ══════════════════════════════════════════════════════════════════════════
  var ua = navigator.userAgent.toLowerCase();
  if (ua.includes('obs') || ua.includes('streamlabs') || ua.includes('xsplit')) {
    onDetected('Recording software detected in User-Agent');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 11. DETECT BROWSER EXTENSIONS that capture screens
  // ══════════════════════════════════════════════════════════════════════════
  var _knownExtensions = [
    'chrome-extension://',
    'moz-extension://',
    'safari-extension://'
  ];

  setInterval(function() {
    var scripts = document.querySelectorAll('script');
    scripts.forEach(function(s) {
      var src = s.src || '';
      _knownExtensions.forEach(function(ext) {
        if (src.includes(ext)) {
          onDetected('Browser extension script detected');
          s.parentNode && s.parentNode.removeChild(s);
        }
      });
    });
  }, 2000);

  // ══════════════════════════════════════════════════════════════════════════
  // 12. RAPID FLASHING OVERLAY — makes clean screenshots harder
  // ══════════════════════════════════════════════════════════════════════════
  var _overlay = document.createElement('div');
  _overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:999999;opacity:0.02;background:repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,0,0,0.1) 10px,rgba(255,0,0,0.1) 20px);mix-blend-mode:difference;';
  document.body.appendChild(_overlay);

  // Randomize pattern every second
  setInterval(function() {
    var colors = ['rgba(255,0,0,0.1)','rgba(0,255,0,0.1)','rgba(0,0,255,0.1)'];
    var color = colors[Math.floor(Math.random() * colors.length)];
    _overlay.style.background = 'repeating-linear-gradient(' + (Math.random() * 360) + 'deg,transparent,transparent 10px,' + color + ' 10px,' + color + ' 20px)';
  }, 1000);

  // ══════════════════════════════════════════════════════════════════════════
  // 13. TIMESTAMP WATERMARK — shows current time on screen (proves screenshot is fresh)
  // ══════════════════════════════════════════════════════════════════════════
  var _timestamp = document.createElement('div');
  _timestamp.style.cssText = 'position:fixed;bottom:10px;right:10px;font-size:9px;color:rgba(255,255,255,0.3);pointer-events:none;z-index:999998;font-family:monospace;text-shadow:1px 1px 2px rgba(0,0,0,0.5);';
  document.body.appendChild(_timestamp);

  setInterval(function() {
    var now = new Date();
    _timestamp.textContent = now.toISOString() + ' | Session: ' + (localStorage.getItem('token') || 'guest').substring(0, 8);
  }, 1000);

  // Mouse freeze detection removed — false positives when user is idle or on another tab

  // ══════════════════════════════════════════════════════════════════════════
  // 15. BATTERY API — some recording apps drain battery faster
  // ══════════════════════════════════════════════════════════════════════════
  if (navigator.getBattery) {
    navigator.getBattery().then(function(battery) {
      battery.addEventListener('levelchange', function() {
        // Rapid battery drain could indicate recording
        if (battery.level < 0.2 && battery.charging === false) {
          onDetected('Low battery - potential recording activity');
        }
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 16. NETWORK ACTIVITY SPIKE — uploads from recording tools
  // ══════════════════════════════════════════════════════════════════════════
  if (navigator.connection) {
    var _initialDownlink = navigator.connection.downlink;
    setInterval(function() {
      var currentDownlink = navigator.connection.downlink;
      if (Math.abs(currentDownlink - _initialDownlink) > 5) {
        onDetected('Suspicious network activity change');
      }
    }, 5000);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 17. PREVENT IFRAME EMBEDDING (recording tools often use iframes)
  // ══════════════════════════════════════════════════════════════════════════
  if (window.self !== window.top) {
    onDetected('Embedded in iframe');
    document.documentElement.innerHTML = '';
    window.location.replace('about:blank');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 18. DETECT ANDROID SCREENSHOT via volume down + power button timing
  // (heuristic - not 100% accurate but best available)
  // ══════════════════════════════════════════════════════════════════════════
  var _volumePressed = false;
  var _powerPressed = false;

  window.addEventListener('volumedownbutton', function() {
    _volumePressed = true;
    setTimeout(function() { _volumePressed = false; }, 500);
  });

  window.addEventListener('pause', function() {
    if (_volumePressed) {
      onDetected('Android screenshot gesture detected');
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 19. iOS SCREENSHOT DETECTION — status bar flash (unreliable but attempted)
  // ══════════════════════════════════════════════════════════════════════════
  var _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (_isIOS) {
    window.addEventListener('pagehide', function() {
      onDetected('iOS screenshot suspected (pagehide)');
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 20. CONTINUOUS CONTENT ROTATION — makes automated capture harder
  // ══════════════════════════════════════════════════════════════════════════
  setInterval(function() {
    // Randomly shift all images by 1px (imperceptible to humans)
    var images = document.querySelectorAll('img');
    images.forEach(function(img) {
      var offset = Math.random() > 0.5 ? 0.5 : -0.5;
      img.style.transform = 'translateZ(0) translateX(' + offset + 'px)';
    });
  }, 3000);

  // ══════════════════════════════════════════════════════════════════════════
  // 21. SAFE CREATEPATTERN OVERRIDE — prevents html2canvas / third-party crashes
  // ══════════════════════════════════════════════════════════════════════════
  var _origCreatePattern = CanvasRenderingContext2D.prototype.createPattern;
  CanvasRenderingContext2D.prototype.createPattern = function(image, repetition) {
    try {
      if (image && (image.width === 0 || image.height === 0)) {
        var dummy = document.createElement('canvas');
        dummy.width = 1;
        dummy.height = 1;
        return _origCreatePattern.call(this, dummy, repetition);
      }
      return _origCreatePattern.apply(this, arguments);
    } catch (err) {
      console.warn('createPattern error caught and handled safely:', err);
      var dummy = document.createElement('canvas');
      dummy.width = 1;
      dummy.height = 1;
      return _origCreatePattern.call(this, dummy, repetition);
    }
  };

  console.log('%c⚠️ Screenshot & Recording Protection Active', 'color:red;font-size:20px;font-weight:bold;');
  console.log('%cAttempting to capture this application may result in account termination.', 'color:orange;font-size:12px;');

}());
