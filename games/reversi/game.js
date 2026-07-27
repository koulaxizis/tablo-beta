// ============================================
// Tablo — Reversi (Othello)
// ============================================

(function() {
  'use strict';

  console.log('[Reversi] game.js loaded');

  var BOARD_SIZE = 8;
  var EMPTY = 0;
  var BLACK = 1;
  var WHITE = 2;

  var board = [];
  var currentPlayer = BLACK;
  var gameActive = false;
  var vsComputer = false;
  var computerPlaying = false;

  var directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  var blackScoreEl, whiteScoreEl, turnIndicator;
  var modeSelect, newGameBtn;
  var winnerModal, winnerIcon, winnerTitle, winnerMessage, playAgainBtn;
  var toast;

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
    showToast._t = setTimeout(function() {
      toast.classList.remove('visible');
    }, 2000);
  }

  function createBoard() {
    board = [];
    for (var i = 0; i < BOARD_SIZE; i++) {
      board[i] = [];
      for (var j = 0; j < BOARD_SIZE; j++) {
        board[i][j] = EMPTY;
      }
    }

    var mid = BOARD_SIZE / 2;
    board[mid - 1][mid - 1] = WHITE;
    board[mid][mid] = WHITE;
    board[mid - 1][mid] = BLACK;
    board[mid][mid - 1] = BLACK;
  }

  function isValidMove(row, col, player) {
    if (board[row][col] !== EMPTY) return false;

    var opponent = player === BLACK ? WHITE : BLACK;

    for (var d = 0; d < directions.length; d++) {
      var dr = directions[d][0];
      var dc = directions[d][1];
      var r = row + dr;
      var c = col + dc;
      var foundOpponent = false;

      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        if (board[r][c] === opponent) {
          foundOpponent = true;
        } else if (board[r][c] === player) {
          if (foundOpponent) return true;
          break;
        } else {
          break;
        }
        r += dr;
        c += dc;
      }
    }
    return false;
  }

  function getValidMoves(player) {
    var moves = [];
    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        if (isValidMove(r, c, player)) {
          moves.push({ row: r, col: c });
        }
      }
    }
    return moves;
  }

  function makeMove(row, col, player) {
    if (!isValidMove(row, col, player)) return false;

    var opponent = player === BLACK ? WHITE : BLACK;
    board[row][col] = player;

    for (var d = 0; d < directions.length; d++) {
      var dr = directions[d][0];
      var dc = directions[d][1];
      var r = row + dr;
      var c = col + dc;
      var piecesToFlip = [];

      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        if (board[r][c] === opponent) {
          piecesToFlip.push({ row: r, col: c });
        } else if (board[r][c] === player) {
          break;
        } else {
          piecesToFlip = [];
          break;
        }
        r += dr;
        c += dc;
      }

      for (var i = 0; i < piecesToFlip.length; i++) {
        board[piecesToFlip[i].row][piecesToFlip[i].col] = player;
      }
    }

    return true;
  }

  function countPieces() {
    var black = 0;
    var white = 0;

    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === BLACK) black++;
        else if (board[r][c] === WHITE) white++;
      }
    }

    return { black: black, white: white };
  }

  function switchTurn() {
    var opponent = currentPlayer === BLACK ? WHITE : BLACK;
    var opponentMoves = getValidMoves(opponent);

    if (opponentMoves.length === 0) {
      var currentMoves = getValidMoves(currentPlayer);
      if (currentMoves.length === 0) {
        endGame();
        return false;
      }
      showToast(tr('reversi_pass') + ' ' + (opponent === BLACK ? tr('reversi_black') : tr('reversi_white')));
      return true;
    }

    currentPlayer = opponent;
    updateUI();
    highlightValidMoves();

    if (vsComputer && currentPlayer === WHITE && gameActive) {
      computerPlaying = true;
      setTimeout(makeComputerMove, 700);
    }

    return true;
  }

  function makeComputerMove() {
    if (!gameActive || currentPlayer !== WHITE) {
      computerPlaying = false;
      return;
    }

    var validMoves = getValidMoves(WHITE);

    if (validMoves.length === 0) {
      computerPlaying = false;
      switchTurn();
      return;
    }

    var bestMove = null;
    var bestScore = -Infinity;

    for (var i = 0; i < validMoves.length; i++) {
      var move = validMoves[i];

      var simulatedBoard = JSON.parse(JSON.stringify(board));
      simulateMakeMove(simulatedBoard, move.row, move.col, WHITE);

      var score = evaluateBoard(simulatedBoard);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    if (bestMove) {
      makeMove(bestMove.row, bestMove.col, WHITE);
      updateUI();

      if (!switchTurn()) {
        computerPlaying = false;
        return;
      }
    }

    computerPlaying = false;
  }

  function simulateMakeMove(simBoard, row, col, player) {
    simBoard[row][col] = player;
    var opponent = player === BLACK ? WHITE : BLACK;

    for (var d = 0; d < directions.length; d++) {
      var dr = directions[d][0];
      var dc = directions[d][1];
      var r = row + dr;
      var c = col + dc;
      var piecesToFlip = [];

      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        if (simBoard[r][c] === opponent) {
          piecesToFlip.push({ row: r, col: c });
        } else if (simBoard[r][c] === player) {
          break;
        } else {
          piecesToFlip = [];
          break;
        }
        r += dr;
        c += dc;
      }

      for (var i = 0; i < piecesToFlip.length; i++) {
        simBoard[piecesToFlip[i].row][piecesToFlip[i].col] = player;
      }
    }
  }

  function evaluateBoard(simBoard) {
    var WEIGHTS = [
      [100, -20, 10, 5, 5, 10, -20, 100],
      [-20, -50, -2, -2, -2, -2, -50, -20],
      [10, -2, -1, -1, -1, -1, -2, 10],
      [5, -2, -1, -1, -1, -1, -2, 5],
      [5, -2, -1, -1, -1, -1, -2, 5],
      [10, -2, -1, -1, -1, -1, -2, 10],
      [-20, -50, -2, -2, -2, -2, -50, -20],
      [100, -20, 10, 5, 5, 10, -20, 100]
    ];

    var score = 0;
    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        if (simBoard[r][c] === WHITE) {
          score += WEIGHTS[r][c];
        } else if (simBoard[r][c] === BLACK) {
          score -= WEIGHTS[r][c];
        }
      }
    }

    return score;
  }

  function renderBoard() {
    var container = document.getElementById('reversi-board');
    if (!container) return;

    container.innerHTML = '';

    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        var cell = document.createElement('div');
        cell.className = 'reversi-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        var piece = board[r][c];
        if (piece !== EMPTY) {
          cell.classList.add(piece === BLACK ? 'piece-black' : 'piece-white');
        }

        (function(row, col) {
          cell.addEventListener('click', function(e) {
            if (!gameActive || computerPlaying) return;

            if (vsComputer && currentPlayer === WHITE) {
              showToast(tr('reversi_wait_computer'));
              return;
            }

            if (isValidMove(row, col, currentPlayer)) {
              makeMove(row, col, currentPlayer);
              updateUI();

              if (!switchTurn()) {
                return;
              }
            } else {
              showToast(tr('reversi_invalid_move'));
            }
          });
        })(r, c);

        container.appendChild(cell);
      }
    }
  }

  function highlightValidMoves() {
    if (!gameActive) return;

    var cells = document.querySelectorAll('.reversi-cell');
    var validMoves = getValidMoves(currentPlayer);

    cells.forEach(function(cell) {
      cell.classList.remove('highlight-valid');
    });

    for (var i = 0; i < validMoves.length; i++) {
      var move = validMoves[i];
      var selector = '.reversi-cell[data-row="' + move.row + '"][data-col="' + move.col + '"]';
      var cellEl = document.querySelector(selector);
      if (cellEl) {
        cellEl.classList.add('highlight-valid');
      }
    }
  }

  function updateUI() {
    var scores = countPieces();

    if (blackScoreEl) blackScoreEl.textContent = scores.black;
    if (whiteScoreEl) whiteScoreEl.textContent = scores.white;
    if (turnIndicator) {
      turnIndicator.textContent = currentPlayer === BLACK ? '⚫' : '⚪';
      turnIndicator.style.color = currentPlayer === BLACK ? '#e2e8f0' : '#64748b';
    }

    renderBoard();
  }

  function endGame() {
    gameActive = false;
    var scores = countPieces();

    if (winnerIcon) {
      if (scores.black > scores.white) {
        winnerIcon.textContent = '⚫';
      } else if (scores.white > scores.black) {
        winnerIcon.textContent = '⚪';
      } else {
        winnerIcon.textContent = '\u{1F389}';
      }
    }

    if (winnerTitle) {
      if (scores.black > scores.white) {
        winnerTitle.textContent = tr('reversi_black_wins');
      } else if (scores.white > scores.black) {
        winnerTitle.textContent = tr('reversi_white_wins');
      } else {
        winnerTitle.textContent = tr('reversi_draw');
      }
    }

    if (winnerMessage) {
      winnerMessage.textContent = tr('reversi_final_score') + ' ' + scores.black + ' - ' + scores.white;
    }

    if (winnerModal) winnerModal.classList.add('visible');
  }

  function startNewGame() {
    createBoard();
    currentPlayer = BLACK;
    gameActive = true;
    computerPlaying = false;
    updateUI();
    highlightValidMoves();
  }

  function setMode(mode) {
    vsComputer = (mode === 'ai');
    console.log('[Reversi] Mode set to:', vsComputer ? 'vs Computer' : '2 Players');
  }

  function initGame() {
    console.log('[Reversi] initGame() called');

    blackScoreEl = document.getElementById('black-score');
    whiteScoreEl = document.getElementById('white-score');
    turnIndicator = document.getElementById('turn-indicator');
    modeSelect = document.getElementById('mode-select');
    newGameBtn = document.getElementById('btn-new-game');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    playAgainBtn = document.getElementById('btn-play-again');
    toast = document.getElementById('toast');

    if (newGameBtn) newGameBtn.addEventListener('click', startNewGame);
    if (modeSelect) modeSelect.addEventListener('change', function(e) {
      setMode(e.target.value);
      startNewGame();
    });
    if (playAgainBtn) playAgainBtn.addEventListener('click', function() {
      if (winnerModal) winnerModal.classList.remove('visible');
      startNewGame();
    });

    startNewGame();
    console.log('[Reversi] Init complete');
  }

  window.initGame = initGame;
})();