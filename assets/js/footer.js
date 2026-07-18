// ============================================
// Tablo — Footer Component
// ============================================

(function() {
  'use strict';

  var FOOTER_TEMPLATE = function(config) {
    var channelBadge = config.channel === 'beta' ? '<span class="channel-badge beta">BETA</span>' : '<span class="channel-badge stable">STABLE</span>';
    var today = new Date();
    var dateStr = String(today.getDate()).padStart(2, '0') + '/' + String(today.getMonth() + 1).padStart(2, '0') + '/' + today.getFullYear();

    return '<div class="tablo-footer">' +
      '<div class="footer-left">' +
        '<span class="version">' + config.version + '</span>' +
        ' ' + channelBadge +
        ' <span class="last-updated">• ' + dateStr + '</span>' +
      '</div>' +
      '<div class="footer-center">' +
        '<span class="made-by">' + tr('footer_made_by_prefix', 'Made with 🤍 by') + '</span> ' +
        '<span class="author">Christos Koulaxizis</span>' +
        ' • <span class="slogan">' + tr('footer_motto', 'Play freely, enjoy life.') + '</span>' +
      '</div>' +
      '<div class="footer-right">' +
        '<span class="privacy-badge">' + tr('footer_privacy_badge', 'Open Source · No Tracking · No Ads · Privacy First') + '</span>' +
      '</div>' +
    '</div>';
  };

  function tr(key, fallback) {
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
    return t ? (t[key] || fallback || key) : (fallback || key);
  }

  function renderFooter() {
    var container = document.getElementById('tablo-footer');
    if (!container) {
      console.warn('[Footer] Container not found');
      return;
    }

    console.log('[Footer] Initializing...');

    // Wait for translations
    var maxAttempts = 50;
    var attempt = 0;

    function tryRender() {
      attempt++;
      var hasTranslations = window.TABLO_TRANSLATIONS && typeof window.TABLO_TRANSLATIONS === 'object';
      console.log('[Footer] Waiting for translations... attempt ' + attempt + ' / ' + maxAttempts + ' hasTranslations:', hasTranslations);

      if (hasTranslations) {
        console.log('[Footer] Proceeding to render. Translations: true');
        console.log('[Footer] Rendering with version: ' + (window.TABLO_CONFIG && window.TABLO_CONFIG.version || '0.4.0') + ' channel: ' + (window.TABLO_CONFIG && window.TABLO_CONFIG.channel || 'beta'));

        var config = {
          version: window.TABLO_CONFIG && window.TABLO_CONFIG.version || '0.4.0',
          channel: window.TABLO_CONFIG && window.TABLO_CONFIG.channel || 'beta'
        };

        container.innerHTML = FOOTER_TEMPLATE(config);
        
        applyTranslations();
        
        console.log('[Footer] Footer rendered successfully');
        return;
      }

      if (attempt < maxAttempts) {
        setTimeout(tryRender, 100);
      } else {
        console.warn('[Footer] Timeout waiting for translations');
        var config = {
          version: window.TABLO_CONFIG && window.TABLO_CONFIG.version || '0.4.0',
          channel: window.TABLO_CONFIG && window.TABLO_CONFIG.channel || 'beta'
        };
        container.innerHTML = FOOTER_TEMPLATE(config);
      }
    }

    tryRender();
  }

  function applyTranslations() {
    var container = document.getElementById('tablo-footer');
    if (!container) return;

    var elements = container.querySelectorAll('[data-i18n]');
    elements.forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      var lang = localStorage.getItem('tablo-language') || 'en';
      var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
      if (t && t[key]) {
        el.textContent = t[key];
      }
    });
  }

  document.addEventListener('DOMContentLoaded', renderFooter);

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    document.addEventListener('lumo-translations-loaded', applyTranslations);
  }

  window.renderTabloFooter = renderFooter;
})();