// ============================================
// Tablo — Central Configuration
// ============================================

window.TABLO_CONFIG = {
  version: '0.4.0',
  channel: 'beta',
  baseHref: '/tablo-beta/'
};

// ============================================
// Global Translation Applier (FIX #15)
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