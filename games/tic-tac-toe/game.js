// ============================================
// Tablo — Tic-Tac-Toe Game
// ============================================

(function() {
  'use strict';

  var board = [null, null, null, null, null, null, null, null, null];
  var currentPlayer = 'X';
  var gameActive = false;
  var gameMode = 'pvp';
  var aiThinking = false;
  var winsX = 0;
  var winsO = 0;

  var winPatterns = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];

  var boardEl = document.getElementById('board');
  var modeDisplayEl = document.getElementById('current-mode');
  var turnDisplayEl = document.getElementById('current-turn');
  var winsXEl = document.getElementById('wins-x');
  var winsOEl = document.getElementById('wins-o');
  var modeSelect = document.getElementById('game-mode-select');
  var resetBtn = document.getElementById('btn-reset');
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

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function() {
      toast.classList.remove('visible');
    }, 3000);
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    for (var i = 0; i < 9; i++) {
      var cell = document.createElement('div');
      cell.className = 'cell' + (board[i] ? ' ' + board[i].toLowerCase() : '');
      cell.dataset.index = i;
      cell.innerHTML = board[i] ? '<span class="mark">' + board[i] + '</span>' : '';
      cell.addEventListener('click', handleCellClick);
      boardEl.appendChild(cell);
    }
  }

  function handleCellClick(e) {
    if (!gameActive || aiThinking) return;
    if (gameMode === 'ai' && currentPlayer === 'O') return;

    var idx = parseInt(e.currentTarget.dataset.index);
    if (board[idx]) return;

    makeMove(idx);
  }

  function makeMove(idx) {
    board[idx] = currentPlayer;
    renderBoard();

    if (checkWin()) {
      endGame(currentPlayer);
      return;
    }

    if (checkDraw()) {
      endGame(null);
      return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateUI();

    if (gameMode === 'ai' && currentPlayer === 'O' && gameActive) {
      aiMove();
    }
  }

  function checkWin() {
    for (var i = 0; i < winPatterns.length; i++) {
      var p = winPatterns[i];
      if (board[p[0]] && board[p[0]] === board[p[1]] && board[p[0]] === board[p[2]]) {
        highlightWin(p);
        return true;
      }
    }
    return false;
  }

  function highlightWin(pattern) {
    var cells = document.querySelectorAll('.cell');
    for (var i = 0; i < pattern.length; i++) {
      cells[pattern[i]].classList.add('win-cell');
    }
  }

  function checkDraw() {
    for (var i = 0; i < 9; i++) {
      if (!board[i]) return false;
    }
    return true;
  }

  function aiMove() {
    aiThinking = true;
    updateUI();

    setTimeout(function() {
      var move = getAIMove();
      board[move] = 'O';
      renderBoard();

      if (checkWin()) {
        aiThinking = false;
        endGame('O');
        return;
      }

      if (checkDraw()) {
        aiThinking = false;
        endGame(null);
        return;
      }

      currentPlayer = 'X';
      updateUI();
      aiThinking = false;
    }, 500);
  }

  function getAIMove() {
    // 1. Try to win
    for (var i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'O';
        if (checkWinNoHighlight()) {
          board[i] = null;
          return i;
        }
        board[i] = null;
      }
    }

    // 2. Block opponent win
    for (var i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'X';
        if (checkWinNoHighlight()) {
          board[i] = null;
          return i;
        }
        board[i] = null;
      }
    }

    // 3. Take center
    if (!board[4]) return 4;

    // 4. Take corners
    var corners = [0,2,6,8];
    for (var i = 0; i < corners.length; i++) {
      if (!board[corners[i]]) return corners[i];
    }

    // 5. Random
    var empty = [];
    for (var i = 0; i < 9; i++) {
      if (!board[i]) empty.push(i);
    }
    return empty[Math.floor(Math.random() * empty.length)];
  }

  function checkWinNoHighlight() {
    for (var i = 0; i < winPatterns.length; i++) {
      var p = winPatterns[i];
      if (board[p[0]] && board[p[0]] === board[p[1]] && board[p[0]] === board[p[2]]) {
        return true;
      }
    }
    return false;
  }

  function updateUI() {
    turnDisplayEl.textContent = currentPlayer;
    turnDisplayEl.style.color = currentPlayer === 'X' ? 'var(--color-x)' : 'var(--color-o)';
    modeDisplayEl.textContent = gameMode === 'pvp' ? tr('ttt_pvp') : tr('ttt_vs_ai');
  }

  function endGame(winner) {
    gameActive = false;
    winnerModal.classList.add('visible');

    if (winner) {
      if (winner === 'X') winsX++;
      else winsO++;
      winsXEl.textContent = winsX;
      winsOEl.textContent = winsO;

      winnerIcon.textContent = '🏆';
      var player = tr(winner === 'X' ? 'ttt_x_player' : 'ttt_o_player');
      winnerTitle.textContent = player + ' ' + tr('ttt_wins');
      winnerTitle.style.color = winner === 'X' ? 'var(--color-x)' : 'var(--color-o)';
      saveWins();
    } else {
      winnerIcon.textContent = '🤝';
      winnerTitle.textContent = tr('ttt_draw');
      winnerTitle.style.color = 'var(--text-secondary)';
    }
  }

  function saveWins() {
    localStorage.setItem('tablo-ttt-wins', winsX + '/' + winsO);
  }

  function loadWins() {
    var saved = localStorage.getItem('tablo-ttt-wins');
    if (saved) {
      var parts = saved.split('/');
      winsX = parseInt(parts[0]) || 0;
      winsO = parseInt(parts[1]) || 0;
      winsXEl.textContent = winsX;
      winsOEl.textContent = winsO;
    }
  }

  function resetGame() {
    board = [null, null, null, null, null, null, null, null, null];
    currentPlayer = 'X';
    gameActive = true;
    aiThinking = false;
    winnerModal.classList.remove('visible');

    // Clear winning highlights
    var cells = document.querySelectorAll('.cell');
    cells.forEach(function(c) { c.classList.remove('win-cell'); });

    renderBoard();
    updateUI();
  }

  function initGame() {
    loadWins();
    if (modeSelect) {
      gameMode = modeSelect.value || 'pvp';
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
    playAgainBtn.addEventListener('click', resetGame);
  }

  window.initGame = initGame;
})();