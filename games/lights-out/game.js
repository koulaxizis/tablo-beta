// ============================================
// Tablo — Lights Out
// ============================================

(function() {
  'use strict';

  var GRID_SIZE = 5;
  var board = [];
  var moves = 0;
  var level = 1;

  var boardEl = document.getElementById('board');
  var movesEl = document.getElementById('moves');
  var levelEl = document.getElementById('level');
  var bestEl = document.getElementById('best-score');
  var newGameBtn = document.getElementById('btn-new-game');
  var hintBtn = document.getElementById('btn-hint');
  var winnerModal = document.getElementById('winner-modal');
  var winnerStats = document.getElementById('winner-stats');
  var nextLevelBtn = document.getElementById('btn-next-level');
  var toast = document.getElementById('toast');

  function tr(key) {
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
    return t ? (t[key] || key) : key;
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = tr(msg);
    toast.classList.add('visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function() {
      toast.classList.remove('visible');
    }, 2500);
  }

  function initBoard() {
    board = [];
    for (var r = 0; r < GRID_SIZE; r++) {
      board[r] = [];
      for (var c = 0; c < GRID_SIZE; c++) {
        board[r][c] = false;
      }
    }
  }

  function toggleCell(r, c) {
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      board[r][c] = !board[r][c];
    }
  }

  function clickCell(r, c) {
    toggleCell(r, c);
    toggleCell(r - 1, c);
    toggleCell(r + 1, c);
    toggleCell(r, c - 1);
    toggleCell(r, c + 1);
    moves++;
    if (movesEl) movesEl.textContent = moves;
    renderBoard();

    if (checkSolved()) {
      onSolved();
    }
  }

  function checkSolved() {
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        if (board[r][c]) return false;
      }
    }
    return true;
  }

  function shuffleBoard() {
    var numShuffles = 3 + level * 2;
    for (var i = 0; i < numShuffles; i++) {
      var r = Math.floor(Math.random() * GRID_SIZE);
      var c = Math.floor(Math.random() * GRID_SIZE);
      toggleCell(r, c);
      toggleCell(r - 1, c);
      toggleCell(r + 1, c);
      toggleCell(r, c - 1);
      toggleCell(r, c + 1);
    }
    if (checkSolved()) {
      shuffleBoard();
    }
  }

  function renderBoard() {
    if (!boardEl) return;
    boardEl.innerHTML = '';
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        var cell = document.createElement('div');
        cell.className = 'light-cell' + (board[r][c] ? ' on' : '');
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.addEventListener('click', function(e) {
          clickCell(parseInt(e.currentTarget.dataset.r), parseInt(e.currentTarget.dataset.c));
        });
        boardEl.appendChild(cell);
      }
    }
  }

  function updateBest() {
    var best = localStorage.getItem('tablo-lights-best');
    if (bestEl) bestEl.textContent = best || '--';
  }

  function onSolved() {
    var best = localStorage.getItem('tablo-lights-best');
    if (!best || level > parseInt(best)) {
      localStorage.setItem('tablo-lights-best', level.toString());
      updateBest();
    }
    if (winnerStats) {
      winnerStats.textContent = tr('lights_moves') + ': ' + moves + ' · ' + tr('lights_level') + ': ' + level;
    }
    winnerModal.classList.add('visible');
  }

  function newGame() {
    moves = 0;
    if (movesEl) movesEl.textContent = '0';
    if (levelEl) levelEl.textContent = level;
    winnerModal.classList.remove('visible');

    initBoard();
    shuffleBoard();
    renderBoard();
  }

  function nextLevel() {
    level++;
    newGame();
  }

  function showHint() {
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        if (board[r][c]) {
          var cells = document.querySelectorAll('.light-cell');
          var idx = r * GRID_SIZE + c;
          if (cells[idx]) {
            cells[idx].classList.add('hint');
            (function(cell) {
              setTimeout(function() {
                cell.classList.remove('hint');
              }, 1500);
            })(cells[idx]);
          }
          showToast('lights_hint');
          return;
        }
      }
    }
  }

  function initGame() {
    level = 1;
    updateBest();
    newGame();

    if (newGameBtn) {
      newGameBtn.addEventListener('click', function() {
        level = 1;
        newGame();
        showToast('toast_restarted');
      });
    }

    if (hintBtn) {
      hintBtn.addEventListener('click', showHint);
    }

    if (nextLevelBtn) {
      nextLevelBtn.addEventListener('click', nextLevel);
    }
  }

  window.initGame = initGame;
})();