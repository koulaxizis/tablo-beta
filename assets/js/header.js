// ADD this function somewhere in header.js if not present
function getCurrentGame() {
  var path = window.location.pathname;
  if (path.indexOf('/memory-match/') !== -1) return 'memory';
  if (path.indexOf('/connect4/') !== -1) return 'connect4';
  if (path.indexOf('/dots-and-lines/') !== -1) return 'dots';
  if (path.indexOf('/tic-tac-toe/') !== -1) return 'tictactoe';
  if (path.indexOf('/simon-says/') !== -1) return 'simon';
  if (path.indexOf('/number-slider/') !== -1) return 'slider';
  if (path.indexOf('/sudoku/') !== -1) return 'sudoku';
  return null;
}

// Ensure applyTabloTranslations uses TABLO_TRANSLATIONS
window.applyTabloTranslations = function() {
  var lang = localStorage.getItem('tablo-language') || 'en';
  var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
  if (!t) return;

  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (t[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = t[key];
      } else {
        el.textContent = t[key];
      }
    }
  });

  // Update select options
  document.querySelectorAll('option[data-i18n]').forEach(function(opt) {
    var key = opt.getAttribute('data-i18n');
    if (t[key]) opt.textContent = t[key];
  });
};