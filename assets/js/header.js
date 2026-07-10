// ============================================
// tablo — Global Header
// ============================================

(function() {
  'use strict';

  // Run immediately if DOM already ready
  function injectHeader() {
    var headerEl = document.getElementById('tablo-header');
    if (!headerEl) return;

    var isRootPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');

    var homeLink = isRootPage ? '#' : '../index.html';

    headerEl.innerHTML =
      '<header class="header">' +
        '<div class="header-content">' +
          '<div class="header-left">' +
            '<a href="' + homeLink + '" class="logo-link">' +
              '<img src="../assets/images/favicon.svg" alt="tablo" class="logo-icon" />' +
              '<span class="logo-text">tablo</span>' +
            '</a>' +
          '</div>' +
          '<div class="header-right">' +
            '<select id="language-select" class="lang-select" aria-label="Language"></select>' +
            '<button id="btn-settings" class="header-btn" data-i18n-aria="aria_settings" aria-label="Settings" title="Settings"><i class="fa fa-cog"></i></button>' +
            '<button id="theme-toggle" class="header-btn" data-i18n-aria="aria_theme_toggle" aria-label="Toggle theme" title="Toggle theme"><i class="fa fa-sun-o"></i></button>' +
          '</div>' +
        '</div>' +
      '</header>';

    // Initialize language selector
    initLanguageSelect();
  }

  function initLanguageSelect() {
    var langSelect = document.getElementById('language-select');
    if (!langSelect) return;

    var currentLang = localStorage.getItem('tablo-language') || getSystemLanguage();
    var supported = ['el', 'en', 'es', 'it', 'fr', 'de'];

    supported.forEach(function(code) {
      var opt = document.createElement('option');
      opt.value = code;
      opt.textContent = code.toUpperCase();
      if (code === currentLang) opt.selected = true;
      langSelect.appendChild(opt);
    });

    langSelect.value = currentLang;

    langSelect.addEventListener('change', function() {
      var lang = this.value;
      localStorage.setItem('tablo-language', lang);
      applyTranslations();
    });

    // Apply initial translation
    applyTranslations();
  }

  function getSystemLanguage() {
    var navLang = (navigator.language || navigator.userLanguage || 'en').substring(0, 2).toLowerCase();
    var supported = ['el', 'en', 'es', 'it', 'fr', 'de'];
    return supported.indexOf(navLang) !== -1 ? navLang : 'en';
  }

  function applyTranslations() {
    var lang = localStorage.getItem('tablo-language') || 'en';
    var translations = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
    if (!translations) return;

    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      if (translations[key]) el.textContent = translations[key];
    });

    document.querySelectorAll('[data-i18n-tooltip]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-tooltip');
      if (translations[key]) el.title = translations[key];
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-aria');
      if (translations[key]) el.setAttribute('aria-label', translations[key]);
    });

    // Dispatch language change event
    window.dispatchEvent(new CustomEvent('tablo-lang-changed', {
      detail: { lang: lang }
    }));
  }

  // Theme toggle
  function initThemeToggle() {
    var themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    var currentTheme = localStorage.getItem('tablo-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);

    updateThemeIcon(themeToggle, currentTheme);

    themeToggle.addEventListener('click', function() {
      var current = document.documentElement.getAttribute('data-theme') || 'dark';
      var newTheme = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('tablo-theme', newTheme);
      updateThemeIcon(themeToggle, newTheme);
    });
  }

  function updateThemeIcon(btn, theme) {
    var icon = btn.querySelector('i');
    if (icon) {
      icon.className = theme === 'light' ? 'fa fa-moon-o' : 'fa fa-sun-o';
    }
  }

  // Run when DOM ready or immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
  } else {
    injectHeader();
  }

  initThemeToggle();

})();