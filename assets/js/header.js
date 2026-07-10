// ============================================
// Tablo — Global Header
// ============================================

(function() {
  'use strict';

  function getPathPrefix() {
    var path = window.location.pathname;
    if (path.indexOf('/games/') !== -1) {
      return '../../';
    }
    return './';
  }

  function injectHeader() {
    var headerEl = document.getElementById('tablo-header');
    if (!headerEl) return;

    var prefix = getPathPrefix();
    var homeLink = (prefix === '../../') ? '../../index.html' : '#';

    headerEl.innerHTML =
      '<header class="header">' +
        '<div class="header-content">' +
          '<div class="header-left">' +
            '<a href="' + homeLink + '" class="logo-link">' +
              '<img src="' + prefix + 'assets/images/favicon.svg" alt="Tablo" class="logo-icon" />' +
              '<span class="logo-text">Tablo</span>' +
            '</a>' +
          '</div>' +
          '<div class="header-right">' +
            '<select id="language-select" class="lang-select" aria-label="Language"></select>' +
            '<button id="btn-settings" class="header-btn" aria-label="Settings" title="Settings"><i class="fa fa-cog"></i></button>' +
            '<button id="theme-toggle" class="header-btn" aria-label="Toggle theme" title="Toggle theme"><i class="fa fa-sun-o"></i></button>' +
          '</div>' +
        '</div>' +
      '</header>';

    initLanguageSelect();
    initThemeToggle();
    initSettingsModal(prefix);
  }

  function getSystemLanguage() {
    var navLang = (navigator.language || navigator.userLanguage || 'en').substring(0, 2).toLowerCase();
    var supported = ['el', 'en', 'es', 'it', 'fr', 'de'];
    return supported.indexOf(navLang) !== -1 ? navLang : 'en';
  }

  function applyTranslations() {
    var lang = localStorage.getItem('tablo-language') || getSystemLanguage();
    var translations = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
    if (!translations) return;

    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      if (translations[key]) el.textContent = translations[key];
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-aria');
      if (translations[key]) el.setAttribute('aria-label', translations[key]);
    });
  }

  window.applyTabloTranslations = applyTranslations;

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
      localStorage.setItem('tablo-language', this.value);
      applyTranslations();
    });

    applyTranslations();
  }

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

  function initSettingsModal(prefix) {
    var settingsBtn = document.getElementById('btn-settings');
    if (!settingsBtn) return;

    var modal = document.createElement('div');
    modal.className = 'settings-modal';
    modal.id = 'tablo-settings-modal';
    modal.innerHTML =
      '<div class="settings-modal-overlay"></div>' +
      '<div class="settings-modal-content">' +
        '<div class="settings-header">' +
          '<h2 data-i18n="settings">Settings</h2>' +
          '<button class="settings-close">&times;</button>' +
        '</div>' +
        '<div class="settings-body">' +
          '<div class="settings-row">' +
            '<span class="settings-label" data-i18n="install_prompt">Install Tablo for offline play!</span>' +
            '<button class="game-btn primary" id="btn-install-modal" disabled data-i18n="btn_install">Install</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    settingsBtn.addEventListener('click', function() {
      modal.classList.add('visible');
    });

    modal.querySelector('.settings-close').addEventListener('click', function() {
      modal.classList.remove('visible');
    });

    modal.querySelector('.settings-modal-overlay').addEventListener('click', function() {
      modal.classList.remove('visible');
    });

    var deferredPrompt = null;
    var installBtn = document.getElementById('btn-install-modal');

    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      deferredPrompt = e;
      if (installBtn) installBtn.disabled = false;
    });

    if (installBtn) {
      installBtn.addEventListener('click', function() {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function() {
          deferredPrompt = null;
          installBtn.disabled = true;
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
  } else {
    injectHeader();
  }

})();