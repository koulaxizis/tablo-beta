// ============================================
// Tablo — Global Header Component
// ============================================

(function() {
  'use strict';

  var SETTINGS_MODAL_OPEN = false;
  var SETTINGS_TIMEOUT_ID = null;
  var BEFORE_INSTALL_PROMPT = null;
  var TABLO_LOCALE = null;

  function getPathPrefix() {
    if (window.location.pathname.endsWith('/index.html')) {
      return './';
    } else if (window.location.pathname.endsWith('/')) {
      return './';
    }
    var pathParts = window.location.pathname.split('/');
    pathParts.pop();
    pathParts.pop();
    var prefix = pathParts.join('/');
    if (prefix === '') return './';
    return prefix + '/';
  }

  function getLangFromUrl() {
    var url = window.location.href;
    var langs = ['el', 'en', 'es', 'it', 'fr', 'de'];
    for (var i = 0; i < langs.length; i++) {
      if (url.indexOf('/' + langs[i] + '/') !== -1) return langs[i];
    }
    return 'en';
  }

  function getCurrentGame() {
    var path = window.location.pathname;
    if (path.indexOf('/memory-match/') !== -1) return 'memory';
    if (path.indexOf('/connect4/') !== -1) return 'connect4';
    if (path.indexOf('/dots-and-lines/') !== -1) return 'dots';
    if (path.indexOf('/tic-tac-toe/') !== -1) return 'tictactoe';
    if (path.indexOf('/simon-says/') !== -1) return 'simon';
    if (path.indexOf('/number-slider/') !== -1) return 'slider';
    if (path.indexOf('/lights-out/') !== -1) return 'lights';
    if (path.indexOf('/whack-a-mole/') !== -1) return 'whack';
    if (path.indexOf('/snake/') !== -1) return 'snake';
    if (path.indexOf('/2048/') !== -1) return '2048';
    if (path.indexOf('/wordle/') !== -1) return 'wordle';
    if (path.indexOf('/spot-the-difference/') !== -1) return 'spot';
    if (path.indexOf('/hexagon-puzzle/') !== -1) return 'hex';
    if (path.indexOf('/chess/') !== -1) return 'chess';
    if (path.indexOf('/sudoku/') !== -1) return 'sudoku';
    return null;
  }

  function getDefaultLang() {
    var saved = localStorage.getItem('tablo-language');
    if (saved) return saved;
    var sys = navigator.language || navigator.userLanguage || 'en';
    var shortSys = sys.split('-')[0];
    var langs = ['en', 'el', 'es', 'it', 'fr', 'de'];
    if (langs.indexOf(shortSys) !== -1) return shortSys;
    if (sys.toLowerCase().indexOf('el') !== -1) return 'el';
    return 'en';
  }

  function getDefaultTheme() {
    var saved = localStorage.getItem('tablo-theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function tr(key) {
    if (!window.TABLO_TRANSLATIONS) return key;
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS[lang];
    if (!t) return key;
    return t[key] || key;
  }

  function renderHeader() {
    var container = document.getElementById('tablo-header');
    if (!container) return;

    var pathPrefix = getPathPrefix();
    var currentLang = getDefaultLang();
    var currentTheme = getDefaultTheme();
    var gameName = getCurrentGame();
    var gameTitleMap = {
      memory: 'memory_match', connect4: 'connect_four', dots: 'dots_and_lines',
      tictactoe: 'tic_tac_toe', simon: 'simon_says', slider: 'number_slider',
      lights: 'lights_out', whack: 'whack_a_mole', snake: 'snake',
      '2048': '2048', wordle: 'wordle', spot: 'spot_the_difference',
      hex: 'hexagon_puzzle', chess: 'chess', sudoku: 'sudoku'
    };

    var html = '<div class="header"><div class="header-content">' +
      '<div class="header-left">' +
      '<a href="' + pathPrefix + 'index.html" class="logo-link">' +
      '<svg xmlns="http://www.w3.org/2000/svg" class="logo-icon" viewBox="0 0 40 40">' +
      '<rect x="5" y="5" width="30" height="30" rx="8" fill="none" stroke="#2dd4bf" stroke-width="3"/>' +
      '<rect x="12" y="12" width="16" height="16" rx="4" fill="#2dd4bf"/>' +
      '</svg>' +
      '<span class="logo-text">Tablo</span>' +
      '</a>' +
      '</div>' +
      '<div class="header-right">' +
      '<select id="lang-select" class="lang-select" aria-label="' + tr('aria_language') + '">' +
      '<option value="en" ' + (currentLang === 'en' ? 'selected' : '') + '>EN</option>' +
      '<option value="el" ' + (currentLang === 'el' ? 'selected' : '') + '>EL</option>' +
      '<option value="es" ' + (currentLang === 'es' ? 'selected' : '') + '>ES</option>' +
      '<option value="it" ' + (currentLang === 'it' ? 'selected' : '') + '>IT</option>' +
      '<option value="fr" ' + (currentLang === 'fr' ? 'selected' : '') + '>FR</option>' +
      '<option value="de" ' + (currentLang === 'de' ? 'selected' : '') + '>DE</option>' +
      '</select>';

    html += '<button id="theme-btn" class="header-btn" aria-label="' + tr('aria_theme_toggle') + '" title="' + tr('aria_theme_toggle') + '">' +
      '<i class="fa fa-' + (currentTheme === 'dark' ? 'sun-o' : 'moon-s') + '"></i></button>';

    if (!gameName || gameTitleMap[gameName]) {
      html += '<button id="settings-btn" class="header-btn" aria-label="' + tr('aria_settings') + '" title="' + tr('tooltip_settings') + '">' +
        '<i class="fa fa-cog"></i></button>';
    }

    html += '</div></div></div>';
    container.innerHTML = html;

    document.documentElement.setAttribute('data-theme', currentTheme);

    var langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.value = currentLang;
      langSelect.addEventListener('change', function() {
        localStorage.setItem('tablo-language', this.value);
        if (typeof window.applyTabloTranslations === 'function') {
          window.applyTabloTranslations();
        }
        if (typeof updateAllPagesTranslations === 'function') {
          updateAllPagesTranslations(this.value);
        }
      });
    }

    var themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', function() {
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        var newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('tablo-theme', newTheme);
        themeBtn.innerHTML = '<i class="fa fa-' + (newTheme === 'dark' ? 'sun-o' : 'moon-s') + '"></i>';
      });
    }

    var settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', openSettingsModal);
    }
  }

  function openSettingsModal() {
    if (SETTINGS_MODAL_OPEN) return;
    SETTINGS_MODAL_OPEN = true;
    clearTimeout(SETTINGS_TIMEOUT_ID);

    var currentLang = getDefaultLang();
    var currentTheme = getDefaultTheme();

    var modal = document.createElement('div');
    modal.className = 'settings-modal';
    modal.id = 'tablo-settings-modal';

    var installSection = '';
    if ('serviceWorker' in navigator && 'beforeinstallprompt' in window) {
      installSection = '<div class="settings-section"><div class="settings-section-title">' + tr('install_app') + '</div>' +
        '<button id="btn-install-app" class="game-btn primary">' + tr('btn_install') + '</button></div>';
    }

    var rulesKey = currentGame === 'memory' ? 'rules_memory' :
      currentGame === 'connect4' ? 'rules_connect4' :
      currentGame === 'dots' ? 'rules_dots' :
      currentGame === 'tictactoe' ? 'rules_tictactoe' :
      currentGame === 'simon' ? 'rules_simon' :
      currentGame === 'slider' ? 'rules_slider' :
      currentGame === 'lights' ? 'rules_lights' :
      currentGame === 'whack' ? 'rules_whack' :
      currentGame === 'snake' ? 'rules_snake' :
      currentGame === '2048' ? 'rules_2048' :
      currentGame === 'wordle' ? 'rules_wordle' :
      currentGame === 'spot' ? 'rules_spot' :
      currentGame === 'hex' ? 'rules_hex' :
      currentGame === 'chess' ? 'rules_chess' :
      currentGame === 'sudoku' ? 'rules_sudoku' : 'rules_home';

    var inviteSection = '';
    if (currentGame === 'connect4' || currentGame === 'dots' || currentGame === 'tictactoe' || currentGame === 'chess') {
      inviteSection = '<div class="settings-section"><div class="settings-section-title">' + tr('invite_friend') + '</div>' +
        '<p class="settings-rules-text">' + tr('invite_desc') + '</p>' +
        '<button id="btn-invite" class="game-btn primary">' + tr('btn_copy_link') + '</button></div>';
    }

    modal.innerHTML = '<div class="settings-modal-overlay"></div>' +
      '<div class="settings-modal-content">' +
      '<div class="settings-header"><h2>' + tr('settings') + '</h2>' +
      '<button id="close-settings" class="settings-close">&times;</button></div>' +
      '<div class="settings-body">' +
      '<div class="settings-section"><div class="settings-section-title">' + tr('game_rules') + '</div>' +
      '<div class="settings-rules-text">' + tr(rulesKey) + '</div></div>' +
      installSection +
      '<div class="settings-section"><div class="settings-section-title">' + tr('share_scores') + '</div>' +
      '<div class="settings-share-buttons">' +
      '<button class="share-btn" data-platform="native">' + tr('share_native') + '</button>' +
      '<button class="share-btn" data-platform="bluesky">BlueSky</button>' +
      '<button class="share-btn" data-platform="mastodon">Mastodon</button>' +
      '<button class="share-btn" data-platform="email">' + tr('share_email') + '</button></div></div>' +
      '<div class="settings-section"><div class="settings-section-title">' + tr('export_stats') + '</div>' +
      '<p class="settings-rules-text">' + tr('export_stats_desc') + '</p>' +
      '<button id="btn-export-stats" class="game-btn primary">' + tr('btn_download') + '</button></div>' +
      inviteSection +
      '<div class="settings-section"><div class="settings-section-title">' + tr('aria_theme_toggle') + '</div>' +
      '<div class="settings-row">' +
      '<span class="settings-label">' + (currentTheme === 'dark' ? tr('theme_dark') : tr('theme_light')) + '</span>' +
      '<button id="toggle-theme" class="game-btn">' + (currentTheme === 'dark' ? tr('theme_light') : tr('theme_dark')) + '</button></div></div>' +
      '</div></div>';

    document.body.appendChild(modal);
    setTimeout(function() { modal.classList.add('visible'); }, 10);

    modal.querySelector('.settings-modal-overlay').addEventListener('click', closeSettingsModal);
    modal.querySelector('#close-settings').addEventListener('click', closeSettingsModal);

    modal.querySelector('#btn-install-app')?.addEventListener('click', function() {
      if (BEFORE_INSTALL_PROMPT) {
        BEFORE_INSTALL_PROMPT.prompt();
        BEFORE_INSTALL_PROMPT.userChoice.then(function(result) {
          if (result.outcome === 'accepted') {
            showToast(tr('install_prompt'));
          }
          BEFORE_INSTALL_PROMPT = null;
        });
      }
    });

    modal.querySelector('#btn-invite')?.addEventListener('click', function() {
      var url = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function() {
          showToast(tr('invite_link_copied'));
        }).catch(function() {
          showToast(tr('invite_copy_failed'));
        });
      } else {
        var ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(tr('invite_link_copied'));
      }
    });

    modal.querySelectorAll('.share-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        shareScore(this.dataset.platform);
      });
    });

    modal.querySelector('#btn-export-stats')?.addEventListener('click', function() {
      exportStats();
    });

    modal.querySelector('#toggle-theme')?.addEventListener('click', function() {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      var newTheme = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('tablo-theme', newTheme);
      this.textContent = isDark ? tr('theme_dark') : tr('theme_light');
    });

    SETTINGS_TIMEOUT_ID = setTimeout(closeSettingsModal, 0);
  }

  function closeSettingsModal() {
    var modal = document.getElementById('tablo-settings-modal');
    if (modal) {
      modal.classList.remove('visible');
      setTimeout(function() {
        document.body.removeChild(modal);
        SETTINGS_MODAL_OPEN = false;
      }, 300);
    }
  }

  function showToast(msg) {
    var existing = document.querySelector('.settings-toast');
    if (existing) document.body.removeChild(existing);

    var toast = document.createElement('div');
    toast.className = 'settings-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(function() { toast.classList.add('visible'); }, 10);
    setTimeout(function() {
      toast.classList.remove('visible');
      setTimeout(function() {
        if (document.body.contains(toast)) document.body.removeChild(toast);
      }, 300);
    }, 2500);
  }

  function getShareText() {
    var game = getCurrentGame();
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];

    if (game === 'memory') return t && t.share_text_memory || 'My best score on Memory Match:';
    if (game === 'connect4') return t && t.share_text_connect4 || 'My Connect 4 score:';
    if (game === 'dots') return t && t.share_text_dots || 'Playing Dots & Lines on Tablo!';
    if (game === 'tictactoe') return t && t.share_text_tictactoe || 'Playing Tic-Tac-Toe on Tablo!';
    if (game === 'simon') return t && t.share_text_simon || 'My best score on Simon Says:';
    if (game === 'slider') return t && t.share_text_slider || 'My best score on Number Slider:';
    if (game === 'lights') return t && t.share_text_lights || 'My best score on Lights Out:';
    if (game === 'whack') return t && t.share_text_whack || 'My Whack-a-Mole score:';
    if (game === 'snake') return t && t.share_text_snake || 'My Snake score:';
    if (game === '2048') return t && t.share_text_2048 || 'My 2048 score:';
    if (game === 'wordle') return t && t.share_text_wordle || 'My Wordle streak:';
    if (game === 'spot') return t && t.share_text_spot || 'My Spot the Difference time:';
    if (game === 'hex') return t && t.share_text_hex || 'My Hexagon Puzzle moves:';
    if (game === 'chess') return t && t.share_text_chess || 'Playing Chess on Tablo!';
    if (game === 'sudoku') return t && t.share_text_sudoku || 'My Sudoku time:';
    return t && t.share_text_home || 'Playing mini board games on Tablo!';
  }

  function shareScore(platform) {
    var text = getShareText();
    var url = window.location.href;

    if (platform === 'native' && navigator.share) {
      navigator.share({ title: 'Tablo Game', text: text, url: url }).catch(function() {});
    } else if (platform === 'bluesky') {
      var blueskyUrl = 'https://bsky.app/intent/compose?text=' + encodeURIComponent(text + ' ' + url);
      window.open(blueskyUrl, '_blank');
    } else if (platform === 'mastodon') {
      var mastodonUrl = 'https://mastodon.social/share?text=' + encodeURIComponent(text + ' ' + url);
      window.open(mastodonUrl, '_blank');
    } else if (platform === 'email') {
      var mailtoUrl = 'mailto:?subject=Tablo Game&body=' + encodeURIComponent(text + '\n\n' + url);
      window.location.href = mailtoUrl;
    }
  }

  function exportStats() {
    var stats = {};
    var games = ['memory', 'connect4', 'dots', 'tictactoe', 'simon', 'slider', 'lights', 'whack', 'snake', '2048', 'wordle', 'spot', 'hex', 'chess', 'sudoku'];

    games.forEach(function(game) {
      var bestKey = 'tablo-' + game + '-best';
      var statValue = localStorage.getItem(bestKey) || null;
      if (statValue) stats[game] = statValue;
    });

    stats.exportDate = new Date().toISOString().split('T')[0];

    var blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'tablo-stats-' + stats.exportDate + '.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function getCurrentGame() {
    var path = window.location.pathname;
    if (path.indexOf('/memory-match/') !== -1) return 'memory';
    if (path.indexOf('/connect4/') !== -1) return 'connect4';
    if (path.indexOf('/dots-and-lines/') !== -1) return 'dots';
    if (path.indexOf('/tic-tac-toe/') !== -1) return 'tictactoe';
    if (path.indexOf('/simon-says/') !== -1) return 'simon';
    if (path.indexOf('/number-slider/') !== -1) return 'slider';
    if (path.indexOf('/lights-out/') !== -1) return 'lights';
    if (path.indexOf('/whack-a-mole/') !== -1) return 'whack';
    if (path.indexOf('/snake/') !== -1) return 'snake';
    if (path.indexOf('/2048/') !== -1) return '2048';
    if (path.indexOf('/wordle/') !== -1) return 'wordle';
    if (path.indexOf('/spot-the-difference/') !== -1) return 'spot';
    if (path.indexOf('/hexagon-puzzle/') !== -1) return 'hex';
    if (path.indexOf('/chess/') !== -1) return 'chess';
    if (path.indexOf('/sudoku/') !== -1) return 'sudoku';
    return null;
  }

  function init() {
    renderHeader();

    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      BEFORE_INSTALL_PROMPT = e;
    });

    window.addEventListener('appinstalled', function() {
      showToast(tr('install_prompt'));
    });

    if (typeof window.applyTabloTranslations === 'function') {
      window.applyTabloTranslations();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();