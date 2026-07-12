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

  function getCurrentGame() {
    var path = window.location.pathname;
    if (path.indexOf('memory-match') !== -1) return 'memory';
    if (path.indexOf('connect4') !== -1) return 'connect4';
    if (path.indexOf('dots-and-lines') !== -1) return 'dots';
    return 'home';
  }

  function isPvPGame() {
    var g = getCurrentGame();
    return g === 'connect4' || g === 'dots';
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
            '<a href="' + homeLink + '" class="logo-link" id="tablo-logo-link">' +
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

  function tr(key) {
    var lang = localStorage.getItem('tablo-language') || getSystemLanguage();
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
    return t ? (t[key] || key) : key;
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

    // Update dynamic settings content
    updateSettingsContent();
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

  // ============================================
  // SETTINGS MODAL — COMPLETE WITH ALL FEATURES
  // ============================================

  var settingsModal = null;

  function initSettingsModal(prefix) {
    var settingsBtn = document.getElementById('btn-settings');
    if (!settingsBtn) return;

    var game = getCurrentGame();
    var showInvite = isPvPGame();

    settingsModal = document.createElement('div');
    settingsModal.className = 'settings-modal';
    settingsModal.id = 'tablo-settings-modal';
    settingsModal.innerHTML =
      '<div class="settings-modal-overlay"></div>' +
      '<div class="settings-modal-content">' +
        '<div class="settings-header">' +
          '<h2 data-i18n="settings">' + tr('settings') + '</h2>' +
          '<button class="settings-close" id="settings-close-btn">&times;</button>' +
        '</div>' +
        '<div class="settings-body" id="settings-body">' +

          // --- INSTALL ---
          '<div class="settings-section">' +
            '<div class="settings-section-title" data-i18n="install_prompt">' + tr('install_prompt') + '</div>' +
            '<div class="settings-row">' +
              '<span class="settings-label" data-i18n="install_app">' + tr('install_app') + '</span>' +
              '<button class="game-btn primary" id="btn-install-modal" disabled data-i18n="btn_install">' + tr('btn_install') + '</button>' +
            '</div>' +
          '</div>' +

          // --- SHARE SCORE ---
          '<div class="settings-section">' +
            '<div class="settings-section-title" data-i18n="share_scores">' + tr('share_scores') + '</div>' +
            '<div class="settings-share-buttons">' +
              '<button class="share-btn" id="btn-share-native" data-i18n="share_native">' + tr('share_native') + '</button>' +
              '<button class="share-btn" id="btn-share-bluesky">Bluesky</button>' +
              '<button class="share-btn" id="btn-share-mastodon">Mastodon</button>' +
              '<button class="share-btn" id="btn-share-email" data-i18n="share_email">' + tr('share_email') + '</button>' +
            '</div>' +
          '</div>' +

          // --- EXPORT STATS ---
          '<div class="settings-section">' +
            '<div class="settings-section-title" data-i18n="export_stats">' + tr('export_stats') + '</div>' +
            '<div class="settings-row">' +
              '<span class="settings-label" data-i18n="export_stats_desc">' + tr('export_stats_desc') + '</span>' +
              '<button class="game-btn" id="btn-export-stats" data-i18n="btn_download">' + tr('btn_download') + '</button>' +
            '</div>' +
          '</div>' +

          // --- GAME RULES ---
          '<div class="settings-section">' +
            '<div class="settings-section-title" data-i18n="game_rules">' + tr('game_rules') + '</div>' +
            '<div class="settings-rules-text" id="game-rules-text"></div>' +
          '</div>' +

          // --- INVITE FRIEND (PvP only) ---
          (showInvite ?
            '<div class="settings-section">' +
              '<div class="settings-section-title" data-i18n="invite_friend">' + tr('invite_friend') + '</div>' +
              '<div class="settings-row">' +
                '<span class="settings-label" data-i18n="invite_desc">' + tr('invite_desc') + '</span>' +
                '<button class="game-btn" id="btn-invite" data-i18n="btn_copy_link">' + tr('btn_copy_link') + '</button>' +
              '</div>' +
            '</div>'
          : '') +

        '</div>' +
      '</div>';

    document.body.appendChild(settingsModal);

    // --- MODAL OPEN/CLOSE ---
    settingsBtn.addEventListener('click', function() {
      settingsModal.classList.add('visible');
      updateSettingsContent();
    });

    document.getElementById('settings-close-btn').addEventListener('click', function() {
      settingsModal.classList.remove('visible');
    });

    settingsModal.querySelector('.settings-modal-overlay').addEventListener('click', function() {
      settingsModal.classList.remove('visible');
    });

    // --- INSTALL HANDLER ---
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

    // --- SHARE SCORE ---
    initShareButtons();

    // --- EXPORT STATS ---
    document.getElementById('btn-export-stats').addEventListener('click', exportStats);

    // --- INVITE FRIEND ---
    if (showInvite) {
      document.getElementById('btn-invite').addEventListener('click', copyInviteLink);
    }
  }

  function updateSettingsContent() {
    if (!settingsModal) return;

    // Update all data-i18n elements inside modal
    var lang = localStorage.getItem('tablo-language') || getSystemLanguage();
    var translations = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
    if (!translations) return;

    settingsModal.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      if (translations[key]) el.textContent = translations[key];
    });

    // Update rules text
    var rulesEl = document.getElementById('game-rules-text');
    if (rulesEl) {
      var game = getCurrentGame();
      var rulesKey = 'rules_' + game;
      rulesEl.textContent = translations[rulesKey] || translations['rules_home'] || '';
    }
  }

  // ============================================
  // SHARE SCORE LOGIC
  // ============================================

  function buildShareText() {
    var game = getCurrentGame();
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];

    var gameName = t ? (t['game_' + game + '_name'] || 'Tablo') : 'Tablo';
    var baseUrl = window.location.origin + '/tablo-beta/';
    var gameUrl = baseUrl;

    if (game !== 'home') {
      gameUrl = baseUrl + 'games/' + game + '/';
      if (game === 'connect4') gameUrl = baseUrl + 'games/connect4/index.html';
      if (game === 'dots') gameUrl = baseUrl + 'games/dots-and-lines/index.html';
      if (game === 'memory') gameUrl = baseUrl + 'games/memory-match/index.html';
    }

    var text = '';

    if (game === 'memory') {
      var best = localStorage.getItem('tablo-memory-best') || '--';
      text = (t ? t['share_text_memory'] : 'My best score on Memory Match:') + ' ' + best + '\n';
    } else if (game === 'connect4') {
      var wins = localStorage.getItem('tablo-connect4-wins') || '0/0';
      var parts = wins.split('/');
      text = (t ? t['share_text_connect4'] : 'My Connect 4 score:') + ' P1 ' + parts[0] + ' - P2 ' + parts[1] + '\n';
    } else if (game === 'dots') {
      text = (t ? t['share_text_dots'] : 'Playing Dots & Lines on Tablo!') + '\n';
    } else {
      text = (t ? t['share_text_home'] : 'Playing mini board games on Tablo!') + '\n';
    }

    text += gameUrl;
    return text;
  }

  function initShareButtons() {
    // Native Share (mobile)
    var nativeBtn = document.getElementById('btn-share-native');
    if (nativeBtn) {
      if (!navigator.share) {
        nativeBtn.style.display = 'none';
      } else {
        nativeBtn.addEventListener('click', function() {
          var text = buildShareText();
          navigator.share({
            title: 'Tablo Games',
            text: text
          }).catch(function() {});
        });
      }
    }

    // Bluesky
    var bskyBtn = document.getElementById('btn-share-bluesky');
    if (bskyBtn) {
      bskyBtn.addEventListener('click', function() {
        var text = encodeURIComponent(buildShareText());
        window.open('https://bsky.app/intent/compose?text=' + text, '_blank');
      });
    }

    // Mastodon
    var mastoBtn = document.getElementById('btn-share-mastodon');
    if (mastoBtn) {
      mastoBtn.addEventListener('click', function() {
        var text = buildShareText();
        var instance = prompt('Mastodon instance (e.g. mastodon.social):', 'mastodon.social');
        if (instance) {
          var encoded = encodeURIComponent(text);
          window.open('https://' + instance.replace(/https?:\/\//, '') + '/share?text=' + encoded, '_blank');
        }
      });
    }

    // Email
    var emailBtn = document.getElementById('btn-share-email');
    if (emailBtn) {
      emailBtn.addEventListener('click', function() {
        var text = buildShareText();
        var subject = encodeURIComponent('Tablo Games');
        var body = encodeURIComponent(text);
        window.open('mailto:?subject=' + subject + '&body=' + body);
      });
    }
  }

  // ============================================
  // EXPORT STATS LOGIC
  // ============================================

  function exportStats() {
    var stats = {
      export_date: new Date().toISOString(),
      app: 'Tablo',
      version: (window.TABLO_CONFIG ? window.TABLO_CONFIG.version : '0.1.0'),
      games: {}
    };

    // Memory Match
    var memBest = localStorage.getItem('tablo-memory-best');
    if (memBest) {
      var parts = memBest.split('/');
      stats.games.memory_match = {
        best_time_seconds: parseInt(parts[0]) || 0,
        best_moves: parseInt(parts[1]) || 0
      };
    }

    // Connect 4
    var c4Wins = localStorage.getItem('tablo-connect4-wins');
    if (c4Wins) {
      var c4Parts = c4Wins.split('/');
      stats.games.connect4 = {
        wins_player1: parseInt(c4Parts[0]) || 0,
        wins_player2: parseInt(c4Parts[1]) || 0
      };
    }

    // Dots & Lines — check if we have stored stats
    var dWins = localStorage.getItem('tablo-dots-wins');
    if (dWins) {
      var dParts = dWins.split('/');
      stats.games.dots_and_lines = {
        wins_player1: parseInt(dParts[0]) || 0,
        wins_player2: parseInt(dParts[1]) || 0
      };
    }

    // Language & theme preferences
    stats.preferences = {
      language: localStorage.getItem('tablo-language') || 'en',
      theme: localStorage.getItem('tablo-theme') || 'dark'
    };

    var blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'tablo-stats-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ============================================
  // INVITE LINK LOGIC (PvP only)
  // ============================================

  function copyInviteLink() {
    var gameUrl = window.location.href.split('?')[0];
    var inviteUrl = gameUrl + '?join=' + Date.now().toString(36);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteUrl).then(function() {
        showToastInModal(tr('invite_link_copied'));
      }).catch(function() {
        fallbackCopy(inviteUrl);
      });
    } else {
      fallbackCopy(inviteUrl);
    }
  }

  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToastInModal(tr('invite_link_copied'));
    } catch (e) {
      showToastInModal(tr('invite_copy_failed'));
    }
    document.body.removeChild(textarea);
  }

  function showToastInModal(message) {
    var existing = document.getElementById('settings-toast');
    if (existing) existing.remove();

    var toastEl = document.createElement('div');
    toastEl.id = 'settings-toast';
    toastEl.className = 'settings-toast';
    toastEl.textContent = message;
    settingsModal.querySelector('.settings-modal-content').appendChild(toastEl);

    setTimeout(function() {
      toastEl.classList.add('visible');
    }, 10);

    setTimeout(function() {
      toastEl.classList.remove('visible');
      setTimeout(function() {
        toastEl.remove();
      }, 300);
    }, 2500);
  }

  // ============================================
  // INIT
  // ============================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
  } else {
    injectHeader();
  }

})();