// ============================================
// Tablo — Central Configuration
// ============================================

window.TABLO_CONFIG = {
  version: '0.4.0',
  channel: 'beta',
  baseHref: '/tablo-beta/'
};

// ============================================
// Cache Busting on Version Change
// ============================================

(function() {
  var storedVersion = localStorage.getItem('tablo-cache-version');
  var currentVersion = window.TABLO_CONFIG.version;

  if (storedVersion !== currentVersion) {
    console.log('[Tablo] Cache version changed:', storedVersion, '->', currentVersion);

    // Save new version immediately
    localStorage.setItem('tablo-cache-version', currentVersion);

    // Clear all browser caches
    if ('caches' in window) {
      caches.keys().then(function(names) {
        return Promise.all(names.map(function(name) {
          console.log('[Tablo] Deleting cache:', name);
          return caches.delete(name);
        }));
      }).then(function() {
        console.log('[Tablo] All caches cleared.');
      });
    }

    // Unregister old service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        return Promise.all(regs.map(function(reg) {
          console.log('[Tablo] Unregistering SW:', reg.scope);
          return reg.unregister();
        }));
      }).then(function() {
        console.log('[Tablo] All service workers unregistered.');
        // Reload once to fetch everything fresh
        if (!sessionStorage.getItem('tablo-cache-bust-done')) {
          sessionStorage.setItem('tablo-cache-bust-done', 'true');
          window.location.reload();
        }
      });
    } else {
      // No SW — just reload
      if (!sessionStorage.getItem('tablo-cache-bust-done')) {
        sessionStorage.setItem('tablo-cache-bust-done', 'true');
        window.location.reload();
      }
    }
  } else {
    // Same version — clear the one-time flag
    sessionStorage.removeItem('tablo-cache-bust-done');
  }
})();

// ============================================
// Global Translation Applier
// ============================================

window.applyTabloTranslations = function() {
  var lang = localStorage.getItem('tablo-language') || 'en';
  var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
  if (!t) return;

  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (t[key]) {
      el.textContent = t[key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    var key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) {
      el.placeholder = t[key];
    }
  });

  document.querySelectorAll('option[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (t[key]) {
      el.textContent = t[key];
    }
  });

  document.documentElement.lang = lang;

  window.dispatchEvent(new CustomEvent('tablo:languageChanged', {
    detail: { lang: lang }
  }));
};