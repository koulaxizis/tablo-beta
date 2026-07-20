// ============================================
// Tablo — Checkers
// ============================================

(function() {
  'use strict';

  var BOARD_SIZE = 8;
  var RED = 1;
  var BLACK = 2;
  var RED_KING = 3;
  var BLACK_KING = 4;

  var grid = [];
  var currentPlayer = RED;
  var vsAI = false;
  var selectedPiece = null;
  var validMoves = [];
  var mustJumpFrom = null;
  var redCaptured = 0;
  var blackCaptured = 0;
  var redWins = 0;
  var blackWins = 0;
  var gameOver = false;

  var boardContainer, checkerboard, piecesOverlay;
  var turnIndicator, capturedCount, winsCount;
  var newGameBtn, modeBtn;
  var winnerModal, winnerIcon, winnerTitle, winnerMessage, winnerButtons;
  var playAgainBtn;
  var toast;

  function tr(key) {
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
    return t ? (t[key] || key) : key;
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = tr(msg);
    toast.classList.add('visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function() {
      toast.classList.remove('visible');
    }, 2000);
  }

  function initBoard() {
    grid = [];
    for (var r = 0; r < BOARD_SIZE; r++) {
      grid[r] = [];
      for (var c = 0; c < BOARD_SIZE; c++) {
        if ((r + c) % 2 === 1) {
          if (r < 3) {
            grid[r][c] = RED;
          } else if (r > 4) {
            grid[r][c] = BLACK;
          } else {
            grid[r][c] = 0;
          }
        } else {
          grid[r][c] = 0;
        }
      }
    }
  }

  function renderBoard() {
    if (!checkerboard || !piecesOverlay) return;

    checkerboard.innerHTML = '';
    piecesOverlay.innerHTML = '';

    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        var cell = document.createElement('div');
        cell.className = 'cell ' + (((r + c) % 2 === 1) ? 'dark' : 'light');
        cell.dataset.row = r;
        cell.dataset.col = c;

        for (var m = 0; m < validMoves.length; m++) {
          if (validMoves[m].row === r && validMoves[m].col === c) {
            cell.classList.add(validMoves[m].capture ? 'highlight-capture' : 'highlight-move');
            cell.addEventListener('click', onSquareClick);
            break;
          }
        }

        checkerboard.appendChild(cell);

        if (grid[r][c] !== 0) {
          var piece = document.createElement('div');
          piece.className = 'piece';
          piece.dataset.row = r;
          piece.dataset.col = c;

          // CRITICAL FIX: Position the piece using percentage
          piece.style.left = (c * 12.5) + '%';
          piece.style.top = (r * 12.5) + '%';

          if (grid[r][c] === RED) {
            piece.classList.add('red');
          } else if (grid[r][c] === BLACK) {
            piece.classList.add('black');
          } else if (grid[r][c] === RED_KING) {
            piece.classList.add('red', 'king');
          } else if (grid[r][c] === BLACK_KING) {
            piece.classList.add('black', 'king');
          }

          if (selectedPiece && selectedPiece.row === r && selectedPiece.col === c) {
            piece.classList.add('selected');
          }

          // CRITICAL FIX: Create the .piece-inner div (the visible circle)
          var pieceInner = document.createElement('div');
          pieceInner.className = 'piece-inner';
          piece.appendChild(pieceInner);

          piece.addEventListener('click', onPieceClick);
          piecesOverlay.appendChild(piece);
        }
      }
    }
  }

  function updateStats() {
    if (turnIndicator) {
      turnIndicator.textContent = tr(currentPlayer === RED ? 'checkers_red' : 'checkers_black');
      turnIndicator.style.color = currentPlayer === RED ? '#f87171' : '#94a3b8';
    }

    var totalCaptured = redCaptured + blackCaptured;
    if (capturedCount) {
      capturedCount.textContent = totalCaptured;
    }

    if (winsCount) {
      winsCount.textContent = redWins;
    }
  }

  function getValidMovesForPiece(row, col) {
    var moves = [];
    var piece = grid[row][col];
    var isKing = piece === RED_KING || piece === BLACK_KING;
    var isRed = piece === RED || piece === RED_KING;
    var directions = isKing ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] :
                     isRed ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];

    for (var d = 0; d < directions.length; d++) {
      var dr = directions[d][0];
      var dc = directions[d][1];
      var newRow = row + dr;
      var newCol = col + dc;

      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
        if (grid[newRow][newCol] === 0) {
          moves.push({ row: newRow, col: newCol, capture: false });
        } else {
          var neighborPiece = grid[newRow][newCol];
          var isOpponent = isRed ? (neighborPiece === BLACK || neighborPiece === BLACK_KING) :
                           (neighborPiece === RED || neighborPiece === RED_KING);
          if (isOpponent) {
            var jumpRow = newRow + dr;
            var jumpCol = newCol + dc;
            if (jumpRow >= 0 && jumpRow < BOARD_SIZE && jumpCol >= 0 && jumpCol < BOARD_SIZE) {
              if (grid[jumpRow][jumpCol] === 0) {
                moves.push({ row: jumpRow, col: jumpCol, capture: true, capturedRow: newRow, capturedCol: newCol });
              }
            }
          }
        }
      }
    }

    return moves;
  }

  function getAllValidMoves(player) {
    var allMoves = [];
    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        var piece = grid[r][c];
        var isPlayerPiece = player === RED ? (piece === RED || piece === RED_KING) :
                            (piece === BLACK || piece === BLACK_KING);
        if (isPlayerPiece) {
          var moves = getValidMovesForPiece(r, c);
          for (var m = 0; m < moves.length; m++) {
            moves[m].fromRow = r;
            moves[m].fromCol = c;
            allMoves.push(moves[m]);
          }
        }
      }
    }
    return allMoves;
  }

  function hasCaptureMoves(moves) {
    for (var m = 0; m < moves.length; m++) {
      if (moves[m].capture) return true;
    }
    return false;
  }

  function executeMove(fromRow, fromCol, toRow, toCol, captureInfo) {
    var piece = grid[fromRow][fromCol];
    grid[toRow][toCol] = piece;
    grid[fromRow][fromCol] = 0;

    if (captureInfo && captureInfo.capture) {
      grid[captureInfo.capturedRow][captureInfo.capturedCol] = 0;
      if (currentPlayer === RED) {
        blackCaptured++;
      } else {
        redCaptured++;
      }
    }

    var promoted = false;
    if (currentPlayer === RED && toRow === BOARD_SIZE - 1 && piece === RED) {
      grid[toRow][toCol] = RED_KING;
      promoted = true;
    } else if (currentPlayer === BLACK && toRow === 0 && piece === BLACK) {
      grid[toRow][toCol] = BLACK_KING;
      promoted = true;
    }

    if (captureInfo && captureInfo.capture && !promoted) {
      var furtherCaptures = getValidMovesForPiece(toRow, toCol);
      var canContinueCapture = false;
      for (var f = 0; f < furtherCaptures.length; f++) {
        if (furtherCaptures[f].capture) {
          canContinueCapture = true;
          mustJumpFrom = { row: toRow, col: toCol };
          break;
        }
      }
      if (!canContinueCapture) {
        mustJumpFrom = null;
        switchPlayer();
      } else {
        selectedPiece = { row: toRow, col: toCol };
        validMoves = furtherCaptures.filter(function(m) { return m.capture; });
        renderBoard();
        updateStats();
        return;
      }
    } else {
      mustJumpFrom = null;
      switchPlayer();
    }

    selectedPiece = null;
    validMoves = [];
    renderBoard();
    updateStats();
    checkWinCondition();
  }

  function switchPlayer() {
    currentPlayer = currentPlayer === RED ? BLACK : RED;
    updateStats();

    if (vsAI && currentPlayer === BLACK && !gameOver) {
      setTimeout(makeAIMove, 500);
    }
  }

  function makeAIMove() {
    if (gameOver) return;

    var allMoves = getAllValidMoves(BLACK);
    if (allMoves.length === 0) {
      showWinner(RED, true);
      return;
    }

    var captures = allMoves.filter(function(m) { return m.capture; });
    var availableMoves = captures.length > 0 ? captures : allMoves;

    var move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    executeMove(move.fromRow, move.fromCol, move.row, move.col, move);
  }

  function checkWinCondition() {
    var redPieces = 0;
    var blackPieces = 0;
    var redMoves = getAllValidMoves(RED);
    var blackMoves = getAllValidMoves(BLACK);

    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        var piece = grid[r][c];
        if (piece === RED || piece === RED_KING) redPieces++;
        if (piece === BLACK || piece === BLACK_KING) blackPieces++;
      }
    }

    if (blackPieces === 0 || blackMoves.length === 0) {
      showWinner(RED, false);
      return;
    }
    if (redPieces === 0 || redMoves.length === 0) {
      showWinner(BLACK, false);
      return;
    }
  }

  function showWinner(winner, isStalemate) {
    gameOver = true;
    var wonByRed = winner === RED;

    if (wonByRed) {
      redWins++;
      localStorage.setItem('tablo-checkers-wins', redWins.toString());
    } else {
      blackWins++;
    }

    if (winnerIcon) winnerIcon.textContent = isStalemate ? '\u2696' : '\uD83C\uDF89';
    if (winnerTitle) {
      winnerTitle.textContent = isStalemate ? tr('checkers_draw') :
                                tr(wonByRed ? 'checkers_red_wins' : 'checkers_black_wins');
    }
    if (winnerMessage) {
      winnerMessage.textContent = isStalemate ? tr('checkers_stalemate') :
                                  tr('checkers_game_end');
    }

    if (winnerButtons) {
      winnerButtons.innerHTML = '';
      var btn = document.createElement('button');
      btn.className = 'game-btn primary';
      btn.textContent = tr('btn_play_again');
      btn.onclick = function() {
        if (winnerModal) {
          winnerModal.classList.remove('visible');
          winnerModal.style.display = 'none';
        }
        startNewGame();
      };
      winnerButtons.appendChild(btn);
    }

    if (winnerModal) {
      winnerModal.classList.add('visible');
      winnerModal.style.display = 'flex';
    }
  }

  function onPieceClick(e) {
    e.stopPropagation();
    if (gameOver) return;
    if (vsAI && currentPlayer === BLACK) return;

    var piece = e.currentTarget;
    var row = parseInt(piece.dataset.row);
    var col = parseInt(piece.dataset.col);
    var pieceValue = grid[row][col];

    var isRedPiece = pieceValue === RED || pieceValue === RED_KING;
    var isBlackPiece = pieceValue === BLACK || pieceValue === BLACK_KING;
    var isCurrentPlayerPiece = (currentPlayer === RED && isRedPiece) || (currentPlayer === BLACK && isBlackPiece);

    if (!isCurrentPlayerPiece) return;

    if (mustJumpFrom && (mustJumpFrom.row !== row || mustJumpFrom.col !== col)) {
      showToast('checkers_must_jump');
      return;
    }

    selectedPiece = { row: row, col: col };
    var moves = getValidMovesForPiece(row, col);

    if (mustJumpFrom) {
      moves = moves.filter(function(m) { return m.capture; });
    }

    var allMoves = getAllValidMoves(currentPlayer);
    var mustCapture = hasCaptureMoves(allMoves);

    if (mustCapture) {
      moves = moves.filter(function(m) { return m.capture; });
    }

    validMoves = moves;
    renderBoard();
  }

  function onSquareClick(e) {
    e.stopPropagation();
    if (gameOver || !selectedPiece || validMoves.length === 0) return;

    var row = parseInt(e.currentTarget.dataset.row);
    var col = parseInt(e.currentTarget.dataset.col);

    for (var m = 0; m < validMoves.length; m++) {
      if (validMoves[m].row === row && validMoves[m].col === col) {
        executeMove(selectedPiece.row, selectedPiece.col, row, col, validMoves[m]);
        return;
      }
    }
  }

  function startNewGame() {
    initBoard();
    currentPlayer = RED;
    selectedPiece = null;
    validMoves = [];
    mustJumpFrom = null;
    redCaptured = 0;
    blackCaptured = 0;
    gameOver = false;
    updateStats();
    renderBoard();
  }

  function toggleMode() {
    vsAI = !vsAI;
    if (modeBtn) {
      modeBtn.textContent = vsAI ? tr('checkers_vs_ai') : tr('checkers_vs_human');
    }
    startNewGame();
  }

  function initGame() {
    boardContainer = document.getElementById('board-container');
    checkerboard = document.getElementById('checkerboard');
    piecesOverlay = document.getElementById('pieces-overlay');
    turnIndicator = document.getElementById('turn-indicator');
    capturedCount = document.getElementById('captured-count');
    winsCount = document.getElementById('wins-count');
    newGameBtn = document.getElementById('btn-new-game');
    modeBtn = document.getElementById('btn-mode');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    winnerButtons = document.getElementById('winner-buttons');
    playAgainBtn = document.getElementById('btn-play-again');
    toast = document.getElementById('toast');

    var savedWins = localStorage.getItem('tablo-checkers-wins');
    if (savedWins) {
      redWins = parseInt(savedWins) || 0;
    }

    if (newGameBtn) {
      newGameBtn.addEventListener('click', function() {
        startNewGame();
        showToast('toast_restarted');
      });
    }

    if (modeBtn) {
      modeBtn.addEventListener('click', toggleMode);
    }

    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', function() {
        if (winnerModal) {
          winnerModal.classList.remove('visible');
          winnerModal.style.display = 'none';
        }
        startNewGame();
      });
    }

    startNewGame();
  }

  window.initGame = initGame;
})();