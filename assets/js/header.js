// ============================================
// Tablo — Global Header Component
// ============================================

(function() {
  'use strict';

  var SETTINGS_MODAL_OPEN = false;
  var BEFORE_INSTALL_PROMPT = null;

  // Translation cache
  window.TABLO_TRANSLATIONS = window.TABLO_TRANSLATIONS || {};

  function getAssetBase() {
    // Always use relative ./assets/ from current location
    return './assets/';
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
    return 'en';
  }

  function getDefaultTheme() {
    var saved = localStorage.getItem('tablo-theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function tr(key) {
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS[lang];
    if (t && t[key]) return t[key];
    // Fallback to English
    var en = window.TABLO_TRANSLATIONS['en'];
    if (en && en[key]) return en[key];
    return key;
  }

  function loadTranslations(lang, callback) {
    if (window.TABLO_TRANSLATIONS[lang]) {
      if (callback) callback();
      return;
    }
    var base = getAssetBase();
    var url = base + 'js/translations/' + lang + '.json';
    console.log('Loading translations from:', url);
    fetch(url)
      .then(function(response) {
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        return response.json();
      })
      .then(function(data) {
        window.TABLO_TRANSLATIONS[lang] = data;
        console.log('Loaded translations for:', lang);
        if (callback) callback();
      })
      .catch(function(error) {
        console.error('Failed to load translations for', lang, ':', error);
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
    var container = document.getElementById('tablo-header');
    if (!container) return;

    var currentLang = getDefaultLang();
    var currentTheme = getDefaultTheme();

    var html = '<div class="header"><div class="header-content">' +
      '<div class="header-left">' +
      '<a href="./" class="logo-link">' +
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

    var langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.value = currentLang;
      langSelect.addEventListener('change', function() {
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
      });
    }

    var settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', openSettingsModal);
    }
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

    var currentLang = getDefaultLang();
    var currentTheme = getDefaultTheme();
    var currentGame = getCurrentGame();

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

    var installSection = '';
    if ('serviceWorker' in navigator && BEFORE_INSTALL_PROMPT) {
      installSection = '<div class="settings-section"><div class="settings-section-title">' + tr('install_app') + '</div>' +
        '<button id="btn-install-app" class="game-btn primary">' + tr('btn_install') + '</button></div>';
    }

    var inviteSection = '';
    if (currentGame === 'connect4' || currentGame === 'dots' || currentGame === 'tictactoe' || currentGame === 'chess') {
      inviteSection = '<div class="settings-section"><div class="settings-section-title">' + tr('invite_friend') + '</div>' +
        '<p class="settings-rules-text">' + tr('invite_desc') + '</p>' +
        '<button id="btn-invite" class="game-btn primary">' + tr('btn_copy_link') + '</button></div>';
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
      '<p class="settings-info-note" style="color: var(--text-secondary); font-size: 12px; margin-bottom: 16px;">' + tr('stats_storage_note') + '</p>' +
      '<div class="settings-actions-row">' +
      '<button id="btn-import-stats" class="game-btn">' + tr('btn_import') + '</button>' +
      '<input type="file" id="import-file-input" accept=".json" style="display: none;">' +
      '<button id="btn-export-stats" class="game-btn primary">' + tr('btn_download') + '</button></div></div>' +
      inviteSection +
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

    var inviteBtn = modal.querySelector('#btn-invite');
    if (inviteBtn) {
      inviteBtn.addEventListener('click', function() {
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
      sudoku: 'share_text_sudoku'
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
    var stats = {};
    var games = ['memory', 'connect4', 'dots', 'tictactoe', 'simon', 'slider', 'lights', 'whack', 'snake', '2048', 'wordle', 'spot', 'hex', 'chess', 'sudoku'];
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
    showToast('Statistics exported successfully!');
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
        showToast('Statistics imported successfully! (' + count + ' values)');
        setTimeout(function() {
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error('Failed to parse stats file:', err);
        showToast('Invalid file format!');
      }
    };
    reader.onerror = function() {
      showToast('Error reading file!');
    };
    reader.readAsText(file);
  }

  function init() {
    var currentLang = getDefaultLang();
    loadTranslations(currentLang, function() {
      renderHeader();
      if (typeof window.applyTabloTranslations === 'function') {
        window.applyTabloTranslations();
      }
    });
    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      BEFORE_INSTALL_PROMPT = e;
    });
    window.addEventListener('appinstalled', function() {
      showToast(tr('install_prompt'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();