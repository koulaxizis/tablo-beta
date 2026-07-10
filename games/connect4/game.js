// ============================================
// Tablo — Connect 4 Game (with AI)
// ============================================

(function() {
  'use strict';

  var ROWS = 6;
  var COLS = 7;
  var PLAYER_1 = 1;
  var PLAYER_2 = 2;
  var EMPTY = 0;

  var board = [];
  var currentPlayer = PLAYER_1;
  var gameActive = false;
  var gameMode = 'human';
  var aiThinking = false;
  var winsP1 = 0;
  var winsP2 = 0;

  var boardEl = document.getElementById('board');
  var currentPlayerEl = document.getElementById('current-player');
  var turnStatusEl = document.getElementById('turn-status');
  var winsP1El = document.getElementById('wins-p1');
  var winsP2El = document.getElementById('wins-p2');
  var resetBtn = document.getElementById('btn-reset');
  var modeSelect = document.getElementById('game-mode');
  var winnerModal = document.getElementById('winner-modal');
  var winnerTitle = document.getElementById('winner-title');
  var winnerIcon = document.getElementById('winner-icon');
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
        if (board[r][c] === PLAYER_1) cell.classList.add('player1');
        else if (board[r][c] === PLAYER_2) cell.classList.add('player2');
        cell.addEventListener('click', function(e) {
          var col = parseInt(e.currentTarget.dataset.col);
          handleColumnClick(col);
        });
        row.appendChild(cell);
      }
      boardEl.appendChild(row);
    }
  }

  function findDropRow(col) {
    for (var r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === EMPTY) return r;
    }
    return -1;
  }

  function dropPiece(col, player) {
    var row = findDropRow(col);
    if (row !== -1) {
      board[row][col] = player;
      renderBoard();
    }
    return row;
  }

  function handleColumnClick(col) {
    if (!gameActive || aiThinking) return;
    if (gameMode === 'ai' && currentPlayer === PLAYER_2) return;

    var row = findDropRow(col);
    if (row === -1) {
      showToast(tr('connect4_column_full'));
      return;
    }

    dropPiece(col, currentPlayer);

    if (checkWin(currentPlayer)) {
      endGame(currentPlayer);
      return;
    }

    if (isBoardFull()) {
      endGame(0);
      return;
    }

    switchPlayer();

    if (gameMode === 'ai' && currentPlayer === PLAYER_2 && gameActive) {
      aiMove();
    }
  }

  function switchPlayer() {
    currentPlayer = (currentPlayer === PLAYER_1) ? PLAYER_2 : PLAYER_1;
    updateUI();
  }

  function updateUI() {
    currentPlayerEl.textContent = currentPlayer;
    var p1Label = tr('connect4_player1');
    var p2Label = gameMode === 'ai' ? tr('connect4_computer') : tr('connect4_player2');

    if (currentPlayer === PLAYER_1) {
      turnStatusEl.textContent = p1Label + ' — ' + tr('connect4_your_turn');
      turnStatusEl.style.color = 'var(--color-p1)';
    } else {
      turnStatusEl.textContent = p2Label + ' — ' + (aiThinking ? tr('connect4_ai_thinking') : tr('connect4_your_turn'));
      turnStatusEl.style.color = 'var(--color-p2)';
    }
  }

  function isBoardFull() {
    for (var c = 0; c < COLS; c++) {
      if (board[0][c] === EMPTY) return false;
    }
    return true;
  }

  function checkWin(player) {
    // Horizontal
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS - 3; c++) {
        if (board[r][c] === player && board[r][c+1] === player && board[r][c+2] === player && board[r][c+3] === player) return true;
      }
    }
    // Vertical
    for (var r = 0; r < ROWS - 3; r++) {
      for (var c = 0; c < COLS; c++) {
        if (board[r][c] === player && board[r+1][c] === player && board[r+2][c] === player && board[r+3][c] === player) return true;
      }
    }
    // Diagonal \
    for (var r = 0; r < ROWS - 3; r++) {
      for (var c = 0; c < COLS - 3; c++) {
        if (board[r][c] === player && board[r+1][c+1] === player && board[r+2][c+2] === player && board[r+3][c+3] === player) return true;
      }
    }
    // Diagonal /
    for (var r = 3; r < ROWS; r++) {
      for (var c = 0; c < COLS - 3; c++) {
        if (board[r][c] === player && board[r-1][c+1] === player && board[r-2][c+2] === player && board[r-3][c+3] === player) return true;
      }
    }
    return false;
  }

  // ========== AI ==========
  function getValidColumns() {
    var valid = [];
    for (var c = 0; c < COLS; c++) {
      if (board[0][c] === EMPTY) valid.push(c);
    }
    return valid;
  }

  function aiMove() {
    aiThinking = true;
    updateUI();

    setTimeout(function() {
      var col = chooseAiColumn();
      aiThinking = false;

      if (col !== -1) {
        dropPiece(col, PLAYER_2);
        if (checkWin(PLAYER_2)) {
          endGame(PLAYER_2);
          return;
        }
        if (isBoardFull()) {
          endGame(0);
          return;
        }
        switchPlayer();
      }
    }, 600);
  }

  function chooseAiColumn() {
    var validCols = getValidColumns();
    if (validCols.length === 0) return -1;

    // 1. Try to win
    for (var i = 0; i < validCols.length; i++) {
      var c = validCols[i];
      var r = findDropRow(c);
      board[r][c] = PLAYER_2;
      if (checkWin(PLAYER_2)) {
        board[r][c] = EMPTY;
        return c;
      }
      board[r][c] = EMPTY;
    }

    // 2. Block opponent win
    for (var i = 0; i < validCols.length; i++) {
      var c = validCols[i];
      var r = findDropRow(c);
      board[r][c] = PLAYER_1;
      if (checkWin(PLAYER_1)) {
        board[r][c] = EMPTY;
        return c;
      }
      board[r][c] = EMPTY;
    }

    // 3. Prefer center columns
    var centerPrefs = [3, 2, 4, 1, 5, 0, 6];
    for (var i = 0; i < centerPrefs.length; i++) {
      if (validCols.indexOf(centerPrefs[i]) !== -1) {
        return centerPrefs[i];
      }
    }

    return validCols[Math.floor(Math.random() * validCols.length)];
  }

  function endGame(winner) {
    gameActive = false;

    if (winner === PLAYER_1) {
      winsP1++;
      winsP1El.textContent = winsP1;
      winnerIcon.textContent = '🔴';
      winnerTitle.textContent = tr('connect4_player1') + ' ' + tr('connect4_wins');
      winnerTitle.style.color = 'var(--color-p1)';
    } else if (winner === PLAYER_2) {
      winsP2++;
      winsP2El.textContent = winsP2;
      winnerIcon.textContent = gameMode === 'ai' ? '🤖' : '🟡';
      var p2Name = gameMode === 'ai' ? tr('connect4_computer') : tr('connect4_player2');
      winnerTitle.textContent = p2Name + ' ' + tr('connect4_wins');
      winnerTitle.style.color = 'var(--color-p2)';
    } else {
      winnerIcon.textContent = '🤝';
      winnerTitle.textContent = tr('connect4_draw');
      winnerTitle.style.color = 'var(--text-secondary)';
    }

    saveWins();
    winnerModal.classList.add('visible');
  }

  function saveWins() {
    localStorage.setItem('tablo-connect4-wins', winsP1 + '/' + winsP2);
  }

  function resetGame() {
    createBoard();
    renderBoard();
    currentPlayer = PLAYER_1;
    gameActive = true;
    aiThinking = false;
    updateUI();
    winnerModal.classList.remove('visible');
  }

  function initGame() {
    var savedWins = localStorage.getItem('tablo-connect4-wins');
    if (savedWins) {
      var parts = savedWins.split('/');
      winsP1 = parseInt(parts[0]) || 0;
      winsP2 = parseInt(parts[1]) || 0;
      winsP1El.textContent = winsP1;
      winsP2El.textContent = winsP2;
    }

    if (modeSelect) {
      gameMode = modeSelect.value || 'human';
      modeSelect.addEventListener('change', function() {
        gameMode = this.value;
        resetGame();
      });
    }

    resetGame();
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      resetGame();
      showToast(tr('toast_restarted'));
    });
  }

  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', function() {
      resetGame();
    });
  }

  window.initGame = initGame;

})();