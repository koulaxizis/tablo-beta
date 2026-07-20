// ============================================
// Tablo — Gomoku (Five in a Row)
// ============================================

(function() {
  'use strict';

  var SIZE = 15;
  var CELL = 36;
  var PADDING = 18;
  var board = [];
  var currentPlayer = 1; // 1 = black, 2 = white
  var moveCount = 0;
  var gameMode = 'pvp';
  var history = [];
  var gameOver = false;
  var aiThinking = false;
  var lastMove = null;
  var winningLine = null;

  var canvas, ctx;
  var turnEl, modeEl, moveNumEl;
  var modeSelect, newGameBtn, undoBtn, retryBtn;
  var gameOverModal, modalIcon, modalTitle, modalMessage, toast;

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
    showToast._t = setTimeout(function() { toast.classList.remove('visible'); }, 2000);
  }

  function initBoard() {
    board = [];
    for (var r = 0; r < SIZE; r++) {
      var row = [];
      for (var c = 0; c < SIZE; c++) row.push(0);
      board.push(row);
    }
  }

  function getXY(r, c) {
    return {
      x: PADDING + c * CELL,
      y: PADDING + r * CELL
    };
  }

  function getCellFromMouse(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var x = (clientX - rect.left) * scaleX;
    var y = (clientY - rect.top) * scaleY;
    var c = Math.round((x - PADDING) / CELL);
    var r = Math.round((y - PADDING) / CELL);
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return null;
    return { r: r, c: c };
  }

  function drawBoard() {
    // Background
    ctx.fillStyle = '#d4a85a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 1;
    for (var i = 0; i < SIZE; i++) {
      var pos = PADDING + i * CELL;
      ctx.beginPath();
      ctx.moveTo(PADDING, pos);
      ctx.lineTo(PADDING + (SIZE - 1) * CELL, pos);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos, PADDING);
      ctx.lineTo(pos, PADDING + (SIZE - 1) * CELL);
      ctx.stroke();
    }

    // Star points (traditional Gomoku/Go star positions)
    var stars = [[3,3],[3,11],[7,7],[11,3],[11,11]];
    ctx.fillStyle = '#8b6914';
    for (var s = 0; s < stars.length; s++) {
      var sp = getXY(stars[s][0], stars[s][1]);
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stones
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (board[r][c]) {
          drawStone(r, c, board[r][c]);
        }
      }
    }

    // Last move indicator
    if (lastMove && !gameOver) {
      var lp = getXY(lastMove[0], lastMove[1]);
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lp.x, lp.y, CELL / 2 - 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Winning line
    if (winningLine) {
      var start = getXY(winningLine[0][0], winningLine[0][1]);
      var end = getXY(winningLine[4][0], winningLine[4][1]);
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }

  function drawStone(r, c, player) {
    var pos = getXY(r, c);
    var radius = CELL / 2 - 3;

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);

    if (player === 1) {
      // Black stone with gradient
      var grad = ctx.createRadialGradient(pos.x - radius/3, pos.y - radius/3, 1, pos.x, pos.y, radius);
      grad.addColorStop(0, '#444');
      grad.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = grad;
    } else {
      // White stone with gradient
      var grad2 = ctx.createRadialGradient(pos.x - radius/3, pos.y - radius/3, 1, pos.x, pos.y, radius);
      grad2.addColorStop(0, '#fff');
      grad2.addColorStop(1, '#bbb');
      ctx.fillStyle = grad2;
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function placeStone(r, c, player) {
    board[r][c] = player;
    lastMove = [r, c];
    moveCount++;
    moveNumEl.textContent = moveCount;

    var win = checkWin(r, c, player);
    if (win) {
      gameOver = true;
      winningLine = win;
      drawBoard();
      endGame(player);
      return true;
    }

    currentPlayer = player === 1 ? 2 : 1;
    updateUI();
    return true;
  }

  function checkWin(r, c, player) {
    var directions = [[0,1],[1,0],[1,1],[1,-1]];
    for (var d = 0; d < directions.length; d++) {
      var dr = directions[d][0];
      var dc = directions[d][1];
      var line = [[r, c]];
      // Forward
      for (var i = 1; i < 5; i++) {
        var nr = r + dr * i;
        var nc = c + dc * i;
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) break;
        if (board[nr][nc] !== player) break;
        line.push([nr, nc]);
      }
      // Backward
      for (var j = 1; j < 5; j++) {
        var nr2 = r - dr * j;
        var nc2 = c - dc * j;
        if (nr2 < 0 || nr2 >= SIZE || nc2 < 0 || nc2 >= SIZE) break;
        if (board[nr2][nc2] !== player) break;
        line.unshift([nr2, nc2]);
      }
      if (line.length >= 5) {
        return [line[0], line[1], line[2], line[3], line[4]];
      }
    }
    return null;
  }

  function handleClick(r, c) {
    if (gameOver || aiThinking) return;
    if (board[r][c] !== 0) return;

    if (gameMode === 'ai' && currentPlayer === 2) return;

    history.push({ r: r, c: c, player: currentPlayer });
    placeStone(r, c, currentPlayer);

    if (!gameOver && gameMode === 'ai' && currentPlayer === 2) {
      aiThinking = true;
      updateUI();
      setTimeout(aiMove, 500);
    }
  }

  // --- AI ---
  function aiMove() {
    aiThinking = false;
    if (gameOver) return;

    var best = findBestMove(2);
    if (!best) {
      // Fallback: center or nearby
      best = [7, 7];
      if (board[7][7] !== 0) {
        for (var r = 6; r <= 8 && !best; r++) {
          for (var c = 6; c <= 8 && !best; c++) {
            if (board[r][c] === 0) best = [r, c];
          }
        }
      }
    }

    history.push({ r: best[0], c: best[1], player: 2 });
    placeStone(best[0], best[1], 2);
  }

  function findBestMove(player) {
    var opponent = player === 1 ? 2 : 1;
    var bestScore = -1;
    var bestMoves = [];

    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (board[r][c] !== 0) continue;
        // Only consider cells near existing stones
        if (!hasNeighbor(r, c, 2)) continue;

        var myScore = evaluatePosition(r, c, player);
        var oppScore = evaluatePosition(r, c, opponent);
        var score = Math.max(myScore, oppScore * 0.9);

        if (score > bestScore) {
          bestScore = score;
          bestMoves = [[r, c]];
        } else if (score === bestScore) {
          bestMoves.push([r, c]);
        }
      }
    }

    if (bestMoves.length === 0) return null;
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  function hasNeighbor(r, c, dist) {
    for (var dr = -dist; dr <= dist; dr++) {
      for (var dc = -dist; dc <= dist; dc++) {
        if (dr === 0 && dc === 0) continue;
        var nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] !== 0) return true;
      }
    }
    return false;
  }

  function evaluatePosition(r, c, player) {
    var totalScore = 0;
    var directions = [[0,1],[1,0],[1,1],[1,-1]];

    for (var d = 0; d < directions.length; d++) {
      var dr = directions[d][0];
      var dc = directions[d][1];
      var count = 1;
      var openEnds = 0;

      // Forward
      var fr = r + dr, fc = c + dc;
      while (fr >= 0 && fr < SIZE && fc >= 0 && fc < SIZE && board[fr][fc] === player) {
        count++;
        fr += dr; fc += dc;
      }
      if (fr >= 0 && fr < SIZE && fc >= 0 && fc < SIZE && board[fr][fc] === 0) openEnds++;

      // Backward
      var br = r - dr, bc = c - dc;
      while (br >= 0 && br < SIZE && bc >= 0 && bc < SIZE && board[br][bc] === player) {
        count++;
        br -= dr; bc -= dc;
      }
      if (br >= 0 && br < SIZE && bc >= 0 && bc < SIZE && board[br][bc] === 0) openEnds++;

      totalScore += scorePattern(count, openEnds);
    }

    return totalScore;
  }

  function scorePattern(count, openEnds) {
    if (count >= 5) return 100000;
    if (count === 4) {
      if (openEnds === 2) return 10000;
      if (openEnds === 1) return 1000;
    }
    if (count === 3) {
      if (openEnds === 2) return 500;
      if (openEnds === 1) return 100;
    }
    if (count === 2) {
      if (openEnds === 2) return 50;
      if (openEnds === 1) return 10;
    }
    if (count === 1) {
      if (openEnds === 2) return 5;
      if (openEnds === 1) return 1;
    }
    return 0;
  }

  function undo() {
    if (aiThinking) return;
    if (history.length === 0) {
      showToast(tr('gomoku_no_undo'));
      return;
    }
    var last = history.pop();
    board[last.r][last.c] = 0;
    moveCount--;
    moveNumEl.textContent = moveCount;
    currentPlayer = last.player;
    lastMove = history.length > 0 ? [history[history.length - 1].r, history[history.length - 1].c] : null;

    // In AI mode, undo two moves (player + AI)
    if (gameMode === 'ai' && history.length > 0) {
      var prev = history.pop();
      board[prev.r][prev.c] = 0;
      moveCount--;
      moveNumEl.textContent = moveCount;
      currentPlayer = prev.player;
      lastMove = history.length > 0 ? [history[history.length - 1].r, history[history.length - 1].c] : null;
    }

    gameOver = false;
    winningLine = null;
    drawBoard();
    updateUI();
  }

  function updateUI() {
    if (aiThinking) {
      turnEl.textContent = '...';
    } else {
      turnEl.textContent = currentPlayer === 1 ? tr('gomoku_black') : tr('gomoku_white');
    }
    modeEl.textContent = gameMode === 'pvp' ? tr('ttt_pvp') : tr('ttt_vs_ai');
  }

  function endGame(winner) {
    var winnerName = winner === 1 ? tr('gomoku_black') : tr('gomoku_white');
    modalIcon.innerHTML = '&#127942;';
    modalTitle.textContent = tr('gomoku_win');
    modalMessage.textContent = winnerName + ' ' + tr('gomoku_wins') + '! (' + moveCount + ' ' + tr('gomoku_moves') + ')';

    // Save best (fewest moves to win)
    var key = 'tablo-gomoku-best-' + gameMode;
    var best = parseInt(localStorage.getItem(key) || '999');
    if (moveCount < best) localStorage.setItem(key, moveCount.toString());

    gameOverModal.classList.add('visible');
    gameOverModal.style.display = 'flex';
  }

  function newGame() {
    initBoard();
    currentPlayer = 1;
    moveCount = 0;
    history = [];
    gameOver = false;
    aiThinking = false;
    lastMove = null;
    winningLine = null;
    gameOverModal.classList.remove('visible');
    gameOverModal.style.display = 'none';
    moveNumEl.textContent = '0';
    drawBoard();
    updateUI();
  }

  function initGame() {
    canvas = document.getElementById('gomoku-canvas');
    ctx = canvas.getContext('2d');
    turnEl = document.getElementById('turn-display');
    modeEl = document.getElementById('mode-display');
    moveNumEl = document.getElementById('move-count');
    modeSelect = document.getElementById('game-mode-select');
    newGameBtn = document.getElementById('btn-new-game');
    undoBtn = document.getElementById('btn-undo');
    retryBtn = document.getElementById('btn-retry');
    gameOverModal = document.getElementById('game-over-modal');
    modalIcon = document.getElementById('modal-icon');
    modalTitle = document.getElementById('modal-title');
    modalMessage = document.getElementById('modal-message');
    toast = document.getElementById('toast');

    modeSelect.value = 'pvp';

    modeSelect.addEventListener('change', function() {
      gameMode = this.value;
      newGame();
      showToast(tr('toast_restarted'));
    });

    newGameBtn.addEventListener('click', function() {
      newGame();
      showToast(tr('toast_restarted'));
    });

    undoBtn.addEventListener('click', undo);

    retryBtn.addEventListener('click', newGame);

    canvas.addEventListener('click', function(e) {
      var cell = getCellFromMouse(e.clientX, e.clientY);
      if (cell) handleClick(cell.r, cell.c);
    });

    canvas.addEventListener('touchend', function(e) {
      e.preventDefault();
      if (e.changedTouches.length === 0) return;
      var touch = e.changedTouches[0];
      var cell = getCellFromMouse(touch.clientX, touch.clientY);
      if (cell) handleClick(cell.r, cell.c);
    }, { passive: false });

    newGame();
  }

  window.initGame = initGame;
})();