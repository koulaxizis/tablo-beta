// ============================================
// Tablo — Central Configuration
// ============================================

window.TABLO_CONFIG = {
  version: '0.4.0',
  channel: 'beta',
  baseHref: '/tablo-beta/'
};

// ============================================
// Cache Busting (Disabled for Development)
// ============================================

/*
(function() {
  var storedVersion = localStorage.getItem('tablo-cache-version');
  var currentVersion = window.TABLO_CONFIG.version;

  if (storedVersion !== currentVersion) {
    console.log('[Tablo] Version changed:', storedVersion, '->', currentVersion);
    localStorage.setItem('tablo-cache-version', currentVersion);

    if ('caches' in window) {
      caches.keys().then(function(names) {
        return Promise.all(names.map(function(name) {
          return caches.delete(name);
        }));
      });
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        return Promise.all(regs.map(function(reg) {
          return reg.unregister();
        }));
      }).then(function() {
        if (!sessionStorage.getItem('tablo-cache-bust-done')) {
          sessionStorage.setItem('tablo-cache-bust-done', 'true');
          window.location.reload();
        }
      });
    } else {
      if (!sessionStorage.getItem('tablo-cache-bust-done')) {
        sessionStorage.setItem('tablo-cache-bust-done', 'true');
        window.location.reload();
      }
    }
  } else {
    sessionStorage.removeItem('tablo-cache-bust-done');
  }
})();
*/

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
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = t[key];
      } else {
        el.textContent = t[key];
      }
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