// ============================================
// Tablo — Global Header
// ============================================

(function() {
  'use strict';

  function getBaseUrl() {
    var path = window.location.pathname;
    if (path.endsWith('index.html') || path === '/') {
      return './assets/images/favicon.svg';
    } else if (path.includes('/games/')) {
      return '../../assets/images/favicon.svg';
    }
    return './assets/images/favicon.svg';
  }

  function injectHeader() {
    var headerEl = document.getElementById('tablo-header');
    if (!headerEl) return;

    var faviconPath = getBaseUrl();
    var homeLink = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' ? '#' : '../index.html';

    headerEl.innerHTML =
      '<header class="header">' +
        '<div class="header-content">' +
          '<div class="header-left">' +
            '<a href="' + homeLink + '" class="logo-link">' +
              '<img src="' + faviconPath + '" alt="Tablo" class="logo-icon" />' +
              '<span class="logo-text">Tablo</span>' +
            '</a>' +
          '</div>' +
          '<div class="header-right">' +
            '<select id="language-select" class="lang-select" aria-label="Language"></select>' +
            '<button id="btn-settings" class="header-btn" data-i18n-aria="aria_settings" aria-label="Settings" title="Settings"><i class="fa fa-cog"></i></button>' +
            '<button id="theme-toggle" class="header-btn" data-i18n-aria="aria_theme_toggle" aria-label="Toggle theme" title="Toggle theme"><i class="fa fa-sun-o"></i></button>' +
          '</div>' +
        '</div>' +
      '</header>';

    initLanguageSelect();
    initThemeToggle();
  }

  // ... (keep rest of functions: initLanguageSelect, getSystemLanguage, applyTranslations, initThemeToggle, updateThemeIcon)

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
  } else {
    injectHeader();
  }

})();