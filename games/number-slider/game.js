// ============================================
// Tablo — Number Slider
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

  var boardEl = document.getElementById('board');
  var movesEl = document.getElementById('moves');
  var timeEl = document.getElementById('timer');
  var bestEl = document.getElementById('best-score');
  var sizeSelect = document.getElementById('grid-size');
  var newGameBtn = document.getElementById('btn-new-game');
  var playAgainBtn = document.getElementById('btn-play-again');
  var winnerModal = document.getElementById('winner-modal');
  var finalMovesEl = document.getElementById('final-moves');
  var finalTimeEl = document.getElementById('final-time');
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
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function() {
      toast.classList.remove('visible');
    }, 2500);
  }

  function initBoard() {
    board = [];
    var values = [];
    var total = SIZE * SIZE - 1;

    for (var i = 0; i <= total; i++) values.push(i);
    
    // Shuffle until solvable (simple random shuffle for now)
    do {
      values.sort(function() { return Math.random() - 0.5; });
    } while (!isSolvable(values));

    var idx = 0;
    for (var r = 0; r < SIZE; r++) {
      board[r] = [];
      for (var c = 0; c < SIZE; c++) {
        board[r][c] = values[idx++];
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

  function isSolvable(arr) {
    var inversions = 0;
    var emptyRow = 0;
    
    for (var i = 0; i < arr.length - 1; i++) {
      if (arr[i] === 0) continue;
      for (var j = i + 1; j < arr.length; j++) {
        if (arr[j] === 0) continue;
        if (arr[i] > arr[j]) inversions++;
      }
    }
    
    var gridWidth = SIZE;
    if (gridWidth % 2 !== 0) {
      return inversions % 2 === 0;
    } else {
      emptyRow = Math.floor((arr.indexOf(0)) / gridWidth);
      if (emptyRow % 2 === 0) {
        return inversions % 2 !== 0;
      } else {
        return inversions % 2 === 0;
      }
    }
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    boardEl.className = 'slider-board grid-' + SIZE;

    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var cell = document.createElement('div');
        cell.className = 'tile';
        cell.dataset.r = r;
        cell.dataset.c = c;

        if (board[r][c] !== 0) {
          cell.textContent = board[r][c];
          cell.classList.add('movable');
          cell.addEventListener('click', function(e) {
            handleCellClick(parseInt(e.currentTarget.dataset.r), parseInt(e.currentTarget.dataset.c));
          });
        } else {
          cell.classList.add('empty');
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
      renderBoard();
      checkWin();
    }
  }

  function checkWin() {
    var count = 1;
    var correct = true;

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
      
      if (finalMovesEl) finalMovesEl.textContent = moves;
      if (finalTimeEl) finalTimeEl.textContent = formatTime(secondsElapsed);
      winnerModal.classList.add('visible');
    }
  }

  function formatTime(sec) {
    var mins = Math.floor(sec / 60);
    var secs = sec % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function startTimer() {
    stopTimer();
    updateTimer();
    timerInterval = setInterval(function() {
      secondsElapsed++;
      updateTimer();
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }

  function updateTimer() {
    if (timeEl) timeEl.textContent = formatTime(secondsElapsed);
  }

  function newSize(size) {
    SIZE = parseInt(size) || 4;
    localStorage.removeItem('tablo-slider-state');
    initBoard();
    moves = 0;
    secondsElapsed = 0;
    gameActive = true;
    stopTimer();
    startTimer();
    renderBoard();
    
    var bestKey = 'tablo-slider-best-' + SIZE;
    var best = localStorage.getItem(bestKey);
    if (bestEl) bestEl.textContent = best || '--';
  }

  function newGame() {
    localStorage.removeItem('tablo-slider-state');
    initBoard();
    moves = 0;
    secondsElapsed = 0;
    gameActive = true;
    stopTimer();
    startTimer();
    winnerModal.classList.remove('visible');
    renderBoard();
    showToast('toast_restarted');
  }

  function initGame() {
    initBoard();
    moves = 0;
    secondsElapsed = 0;
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

    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', newGame);
    }
  }

  window.initGame = initGame;
})();