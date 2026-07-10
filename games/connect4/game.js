// ============================================
// Tablo — Connect 4 Game
// ============================================

(function() {
  'use strict';

  var ROWS = 6;
  var COLS = 7;
  var PLAYER_1 = 1; // Red
  var PLAYER_2 = 2; // Yellow
  var EMPTY = 0;

  var board = [];
  var currentPlayer = PLAYER_1;
  var gameActive = false;
  var winsP1 = 0;
  var winsP2 = 0;

  var boardEl = document.getElementById('board');
  var currentPlayerEl = document.getElementById('current-player');
  var turnStatusEl = document.getElementById('turn-status');
  var winsP1El = document.getElementById('wins-p1');
  var winsP2El = document.getElementById('wins-p2');
  var resetBtn = document.getElementById('btn-reset');
  var winnerModal = document.getElementById('winner-modal');
  var winnerTitle = document.getElementById('winner-title');
  var winnerIcon = document.getElementById('winner-icon');
  var finalWinsP1El = document.getElementById('final-wins-p1');
  var finalWinsP2El = document.getElementById('final-wins-p2');
  var playAgainBtn = document.getElementById('btn-play-again');
  var toast = document.getElementById('toast');

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function() {
      toast.classList.remove('visible');
    }, 3000);
  }

  function createBoard() {
    board = [];
    for (var r = 0; r < ROWS; r++) {
      board[r] = [];
      for (var c = 0; c < COLS; c++) {
        board[r][c] = EMPTY;
      }
    }
  }

  function renderBoard() {
    boardEl.innerHTML = '';

    for (var r = 0; r < ROWS; r++) {
      var row = document.createElement('div');
      row.className = 'row';

      for (var c = 0; c < COLS; c++) {
        var cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        if (board[r][c] === PLAYER_1) {
          cell.classList.add('player1');
        } else if (board[r][c] === PLAYER_2) {
          cell.classList.add('player2');
        }

        cell.addEventListener('click', function(e) {
          var col = parseInt(e.target.dataset.col);
          handleColumnClick(col);
        });

        row.appendChild(cell);
      }

      boardEl.appendChild(row);
    }
  }

  function dropPiece(col) {
    for (var r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === EMPTY) {
        board[r][col] = currentPlayer;
        renderBoard();
        return r;
      }
    }
    return -1; // Column full
  }

  function handleColumnClick(col) {
    if (!gameActive) return;

    var row = dropPiece(col);
    if (row === -1) {
      showToast('Column is full!');
      return;
    }

    checkWinner();
  }

  function checkWinner() {
    // Check horizontal
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS - 3; c++) {
        if (board[r][c] !== EMPTY &&
            board[r][c] === board[r][c+1] &&
            board[r][c] === board[r][c+2] &&
            board[r][c] === board[r][c+3]) {
          endGame(board[r][c]);
          return;
        }
      }
    }

    // Check vertical
    for (var r = 0; r < ROWS - 3; r++) {
      for (var c = 0; c < COLS; c++) {
        if (board[r][c] !== EMPTY &&
            board[r][c] === board[r+1][c] &&
            board[r][c] === board[r+2][c] &&
            board[r][c] === board[r+3][c]) {
          endGame(board[r][c]);
          return;
        }
      }
    }

    // Check diagonal (top-left to bottom-right)
    for (var r = 0; r < ROWS - 3; r++) {
      for (var c = 0; c < COLS - 3; c++) {
        if (board[r][c] !== EMPTY &&
            board[r][c] === board[r+1][c+1] &&
            board[r][c] === board[r+2][c+2] &&
            board[r][c] === board[r+3][c+3]) {
          endGame(board[r][c]);
          return;
        }
      }
    }

    // Check diagonal (bottom-left to top-right)
    for (var r = 3; r < ROWS; r++) {
      for (var c = 0; c < COLS - 3; c++) {
        if (board[r][c] !== EMPTY &&
            board[r][c] === board[r-1][c+1] &&
            board[r][c] === board[r-2][c+2] &&
            board[r][c] === board[r-3][c+3]) {
          endGame(board[r][c]);
          return;
        }
      }
    }

    // Switch player
    switchPlayer();
  }

  function switchPlayer() {
    currentPlayer = (currentPlayer === PLAYER_1) ? PLAYER_2 : PLAYER_1;
    updateUI();
  }

  function updateUI() {
    currentPlayerEl.textContent = currentPlayer;

    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];

    if (currentPlayer === PLAYER_1) {
      turnStatusEl.textContent = t ? t.connect4_your_turn : 'Your turn';
      turnStatusEl.style.color = 'var(--color-p1)';
    } else {
      turnStatusEl.textContent = t ? t.connect4_your_turn : 'Your turn';
      turnStatusEl.style.color = 'var(--color-p2)';
    }
  }

  function endGame(winner) {
    gameActive = false;

    if (winner === PLAYER_1) {
      winsP1++;
      winsP1El.textContent = winsP1;
    } else {
      winsP2++;
      winsP2El.textContent = winsP2;
    }

    finalWinsP1El.textContent = winsP1;
    finalWinsP2El.textContent = winsP2;

    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];

    winnerIcon.textContent = '🏆';
    winnerTitle.textContent = (t && t.connect4_player1) || 'Player 1' + ' won!';
    winnerTitle.style.color = (winner === PLAYER_1) ? 'var(--color-p1)' : 'var(--color-p2)';

    winnerModal.classList.add('visible');
  }

  function resetGame() {
    createBoard();
    renderBoard();
    currentPlayer = PLAYER_1;
    gameActive = true;
    updateUI();
    winnerModal.classList.remove('visible');
  }

  function initGame() {
    // Load wins from localStorage
    var winsKey = 'tablo-connect4-wins';
    var savedWins = localStorage.getItem(winsKey);
    if (savedWins) {
      var parts = savedWins.split('/');
      winsP1 = parseInt(parts[0]) || 0;
      winsP2 = parseInt(parts[1]) || 0;
      winsP1El.textContent = winsP1;
      winsP2El.textContent = winsP2;
    }

    resetGame();
  }

  function saveWins() {
    localStorage.setItem('tablo-connect4-wins', winsP1 + '/' + winsP2);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      resetGame();
      showToast('Game reset');
    });
  }

  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', function() {
      saveWins();
      resetGame();
    });
  }

})();