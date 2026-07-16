// ============================================
// Tablo — Global Footer Component
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
    if (!container) {
      console.error('[Footer] Container not found!');
      return;
    }

    var date = getLastUpdatedDate();
    var version = window.TABLO_CONFIG ? window.TABLO_CONFIG.version : '0.3.0';
    var channel = window.TABLO_CONFIG ? window.TABLO_CONFIG.channel : 'beta';

    console.log('[Footer] Rendering with version:', version, 'channel:', channel);
    console.log('[Footer] Translations available:', !!window.TABLO_TRANSLATIONS);

    var html = '<footer class="sticky-footer"><div class="footer-content">' +
      '<div class="footer-left">' +
      '<p class="footer-motto" data-i18n="footer_motto">Play freely, enjoy life.</p>' +
      '<span class="privacy-badge" data-i18n="footer_privacy_badge">Open Source · No Tracking · No Ads · Privacy First</span>' +
      '</div>' +
      '<div class="footer-center">' +
      '<span class="made-by"><span data-i18n="footer_made_by_prefix">Made with 🤍 by</span> ' +
      '<a href="https://koulaxizis.gr" target="_blank" rel="noopener noreferrer">Christos Koulaxizis</a></span>' +
      '</div>' +
      '<div class="footer-right">' +
      '<div class="version-info">' +
      '<span class="version-number">v' + version + '</span>' +
      '<span class="channel-badge ' + channel + '">' + channel.toUpperCase() + '</span>' +
      '</div>' +
      '<span class="last-updated">' + date + '</span>' +
      '</div>' +
      '</div></footer>';

    container.innerHTML = html;

    // Apply translations NOW
    setTimeout(function() {
      console.log('[Footer] Applying translations...');
      var elements = document.querySelectorAll('.footer-content [data-i18n]');
      console.log('[Footer] Found', elements.length, 'elements to translate');
      elements.forEach(function(el) {
        var key = el.getAttribute('data-i18n');
        var translation = tr(key);
        console.log('[Footer]', key, '->', translation);
        el.textContent = translation;
      });
    }, 50);
  }

  function waitForTranslationsAndRender() {
    var maxAttempts = 50;
    var attempts = 0;
    var interval = setInterval(function() {
      attempts++;
      var lang = getDefaultLang();
      var hasTranslations = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
      
      console.log('[Footer] Waiting for translations... attempt', attempts, '/', maxAttempts, 'hasTranslations:', hasTranslations);
      
      if (hasTranslations || attempts >= maxAttempts) {
        clearInterval(interval);
        console.log('[Footer] Proceeding to render. Translations:', !!hasTranslations);
        renderFooter();
      }
    }, 100);
  }

  function init() {
    console.log('[Footer] Initializing...');
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        console.log('[Footer] DOMContentLoaded fired');
        waitForTranslationsAndRender();
      });
    } else {
      console.log('[Footer] DOM already ready');
      waitForTranslationsAndRender();
    }

    window.addEventListener('tablo:languageChanged', function() {
      console.log('[Footer] Language changed event received');
      renderFooter();
    });
  }

  console.log('[Footer] Script loaded');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();