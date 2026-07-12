// ============================================
// Tablo — Number Slider (Sliding Puzzle)
// ============================================

(function() {
  'use strict';

  var gridSize = 4;
  var board = [];
  var emptyPos = { row: 0, col: 0 };
  var moves = 0;
  var timerInterval = null;
  var secondsElapsed = 0;
  var gameActive = false;
  var gameStarted = false;

  var boardEl = document.getElementById('board');
  var movesDisplay = document.getElementById('moves');
  var timerDisplay = document.getElementById('timer');
  var bestScoreDisplay = document.getElementById('best-score');
  var gridSizeSelect = document.getElementById('grid-size');
  var newGameBtn = document.getElementById('btn-new-game');
  var winnerModal = document.getElementById('winner-modal');
  var finalMovesEl = document.getElementById('final-moves');
  var finalTimeEl = document.getElementById('final-time');
  var playAgainBtn = document.getElementById('btn-play-again');
  var toast = document.getElementById('toast');

  function tr(key) {
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
    return t ? (t[key] || key) : key;
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function() {
      toast.classList.remove('visible');
    }, 3000);
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
    var mins = Math.floor(secondsElapsed / 60);
    var secs = secondsElapsed % 60;
    timerDisplay.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function formatTime(totalSeconds) {
    var mins = Math.floor(totalSeconds / 60);
    var secs = totalSeconds % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function createBoard() {
    board = [];
    var num = 1;
    for (var r = 0; r < gridSize; r++) {
      board[r] = [];
      for (var c = 0; c < gridSize; c++) {
        if (r === gridSize - 1 && c === gridSize - 1) {
          board[r][c] = null;
          emptyPos = { row: r, col: c };
        } else {
          board[r][c] = num++;
        }
      }
    }
  }

  function shuffleBoard() {
    var validMoves = 100 + gridSize * 20;
    for (var i = 0; i < validMoves; i++) {
      var possibleMoves = [];
      if (emptyPos.row > 0) possibleMoves.push({ dr: -1, dc: 0 });
      if (emptyPos.row < gridSize - 1) possibleMoves.push({ dr: 1, dc: 0 });
      if (emptyPos.col > 0) possibleMoves.push({ dr: 0, dc: -1 });
      if (emptyPos.col < gridSize - 1) possibleMoves.push({ dr: 0, dc: 1 });

      var move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      swapTiles(emptyPos.row + move.dr, emptyPos.col + move.dc);
    }
    moves = 0;
    movesDisplay.textContent = moves;
  }

  function swapTiles(row, col) {
    var temp = board[row][col];
    board[row][col] = board[emptyPos.row][emptyPos.col];
    board[emptyPos.row][emptyPos.col] = temp;
    emptyPos = { row: row, col: col };
  }

  function canMove(row, col) {
    var dr = Math.abs(row - emptyPos.row);
    var dc = Math.abs(col - emptyPos.col);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  }

  function handleClick(r, c) {
    if (!gameActive || !canMove(r, c)) return;

    swapTiles(r, c);
    moves++;
    movesDisplay.textContent = moves;
    renderBoard();

    if (checkWin()) {
      gameWon();
    }
  }

  function checkWin() {
    var num = 1;
    for (var r = 0; r < gridSize; r++) {
      for (var c = 0; c < gridSize; c++) {
        if (r === gridSize - 1 && c === gridSize - 1) {
          if (board[r][c] !== null) return false;
        } else {
          if (board[r][c] !== num++) return false;
        }
      }
    }
    return true;
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    var sizeClass = 'grid-' + gridSize;
    boardEl.className = 'slider-board ' + sizeClass;

    for (var r = 0; r < gridSize; r++) {
      for (var c = 0; c < gridSize; c++) {
        var tile = document.createElement('div');
        tile.className = 'tile';
        if (board[r][c] !== null) {
          tile.textContent = board[r][c];
          if (canMove(r, c)) {
            tile.classList.add('movable');
            tile.addEventListener('click', function(e) {
              var rc = e.currentTarget.dataset.row;
              var cc = e.currentTarget.dataset.col;
              handleClick(parseInt(rc), parseInt(cc));
            });
            tile.dataset.row = r;
            tile.dataset.col = c;
          }
        } else {
          tile.classList.add('empty');
        }
        boardEl.appendChild(tile);
      }
    }
  }

  function gameWon() {
    stopTimer();
    finalMovesEl.textContent = moves;
    finalTimeEl.textContent = formatTime(secondsElapsed);
    winnerModal.classList.add('visible');

    var bestKey = 'tablo-slider-best-' + gridSize;
    var currentBest = localStorage.getItem(bestKey);
    if (!currentBest || moves < parseInt(currentBest)) {
      localStorage.setItem(bestKey, moves.toString());
      updateBestScore();
    }
  }

  function updateBestScore() {
    var bestKey = 'tablo-slider-best-' + gridSize;
    var currentBest = localStorage.getItem(bestKey);
    if (currentBest) {
      bestScoreDisplay.textContent = currentBest;
    }
  }

  function resetGame() {
    gridSize = parseInt(gridSizeSelect.value) || 4;
    stopTimer();
    gameStarted = false;
    moves = 0;
    secondsElapsed = 0;
    gameActive = true;

    movesDisplay.textContent = '0';
    timerDisplay.textContent = '00:00';

    createBoard();
    shuffleBoard();
    renderBoard();
    updateBestScore();

    winnerModal.classList.remove('visible');
  }

  function initGame() {
    gridSizeSelect.value = '4';
    resetGame();

    gridSizeSelect.addEventListener('change', function() {
      resetGame();
      showToast(tr('slider_board_changed'));
    });

    if (newGameBtn) {
      newGameBtn.addEventListener('click', function() {
        resetGame();
        showToast(tr('slider_new_game_started'));
      });
    }

    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', resetGame);
    }
  }

  window.initGame = initGame;
})();