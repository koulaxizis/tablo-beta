// ============================================
// Tablo — Minesweeper Game
// ============================================

(function() {
  'use strict';

  var COLS = 10;
  var ROWS = 10;
  var MINES = 10;

  var grid = [];
  var revealed = [];
  var flagged = [];
  var gameOver = false;
  var firstClick = true;
  var flagCount = 0;
  var revealedCount = 0;
  var timerInterval = null;
  var secondsElapsed = 0;

  var board, mineCountEl, flagCountEl, timerEl;
  var restartBtn, playAgainBtn, resultModal, resultTitle, resultIcon, resultMessage, toast;

  function tr(key) {
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
    return t ? (t[key] || key) : key;
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function() {
      toast.classList.remove('visible');
    }, 2000);
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function initGrid() {
    grid = [];
    revealed = [];
    flagged = [];
    for (var r = 0; r < ROWS; r++) {
      var g = [], rv = [], fl = [];
      for (var c = 0; c < COLS; c++) {
        g.push(0); rv.push(false); fl.push(false);
      }
      grid.push(g); revealed.push(rv); flagged.push(fl);
    }
  }

  function placeMines(excludeRow, excludeCol) {
    var placed = 0;
    while (placed < MINES) {
      var r = Math.floor(Math.random() * ROWS);
      var c = Math.floor(Math.random() * COLS);
      if (grid[r][c] === -1) continue;
      if (Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1) continue;
      grid[r][c] = -1;
      placed++;
    }
    calculateNumbers();
  }

  function calculateNumbers() {
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (grid[r][c] === -1) continue;
        var count = 0;
        for (var dr = -1; dr <= 1; dr++) {
          for (var dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            var nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === -1) count++;
          }
        }
        grid[r][c] = count;
      }
    }
  }

  function reveal(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (revealed[r][c] || flagged[r][c]) return;
    revealed[r][c] = true;
    revealedCount++;

    if (grid[r][c] === -1) {
      gameOver = true;
      revealAllMines();
      endGame(false);
      return;
    }

    if (grid[r][c] === 0) {
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          reveal(r + dr, c + dc);
        }
      }
    }

    renderCell(r, c);
    checkWin();
  }

  function revealAllMines() {
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (grid[r][c] === -1 && !flagged[r][c]) {
          revealed[r][c] = true;
          renderCell(r, c);
        }
      }
    }
  }

  function toggleFlag(r, c) {
    if (gameOver || revealed[r][c]) return;
    flagged[r][c] = !flagged[r][c];
    flagCount += flagged[r][c] ? 1 : -1;
    flagCountEl.textContent = flagCount;
    renderCell(r, c);
  }

  function renderCell(r, c) {
    var cell = board.children[r * COLS + c];
    if (!cell) return;
    cell.className = 'ms-cell';

    if (flagged[r][c] && !revealed[r][c]) {
      cell.classList.add('flagged');
      cell.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 3v18M5 4l10 3-4 4 4 4-10-1" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linejoin="round"/></svg>';
      return;
    }

    if (!revealed[r][c]) {
      cell.classList.add('hidden');
      cell.innerHTML = '';
      cell.removeAttribute('data-value');
      return;
    }

    cell.classList.add('revealed');

    if (grid[r][c] === -1) {
      cell.classList.add('mine');
      cell.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="5" fill="#1a1a2e"/><line x1="12" y1="4" x2="12" y2="7" stroke="#1a1a2e" stroke-width="2"/><line x1="12" y1="17" x2="12" y2="20" stroke="#1a1a2e" stroke-width="2"/><line x1="4" y1="12" x2="7" y2="12" stroke="#1a1a2e" stroke-width="2"/><line x1="17" y1="12" x2="20" y2="12" stroke="#1a1a2e" stroke-width="2"/></svg>';
      return;
    }

    if (grid[r][c] > 0) {
      cell.textContent = grid[r][c];
      cell.setAttribute('data-value', grid[r][c]);
    } else {
      cell.textContent = '';
    }
  }

  function renderBoard() {
    board.innerHTML = '';
    board.style.gridTemplateColumns = 'repeat(' + COLS + ', auto)';
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var cell = document.createElement('div');
        cell.className = 'ms-cell hidden';
        cell.dataset.row = r;
        cell.dataset.col = c;

        (function(row, col) {
          cell.addEventListener('click', function(e) {
            if (gameOver) return;
            if (firstClick) {
              firstClick = false;
              placeMines(row, col);
              startTimer();
            }
            if (flagged[row][col]) return;
            reveal(row, col);
          });

          cell.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            if (gameOver || firstClick) return;
            toggleFlag(row, col);
          });

          var pressTimer;
          cell.addEventListener('touchstart', function(e) {
            pressTimer = setTimeout(function() {
              if (!gameOver && !firstClick) toggleFlag(row, col);
            }, 500);
          }, { passive: true });

          cell.addEventListener('touchend', function(e) {
            clearTimeout(pressTimer);
          });

          cell.addEventListener('touchmove', function(e) {
            clearTimeout(pressTimer);
          });
        })(r, c);

        board.appendChild(cell);
      }
    }
  }

  function startTimer() {
    stopTimer();
    secondsElapsed = 0;
    timerEl.textContent = '00:00';
    timerInterval = setInterval(function() {
      secondsElapsed++;
      timerEl.textContent = formatTime(secondsElapsed);
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function checkWin() {
    if (gameOver) return;
    var totalSafeCells = ROWS * COLS - MINES;
    if (revealedCount === totalSafeCells) {
      gameOver = true;
      endGame(true);
    }
  }

  function endGame(won) {
    stopTimer();
    if (won) {
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          if (grid[r][c] === -1 && !flagged[r][c]) {
            flagged[r][c] = true;
            renderCell(r, c);
          }
        }
      }
      flagCount = MINES;
      flagCountEl.textContent = flagCount;

      var bestKey = 'tablo-minesweeper-best';
      var best = parseInt(localStorage.getItem(bestKey) || '999999');
      if (secondsElapsed < best) localStorage.setItem(bestKey, secondsElapsed);

      resultIcon.innerHTML = '&#127881;';
      resultTitle.textContent = tr('minesweeper_win');
      resultMessage.textContent = tr('minesweeper_time') + ': ' + formatTime(secondsElapsed);
    } else {
      resultIcon.innerHTML = '&#128162;';
      resultTitle.textContent = tr('minesweeper_loss');
      resultMessage.textContent = tr('minesweeper_time') + ': ' + formatTime(secondsElapsed);
    }
    resultModal.classList.add('visible');
    resultModal.style.display = 'flex';
  }

  function resetGame() {
    gameOver = false;
    firstClick = true;
    flagCount = 0;
    revealedCount = 0;
    stopTimer();
    timerEl.textContent = '00:00';
    flagCountEl.textContent = '0';
    mineCountEl.textContent = MINES;
    initGrid();
    renderBoard();
    resultModal.classList.remove('visible');
    resultModal.style.display = 'none';
  }

  function initGame() {
    board = document.getElementById('board');
    mineCountEl = document.getElementById('mine-count');
    flagCountEl = document.getElementById('flag-count');
    timerEl = document.getElementById('timer');
    restartBtn = document.getElementById('btn-restart');
    playAgainBtn = document.getElementById('btn-play-again');
    resultModal = document.getElementById('result-modal');
    resultTitle = document.getElementById('result-title');
    resultIcon = document.getElementById('result-icon');
    resultMessage = document.getElementById('result-message');
    toast = document.getElementById('toast');

    mineCountEl.textContent = MINES;

    if (restartBtn) {
      restartBtn.addEventListener('click', function() {
        resetGame();
        showToast(tr('toast_restarted'));
      });
    }

    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', function() {
        resetGame();
      });
    }

    resetGame();
  }

  window.initGame = initGame;
})();