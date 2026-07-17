// ============================================
// Tablo — Global Header Component
// ============================================

(function() {
  'use strict';

  var SETTINGS_MODAL_OPEN = false;
  var BEFORE_INSTALL_PROMPT = null;

  window.TABLO_TRANSLATIONS = window.TABLO_TRANSLATIONS || {};

  var GAME_DIRS = [
    'memory-match', 'connect4', 'dots-and-lines', 'tic-tac-toe',
    'simon-says', 'number-slider', 'lights-out', 'whack-a-mole',
    'snake', '2048', 'wordle', 'spot-the-difference',
    'hexagon-puzzle', 'chess', 'sudoku',
    'tetris', 'minesweeper', 'mahjong', 'puzzle', 'bubble-shooter'
  ];

  console.log('[Header] Script loaded');

  function getPathPrefix() {
    console.log('[Header] getPathPrefix() called');
    if (window.TABLO_CONFIG && window.TABLO_CONFIG.baseHref) {
      console.log('[Header] Using baseHref:', window.TABLO_CONFIG.baseHref);
      return window.TABLO_CONFIG.baseHref;
    }
    var path = window.location.pathname;
    console.log('[Header] Current path:', path);
    if (path.indexOf('/index.html') !== -1) {
      path = path.substring(0, path.indexOf('/index.html'));
    }
    path = path.replace(/\/+$/, '');
    var segments = path.split('/').filter(function(s) { return s.length > 0; });
    var last = segments.length > 0 ? segments[segments.length - 1] : '';

    console.log('[Header] Last segment:', last);

    if (GAME_DIRS.indexOf(last) !== -1) {
      console.log('[Header] Is game page, returning ../../');
      return '../../';
    }
    console.log('[Header] Not game page, returning ./');
    return './';
  }

  function getCurrentGame() {
    var path = window.location.pathname;
    console.log('[Header] getCurrentGame() - path:', path);
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
    if (path.indexOf('/tetris/') !== -1) return 'tetris';
    if (path.indexOf('/minesweeper/') !== -1) return 'minesweeper';
    if (path.indexOf('/mahjong/') !== -1) return 'mahjong';
    if (path.indexOf('/puzzle/') !== -1) return 'puzzle';
    if (path.indexOf('/bubble-shooter/') !== -1) return 'bubble';
    console.log('[Header] No game detected');
    return null;
  }

  function getDefaultLang() {
    var saved = localStorage.getItem('tablo-language');
    if (saved) {
      console.log('[Header] Using saved lang:', saved);
      return saved;
    }
    var sys = navigator.language || navigator.userLanguage || 'en';
    var shortSys = sys.split('-')[0];
    var langs = ['en', 'el', 'es', 'it', 'fr', 'de'];
    if (langs.indexOf(shortSys) !== -1) {
      console.log('[Header] Using system lang:', shortSys);
      return shortSys;
    }
    console.log('[Header] Defaulting to en');
    return 'en';
  }

  function getDefaultTheme() {
    var saved = localStorage.getItem('tablo-theme');
    if (saved) {
      console.log('[Header] Using saved theme:', saved);
      return saved;
    }
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = prefersDark ? 'dark' : 'light';
    console.log('[Header] Using system theme:', theme);
    return theme;
  }

  function tr(key) {
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS[lang];
    if (t && t[key]) return t[key];
    var en = window.TABLO_TRANSLATIONS['en'];
    if (en && en[key]) return en[key];
    return key;
  }

  function loadTranslations(lang, callback) {
    console.log('[Header] loadTranslations(', lang, ') called');
    if (window.TABLO_TRANSLATIONS[lang]) {
      console.log('[Header] Translations already cached for', lang);
      if (callback) callback();
      setTimeout(function() {
        window.dispatchEvent(new CustomEvent('tablo:translationsLoaded'));
      }, 10);
      return;
    }
    var prefix = getPathPrefix();
    var url = prefix + 'assets/js/translations/' + lang + '.json';
    console.log('[Header] Fetching translations from:', url);
    fetch(url)
      .then(function(response) {
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        return response.json();
      })
      .then(function(data) {
        console.log('[Header] Successfully loaded translations for', lang);
        window.TABLO_TRANSLATIONS[lang] = data;
        if (callback) callback();
        setTimeout(function() {
          window.dispatchEvent(new CustomEvent('tablo:translationsLoaded'));
        }, 10);
      })
      .catch(function(error) {
        console.error('[Header] Failed to load translations for', lang, ':', error);
        if (callback) callback();
      });
  }

  function themeIconSvg(theme) {
    if (theme === 'dark') {
      return '<svg class="header-icon-svg" viewBox="0 0 24 24"><use href="#icon-sun"/></svg>';
    }
    return '<svg class="header-icon-svg" viewBox="0 0 24 24"><use href="#icon-moon"/></svg>';
  }

  function renderHeader() {
    console.log('[Header] renderHeader() called');
    var container = document.getElementById('tablo-header');
    if (!container) {
      console.error('[Header] ERROR: tablo-header container not found!');
      return;
    }
    console.log('[Header] Container found:', container);

    var prefix = getPathPrefix();
    var currentLang = getDefaultLang();
    var currentTheme = getDefaultTheme();

    console.log('[Header] Prefix:', prefix, 'Lang:', currentLang, 'Theme:', currentTheme);

    var html = '<div class="header"><div class="header-content">' +
      '<div class="header-left">' +
      '<a href="' + prefix + '" class="logo-link">' +
      '<svg class="logo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
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
      '</select>' +
      '<button id="theme-btn" class="header-btn" aria-label="' + tr('aria_theme_toggle') + '" title="' + tr('aria_theme_toggle') + '">' +
      themeIconSvg(currentTheme) + '</button>' +
      '<button id="settings-btn" class="header-btn" aria-label="' + tr('aria_settings') + '" title="' + tr('tooltip_settings') + '">' +
      '<svg class="header-icon-svg" viewBox="0 0 24 24"><use href="#icon-settings"/></svg></button>' +
      '</div></div></div>';

    container.innerHTML = html;
    document.documentElement.setAttribute('data-theme', currentTheme);

    console.log('[Header] Header HTML injected');

    var langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.value = currentLang;
      langSelect.addEventListener('change', function() {
        console.log('[Header] Language changed to:', this.value);
        localStorage.setItem('tablo-language', this.value);
        loadTranslations(this.value, function() {
          if (typeof window.applyTabloTranslations === 'function') {
            window.applyTabloTranslations();
          }
          setTimeout(function() {
            window.dispatchEvent(new CustomEvent('tablo:languageChanged'));
          }, 50);
        });
      });
    } else {
      console.error('[Header] ERROR: lang-select element not found!');
    }

    var themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', function() {
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        var newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('tablo-theme', newTheme);
        themeBtn.innerHTML = themeIconSvg(newTheme);
        updateSettingsModalThemeUI(newTheme);
        console.log('[Header] Theme changed to:', newTheme);
      });
    } else {
      console.error('[Header] ERROR: theme-btn element not found!');
    }

    var settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', openSettingsModal);
    } else {
      console.error('[Header] ERROR: settings-btn element not found!');
    }

    console.log('[Header] Event listeners attached');
  }

  function updateSettingsModalThemeUI(newTheme) {
    var modal = document.getElementById('tablo-settings-modal');
    if (!modal) return;
    var toggleBtn = modal.querySelector('#toggle-theme');
    if (toggleBtn) {
      toggleBtn.textContent = tr(newTheme === 'dark' ? 'theme_light' : 'theme_dark');
    }
  }

  function openSettingsModal() {
    if (SETTINGS_MODAL_OPEN) return;
    SETTINGS_MODAL_OPEN = true;

    var currentTheme = getDefaultTheme();
    var currentGame = getCurrentGame();

    console.log('[Header] Opening settings modal for game:', currentGame);

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
      currentGame === 'sudoku' ? 'rules_sudoku' :
      currentGame === 'tetris' ? 'rules_tetris' :
      currentGame === 'minesweeper' ? 'rules_minesweeper' :
      currentGame === 'mahjong' ? 'rules_mahjong' :
      currentGame === 'puzzle' ? 'rules_puzzle' :
      currentGame === 'bubble' ? 'rules_bubble' : 'rules_home';

    var installSection = '';
    if ('serviceWorker' in navigator && BEFORE_INSTALL_PROMPT) {
      installSection = '<div class="settings-section"><div class="settings-section-title">' + tr('install_app') + '</div>' +
        '<button id="btn-install-app" class="game-btn primary">' + tr('btn_install') + '</button></div>';
    }

    var modal = document.createElement('div');
    modal.className = 'settings-modal';
    modal.id = 'tablo-settings-modal';

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
      '<p class="settings-rules-text" style="margin-bottom: 12px;">' + tr('export_stats_desc') + '</p>' +
      '<p class="settings-info-note" style="font-size: 12px; margin-bottom: 16px; line-height: 1.4;">' + tr('stats_storage_note') + '</p>' +
      '<div class="settings-actions-row">' +
      '<button id="btn-import-stats" class="game-btn">' + tr('btn_import') + '</button>' +
      '<input type="file" id="import-file-input" accept=".json" style="display: none;">' +
      '<button id="btn-export-stats" class="game-btn primary">' + tr('btn_download') + '</button></div></div>' +
      '<div class="settings-section"><div class="settings-section-title">' + tr('aria_theme_toggle') + '</div>' +
      '<div class="settings-row">' +
      '<button id="toggle-theme" class="game-btn">' + (currentTheme === 'dark' ? tr('theme_light') : tr('theme_dark')) + '</button></div></div>' +
      '</div></div>';

    document.body.appendChild(modal);
    setTimeout(function() { modal.classList.add('visible'); }, 10);

    modal.querySelector('.settings-modal-overlay').addEventListener('click', closeSettingsModal);
    modal.querySelector('#close-settings').addEventListener('click', closeSettingsModal);

    var installBtn = modal.querySelector('#btn-install-app');
    if (installBtn) {
      installBtn.addEventListener('click', function() {
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
    }

    modal.querySelectorAll('.share-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        shareScore(this.dataset.platform);
      });
    });

    var exportBtn = modal.querySelector('#btn-export-stats');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportStats);
    }

    var importBtn = modal.querySelector('#btn-import-stats');
    var fileInput = modal.querySelector('#import-file-input');
    if (importBtn && fileInput) {
      importBtn.addEventListener('click', function() {
        fileInput.click();
      });
      fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
          importStats(e.target.files[0]);
        }
      });
    }

    var toggleThemeBtn = modal.querySelector('#toggle-theme');
    if (toggleThemeBtn) {
      toggleThemeBtn.addEventListener('click', function() {
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        var newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('tablo-theme', newTheme);
        this.textContent = tr(isDark ? 'theme_dark' : 'theme_light');
        updateHeaderThemeButton(newTheme);
      });
    }
  }

  function updateHeaderThemeButton(newTheme) {
    var themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.innerHTML = themeIconSvg(newTheme);
    }
  }

  function closeSettingsModal() {
    var modal = document.getElementById('tablo-settings-modal');
    if (modal) {
      modal.classList.remove('visible');
      setTimeout(function() {
        if (document.body.contains(modal)) document.body.removeChild(modal);
        SETTINGS_MODAL_OPEN = false;
      }, 300);
    }
  }

  function showToast(msg) {
    console.log('[Header] Toast:', msg);
    var existing = document.querySelector('.tablo-toast');
    if (existing) {
      existing.textContent = msg;
      existing.classList.remove('visible');
      setTimeout(function() { existing.classList.add('visible'); }, 10);
      clearTimeout(existing._timeout);
      existing._timeout = setTimeout(function() {
        existing.classList.remove('visible');
      }, 2500);
      return;
    }
    var toast = document.createElement('div');
    toast.className = 'tablo-toast';
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
    var keys = {
      memory: 'share_text_memory', connect4: 'share_text_connect4',
      dots: 'share_text_dots', tictactoe: 'share_text_tictactoe',
      simon: 'share_text_simon', slider: 'share_text_slider',
      lights: 'share_text_lights', whack: 'share_text_whack',
      snake: 'share_text_snake', '2048': 'share_text_2048',
      wordle: 'share_text_wordle', spot: 'share_text_spot',
      hex: 'share_text_hex', chess: 'share_text_chess',
      sudoku: 'share_text_sudoku', tetris: 'share_text_tetris',
      minesweeper: 'share_text_minesweeper', mahjong: 'share_text_mahjong',
      puzzle: 'share_text_puzzle', bubble: 'share_text_bubble'
    };
    var key = keys[game] || 'share_text_home';
    return (t && t[key]) || 'Playing mini board games on Tablo!';
  }

  function shareScore(platform) {
    var text = getShareText();
    var url = window.location.href;
    if (platform === 'native' && navigator.share) {
      navigator.share({ title: 'Tablo Game', text: text, url: url }).catch(function() {});
    } else if (platform === 'bluesky') {
      window.open('https://bsky.app/intent/compose?text=' + encodeURIComponent(text + ' ' + url), '_blank');
    } else if (platform === 'mastodon') {
      window.open('https://mastodon.social/share?text=' + encodeURIComponent(text + ' ' + url), '_blank');
    } else if (platform === 'email') {
      window.location.href = 'mailto:?subject=Tablo Game&body=' + encodeURIComponent(text + '\n\n' + url);
    }
  }

  function exportStats() {
    console.log('[Header] Exporting stats...');
    var stats = {};
    var games = ['memory', 'connect4', 'dots', 'tictactoe', 'simon', 'slider', 'lights', 'whack', 'snake', '2048', 'wordle', 'spot', 'hex', 'chess', 'sudoku', 'tetris', 'minesweeper', 'mahjong', 'puzzle', 'bubble'];
    games.forEach(function(game) {
      var best = localStorage.getItem('tablo-' + game + '-best');
      var wins = localStorage.getItem('tablo-' + game + '-wins');
      if (best) stats[game + '-best'] = best;
      if (wins) stats[game + '-wins'] = wins;
    });
    stats.exportDate = new Date().toISOString().split('T')[0];
    var blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
    var dlUrl = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = dlUrl;
    link.download = 'tablo-stats-' + stats.exportDate + '.json';
    link.click();
    URL.revokeObjectURL(dlUrl);
    showToast(tr('toast_restarted'));
  }

  function importStats(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        var count = 0;
        Object.keys(data).forEach(function(key) {
          if (key !== 'exportDate') {
            localStorage.setItem('tablo-' + key, data[key]);
            count++;
          }
        });
        showToast(tr('toast_restarted'));
        setTimeout(function() {
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error('Failed to parse stats file:', err);
        showToast('Error!');
      }
    };
    reader.onerror = function() {
      showToast('Error!');
    };
    reader.readAsText(file);
  }

  function init() {
    console.log('[Header] Initializing...');
    console.log('[Header] TABLO_CONFIG:', window.TABLO_CONFIG);
    console.log('[Header] Current language:', getDefaultLang());
    console.log('[Header] Current theme:', getDefaultTheme());
    
    var currentLang = getDefaultLang();
    loadTranslations(currentLang, function() {
      console.log('[Header] Load translations callback fired');
      renderHeader();
      console.log('[Header] Rendered header');
      if (typeof window.applyTabloTranslations === 'function') {
        console.log('[Header] Calling applyTabloTranslations...');
        window.applyTabloTranslations();
      }
    });
    
    window.addEventListener('beforeinstallprompt', function(e) {
      console.log('[Header] beforeinstallprompt event fired');
      e.preventDefault();
      BEFORE_INSTALL_PROMPT = e;
    });
    
    window.addEventListener('appinstalled', function() {
      console.log('[Header] appinstalled event fired');
      showToast(tr('install_prompt'));
    });
    
    console.log('[Header] Init completed');
  }

  console.log('[Header] Attaching DOMContentLoaded listener');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    console.log('[Header] DOM already ready, calling init directly');
    init();
  }
})();