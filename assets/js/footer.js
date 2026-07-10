// ============================================
// tablo — Global Footer
// ============================================

(function() {
  'use strict';

  function injectFooter() {
    var footerEl = document.getElementById('tablo-footer');
    if (!footerEl) return;

    var version = (window.TABLO_CONFIG && window.TABLO_CONFIG.version) || '0.1.0';
    var channel = (window.TABLO_CONFIG && window.TABLO_CONFIG.channel) || 'beta';

    footerEl.innerHTML =
      '<footer class="footer">' +
        '<div class="footer-content">' +
          '<div class="footer-left">' +
            '<span class="footer-badge" data-i18n="footer_privacy_badge">Open Source · No Tracking · No Ads · Privacy First</span>' +
          '</div>' +
          '<div class="footer-center">' +
            '<span class="footer-credits">\u00A9 2026 <a href="https://koulaxizis.gr" target="_blank" rel="noopener" class="footer-link">Christos Koulaxizis</a> · <span data-i18n="footer_motto">Play freely, enjoy life</span></span>' +
          '</div>' +
          '<div class="footer-right">' +
            '<span class="footer-version">' + version + '</span>' +
            (channel === 'beta' ? '<span class="channel-badge beta">BETA</span>' : '') +
            (channel === 'stable' ? '<span class="channel-badge stable">STABLE</span>' : '') +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  // Run when DOM ready or immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFooter);
  } else {
    injectFooter();
  }

})();