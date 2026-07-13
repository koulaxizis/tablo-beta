// ============================================
// Tablo — Global Footer Component (FIXED)
// ============================================

(function() {
  'use strict';

  function getDefaultLang() {
    var saved = localStorage.getItem('tablo-language');
    if (saved) return saved;
    var sys = navigator.language || navigator.userLanguage || 'en';
    var shortSys = sys.split('-')[0];
    var langs = ['en', 'el', 'es', 'it', 'fr', 'de'];
    if (langs.indexOf(shortSys) !== -1) return shortSys;
    return 'en';
  }

  function tr(key) {
    if (!window.TABLO_TRANSLATIONS) return key;
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS[lang];
    if (!t) return key;
    return t[key] || key;
  }

  function getLastUpdatedDate() {
    var today = new Date();
    var day = String(today.getDate()).padStart(2, '0');
    var month = String(today.getMonth() + 1).padStart(2, '0');
    var year = today.getFullYear();
    return day + '/' + month + '/' + year;
  }

  function renderFooter() {
    var container = document.getElementById('tablo-footer');
    if (!container) return;

    var currentLang = getDefaultLang();
    var date = getLastUpdatedDate();
    var version = window.TABLO_CONFIG ? window.TABLO_CONFIG.version : '0.3.0';
    var channel = window.TABLO_CONFIG ? window.TABLO_CONFIG.channel : 'beta';

    var html = '<footer class="sticky-footer"><div class="footer-content">' +
      // LEFT: Privacy Badge (Fork Awesome icon + text)
      '<div class="footer-left">' +
      '<i class="fa fa-shield" aria-hidden="true"></i>' +
      '<span class="privacy-badge" data-i18n="footer_privacy_badge">Open Source · No Tracking · No Ads · Privacy First</span>' +
      '</div>' +
      // CENTER: Motto
      '<div class="footer-center">' +
      '<p class="footer-motto" data-i18n="footer_motto">Play freely, enjoy life.</p>' +
      '</div>' +
      // RIGHT: Version + Channel + Date
      '<div class="footer-right">' +
      '<div class="version-info">' +
      '<span class="version-number">v' + version + '</span>' +
      '<span class="channel-badge ' + channel + '">· ' + channel.toUpperCase() + '</span>' +
      '</div>' +
      '<span class="last-updated">' + date + '</span>' +
      '</div>' +
      '</div></footer>';

    container.innerHTML = html;

    // Apply translations after render
    setTimeout(function() {
      document.querySelectorAll('.footer-content [data-i18n]').forEach(function(el) {
        var key = el.getAttribute('data-i18n');
        if (tr(key)) {
          el.textContent = tr(key);
        }
      });
    }, 0);
  }

  function init() {
    renderFooter();

    // Watch for language changes
    window.addEventListener('tablo:languageChanged', function(e) {
      renderFooter();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();