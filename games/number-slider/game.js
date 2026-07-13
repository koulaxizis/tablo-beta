// ============================================
// Tablo — Number Slider (Fixed persistence)
// ============================================

(function() {
  'use strict';

  var SIZE = 4;
  var board = [];
  var emptyPos = { row: 0, col: 0 };
  var moves = 0;
  var gameActive = false;
  var timerInterval = null;
  var secondsElapsed = 0;

  var boardEl = document.getElementById('slider-board');
  var movesEl = document.getElementById('moves');
  var timeEl = document.getElementById('time');
  var bestEl = document.getElementById('best-score');
  var sizeSelect = document.getElementById('slider-size');
  var newGameBtn = document.getElementById('btn-new-game');
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
    setTimeout(function() { toast.classList.remove('visible'); }, 2000);
  }

  function initBoard() {
    board = [];
    var values = [];
    var total = SIZE * SIZE - 1;

    for (var i = 0; i <= total; i++) values.push(i);
    values.sort(function() { return Math.random() - 0.5; });

    var idx = 0;
    for (var r = 0; r < SIZE; r++) {
      board[r] = [];
      for (var c = 0; c < SIZE; c++) {
        if (idx < values.length) {
          board[r][c] = values[idx++];
        }
      }
    }

    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (board[r][c] === 0) {
          emptyPos.row = r;
          emptyPos.col = c;
        }
      }
    }
  }

  function saveState() {
    var state = {
      board: board.map(function(row) { return row.slice(); }),
      emptyPos: { row: emptyPos.row, col: emptyPos.col },
      moves: moves,
      seconds: secondsElapsed,
      size: SIZE
    };
    localStorage.setItem('tablo-slider-state', JSON.stringify(state));
  }

  function loadState() {
    var saved = localStorage.getItem('tablo-slider-state');
    if (saved) {
      try {
        var state = JSON.parse(saved);
        if (state.size === SIZE) {
          board = state.board;
          emptyPos = state.emptyPos;
          moves = state.moves;
          secondsElapsed = state.seconds;
          return true;
        }
      } catch (e) {}
    }
    return false;
  }

  function clearSaved() {
    localStorage.removeItem('tablo-slider-state');
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    var cellSize = (boardEl.offsetWidth - (SIZE + 1) * 4) / SIZE;

    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var cell = document.createElement('div');
        cell.className = 'slide-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;

        if (board[r][c] !== 0) {
          cell.textContent = board[r][c];
          cell.addEventListener('click', function(e) {
            handleCellClick(parseInt(e.currentTarget.dataset.r), parseInt(e.currentTarget.dataset.c));
          });
        }

        boardEl.appendChild(cell);
      }
    }

    if (movesEl) movesEl.textContent = moves;
  }

  function handleCellClick(r, c) {
    if (!gameActive) return;

    var dr = Math.abs(emptyPos.row - r);
    var dc = Math.abs(emptyPos.col - c);

    if (dr + dc === 1) {
      board[emptyPos.row][emptyPos.col] = board[r][c];
      board[r][c] = 0;
      emptyPos.row = r;
      emptyPos.col = c;
      moves++;
      saveState();
      renderBoard();
      checkWin();
    }
  }

  function checkWin() {
    var total = SIZE * SIZE - 1;
    var correct = true;
    var count = 1;

    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (r === SIZE - 1 && c === SIZE - 1) {
          if (board[r][c] !== 0) correct = false;
        } else {
          if (board[r][c] !== count) correct = false;
          count++;
        }
      }
    }

    if (correct) {
      endGame(true);
    }
  }

  function endGame(win) {
    gameActive = false;
    stopTimer();

    if (win) {
      var bestKey = 'tablo-slider-best-' + SIZE;
      var best = localStorage.getItem(bestKey);
      if (!best || moves < parseInt(best)) {
        localStorage.setItem(bestKey, moves.toString());
      }
      if (bestEl) bestEl.textContent = moves;
      clearSaved();
    }
  }

  function startTimer() {
    stopTimer();
    updateTimer();
    timerInterval = setInterval(function() {
      secondsElapsed++;
      updateTimer();
      saveState();
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }

  function updateTimer() {
    var mins = Math.floor(secondsElapsed / 60);
    var secs = secondsElapsed % 60;
    if (timeEl) timeEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function newSize(size) {
    SIZE = parseInt(size) || 4;
    clearSaved();
    initBoard();
    moves = 0;
    secondsElapsed = 0;
    gameActive = true;
    stopTimer();
    startTimer();
    renderBoard();
  }

  function newGame() {
    clearSaved();
    initBoard();
    moves = 0;
    secondsElapsed = 0;
    gameActive = true;
    stopTimer();
    startTimer();
    renderBoard();
    showToast(tr('toast_restarted'));
  }

  function initGame() {
    var savedLoaded = loadState();
    if (!savedLoaded) {
      initBoard();
      moves = 0;
      secondsElapsed = 0;
    }
    gameActive = true;
    startTimer();
    renderBoard();

    var bestKey = 'tablo-slider-best-' + SIZE;
    var best = localStorage.getItem(bestKey);
    if (bestEl) bestEl.textContent = best || '--';

    if (sizeSelect) {
      sizeSelect.addEventListener('change', function() {
        newSize(this.value);
      });
    }

    if (newGameBtn) {
      newGameBtn.addEventListener('click', newGame);
    }

    window.addEventListener('beforeunload', function() {
      if (gameActive) saveState();
    });
  }

  window.initGame = initGame;
})();