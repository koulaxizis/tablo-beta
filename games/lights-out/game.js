// ============================================
// Tablo — Lights Out
// ============================================

(function() {
  'use strict';

  var GRID_SIZE = 5;
  var board = [];
  var moves = 0;
  var level = 1;
  var hintsUsed = 0;

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
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function() { toast.classList.remove('visible'); }, 3000);
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
    movesEl.textContent = moves;
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
    // Start from solved state, apply random clicks
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
    // Make sure it's not already solved
    if (checkSolved()) {
      shuffleBoard();
    }
  }

  function renderBoard() {
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
    bestEl.textContent = best || '--';
  }

  function onSolved() {
    var best = localStorage.getItem('tablo-lights-best');
    if (!best || level > parseInt(best)) {
      localStorage.setItem('tablo-lights-best', level.toString());
      updateBest();
    }
    winnerStats.textContent = tr('lights_moves') + ': ' + moves + ' · ' + tr('lights_level') + ': ' + level;
    winnerModal.classList.add('visible');
  }

  function newGame() {
    moves = 0;
    hintsUsed = 0;
    movesEl.textContent = '0';
    levelEl.textContent = level;
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
    // Find first lit cell and suggest clicking it
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        if (board[r][c]) {
          hintsUsed++;
          var cells = document.querySelectorAll('.light-cell');
          var idx = r * GRID_SIZE + c;
          cells[idx].classList.add('hint');
          setTimeout(function() {
            cells[idx].classList.remove('hint');
          }, 1500);
          showToast(tr('lights_hint') + ' (' + (r + 1) + ',' + (c + 1) + ')');
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
        showToast(tr('toast_restarted'));
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