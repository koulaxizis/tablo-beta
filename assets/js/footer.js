// ============================================
// Tablo — Footer Component
// ============================================

(function() {
  'use strict';

  console.log('[Footer] Script loaded');

  function getPrefix() {
    if (window.TABLO_CONFIG && window.TABLO_CONFIG.baseHref) {
      return window.TABLO_CONFIG.baseHref;
    }
    var path = window.location.pathname;
    if (path.includes('/games/')) return '../';
    return './';
  }

  function getChannelBadge(channel) {
    if (channel === 'beta') {
      return '<span class="channel-badge beta">BETA</span>';
    }
    return '<span class="channel-badge stable">STABLE</span>';
  }

  function getDateStr() {
    var today = new Date();
    var d = String(today.getDate()).padStart(2, '0');
    var m = String(today.getMonth() + 1).padStart(2, '0');
    var y = today.getFullYear();
    return d + '/' + m + '/' + y;
  }

  function getFooterHTML() {
    var version = (window.TABLO_CONFIG && window.TABLO_CONFIG.version) || '0.4.0';
    var channel = (window.TABLO_CONFIG && window.TABLO_CONFIG.channel) || 'beta';
    var prefix = getPrefix();

    return '<div class="tablo-footer">' +
      '<div class="footer-left">' +
        '<span class="version">v' + version + '</span>' +
        getChannelBadge(channel) +
        '<span class="last-updated">' + getDateStr() + '</span>' +
      '</div>' +
      '<div class="footer-center">' +
        '<span data-i18n="footer_made_by_prefix">Made with \u{1F495} by</span> ' +
        '<a href="https://koulaxizis.gr" class="footer-author" target="_blank" rel="noopener">Christos Koulaxizis</a>' +
        '<span class="footer-sep">\u2022</span>' +
        '<span data-i18n="footer_motto">Play freely, enjoy life.</span>' +
      '</div>' +
      '<div class="footer-right">' +
        '<span data-i18n="footer_privacy_badge">Open Source \u00B7 No Tracking \u00B7 No Ads \u00B7 Privacy First</span>' +
      '</div>' +
    '</div>';
  }

  function applyTranslations() {
    var container = document.getElementById('tablo-footer');
    if (!container) return;

    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];

    if (!t) {
      console.log('[Footer] Translations not available');
      return;
    }

    var elements = container.querySelectorAll('[data-i18n]');
    console.log('[Footer] Applying translations...');
    console.log('[Footer] Found ' + elements.length + ' elements to translate');
    elements.forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      if (t[key]) {
        el.textContent = t[key];
        console.log('[Footer] ' + key + ' -> ' + t[key]);
      }
    });
  }

  function renderFooter() {
    var container = document.getElementById('tablo-footer');
    if (!container) {
      console.warn('[Footer] Container not found');
      return;
    }

    console.log('[Footer] Initializing...');

    if (document.readyState === 'loading') {
      console.log('[Footer] DOM not ready, waiting...');
    } else {
      console.log('[Footer] DOM already ready');
    }

    var maxAttempts = 50;
    var attempt = 0;

    function tryRender() {
      attempt++;
      var hasTranslations = window.TABLO_TRANSLATIONS && typeof window.TABLO_TRANSED === 'object';
      hasTranslations = window.TABLO_TRANSLATIONS && typeof window.TABLO_TRANSLATIONS === 'object';
      console.log('[Footer] Waiting for translations... attempt ' + attempt + ' / ' + maxAttempts + ' hasTranslations:', hasTranslations);

      if (hasTranslations) {
        var version = (window.TABLO_CONFIG && window.TABLO_CONFIG.version) || '0.4.0';
        var channel = (window.TABLO_CONFIG && window.TABLO_CONFIG.channel) || 'beta';
        console.log('[Footer] Rendering with version: ' + version + ' channel: ' + channel);
        console.log('[Footer] Translations available: true');

        container.innerHTML = getFooterHTML();
        applyTranslations();
        return;
      }

      if (attempt < maxAttempts) {
        setTimeout(tryRender, 100);
      } else {
        console.warn('[Footer] Timeout waiting for translations, rendering with defaults');
        container.innerHTML = getFooterHTML();
      }
    }

    tryRender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderFooter);
  } else {
    renderFooter();
  }

  document.addEventListener('tablo-language-changed', function() {
    console.log('[Footer] Language changed event received');
    renderFooter();
  });

  window.renderTabloFooter = renderFooter;
})();