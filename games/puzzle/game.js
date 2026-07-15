// ============================================
// Tablo — Slide Puzzle Game
// ============================================

(function() {
  'use strict';

  var SIZE = 4;
  var TOTAL = SIZE * SIZE;
  var grid = [];
  var emptyPos = TOTAL - 1;
  var moves = 0;
  var timerInterval = null;
  var secondsElapsed = 0;
  var gameStarted = false;
  var gameOver = false;

  var boardEl, movesEl, timerEl, restartBtn, playAgainBtn, winModal, finalMovesEl, finalTimeEl, toast;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function() {
      toast.classList.remove('visible');
    }, 2500);
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    secondsElapsed = 0;
    updateTimerDisplay();
    timerInterval = setInterval(function() {
      secondsElapsed++;
      updateTimerDisplay();
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateTimerDisplay() {
    var m = Math.floor(secondsElapsed / 60);
    var s = secondsElapsed % 60;
    timerEl.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function formatTime(t) {
    var m = Math.floor(t / 60);
    var s = t % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function initGrid() {
    grid = [];
    for (var i = 0; i < TOTAL - 1; i++) grid.push(i + 1);
    grid.push(0);
    emptyPos = TOTAL - 1;
  }

  function isSolvable(g) {
    var inv = 0;
    var flat = g.filter(function(v) { return v !== 0; });
    for (var i = 0; i < flat.length; i++) {
      for (var j = i + 1; j < flat.length; j++) {
        if (flat[i] > flat[j]) inv++;
      }
    }
    var emptyRow = Math.floor(grid.indexOf(0) / SIZE);
    if (SIZE % 2 === 1) return inv % 2 === 0;
    return (inv + emptyRow) % 2 === 1;
  }

  function shuffleGrid() {
    do {
      var arr = grid.slice();
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
      grid = arr;
      emptyPos = grid.indexOf(0);
    } while (!isSolvable(grid) || isSolved());
  }

  function isSolved() {
    for (var i = 0; i < TOTAL - 1; i++) {
      if (grid[i] !== i + 1) return false;
    }
    return grid[TOTAL - 1] === 0;
  }

  function getNeighbors(pos) {
    var row = Math.floor(pos / SIZE);
    var col = pos % SIZE;
    var neighbors = [];
    if (row > 0) neighbors.push(pos - SIZE);
    if (row < SIZE - 1) neighbors.push(pos + SIZE);
    if (col > 0) neighbors.push(pos - 1);
    if (col < SIZE - 1) neighbors.push(pos + 1);
    return neighbors;
  }

  function tryMove(pos) {
    if (gameOver) return;
    var neighbors = getNeighbors(emptyPos);
    if (neighbors.indexOf(pos) === -1) return;

    if (!gameStarted) {
      gameStarted = true;
      startTimer();
    }

    grid[emptyPos] = grid[pos];
    grid[pos] = 0;
    emptyPos = pos;
    moves++;
    movesEl.textContent = moves;
    renderBoard();

    if (isSolved()) {
      gameWon();
    }
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    grid.forEach(function(val, pos) {
      var tile = document.createElement('div');
      tile.className = 'pz-tile';
      if (val === 0) {
        tile.classList.add('empty');
      } else {
        tile.textContent = val;
        (function(p) {
          tile.addEventListener('click', function() { tryMove(p); });
        })(pos);
      }
      boardEl.appendChild(tile);
    });
  }

  function gameWon() {
    gameOver = true;
    stopTimer();
    finalMovesEl.textContent = moves;
    finalTimeEl.textContent = formatTime(secondsElapsed);
    winModal.classList.add('visible');
    var bestKey = 'tablo-puzzle-best';
    var best = parseInt(localStorage.getItem(bestKey) || '999999');
    if (moves < best) localStorage.setItem(bestKey, moves);
  }

  function resetGame() {
    gameOver = false;
    gameStarted = false;
    moves = 0;
    stopTimer();
    timerEl.textContent = '00:00';
    movesEl.textContent = '0';
    initGrid();
    shuffleGrid();
    renderBoard();
    winModal.classList.remove('visible');
  }

  function init() {
    boardEl = document.getElementById('board');
    movesEl = document.getElementById('moves');
    timerEl = document.getElementById('timer');
    restartBtn = document.getElementById('btn-restart');
    playAgainBtn = document.getElementById('btn-play-again');
    winModal = document.getElementById('win-modal');
    finalMovesEl = document.getElementById('final-moves');
    finalTimeEl = document.getElementById('final-time');
    toast = document.getElementById('toast');

    if (restartBtn) {
      restartBtn.addEventListener('click', function() {
        resetGame();
        showToast('Game restarted');
      });
    }

    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', function() {
        resetGame();
      });
    }

    // Keyboard controls
    document.addEventListener('keydown', function(e) {
      if (gameOver) return;
      var row = Math.floor(emptyPos / SIZE);
      var col = emptyPos % SIZE;
      var target = -1;
      switch(e.key) {
        case 'ArrowUp': if (row < SIZE - 1) target = emptyPos + SIZE; break;
        case 'ArrowDown': if (row > 0) target = emptyPos - SIZE; break;
        case 'ArrowLeft': if (col < SIZE - 1) target = emptyPos + 1; break;
        case 'ArrowRight': if (col > 0) target = emptyPos - 1; break;
      }
      if (target >= 0) {
        e.preventDefault();
        tryMove(target);
      }
    });

    resetGame();
  }

  window.initGame = init;
})();