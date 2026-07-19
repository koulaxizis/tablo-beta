// ============================================
// Tablo — Tetris Game
// ============================================

(function() {
  'use strict';

  var COLS = 10;
  var ROWS = 20;
  var BLOCK_SIZE = 24;

  var COLORS = [
    '#2dd4bf', // I
    '#f59e0b', // O
    '#a78bfa', // T
    '#4ade80', // S
    '#f87171', // Z
    '#60a5fa', // J
    '#fbbf24'  // L
  ];

  var SHAPES = [
    [[1,1,1,1]],                    // I
    [[1,1],[1,1]],                  // O
    [[0,1,0],[1,1,1]],             // T
    [[0,1,1],[1,1,0]],             // S
    [[1,1,0],[0,1,1]],             // Z
    [[1,0,0],[1,1,1]],             // J
    [[0,0,1],[1,1,1]]              // L
  ];

  var board = [];
  var currentPiece = null;
  var nextPiece = null;
  var score = 0;
  var lines = 0;
  var level = 1;
  var dropInterval = 1000;
  var lastDrop = 0;
  var gameOver = false;
  var running = false;
  var paused = false;
  var animId = null;

  var canvas, ctx, nextCanvas, nextCtx;
  var scoreEl, linesEl, levelEl, bestEl;
  var gameOverModal, modalTitle, modalMessage;
  var startBtn, pauseBtn, playAgainBtn, toast;

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
    }, 2000);
  }

  function createBoard() {
    board = [];
    for (var r = 0; r < ROWS; r++) {
      var row = [];
      for (var c = 0; c < COLS; c++) row.push(0);
      board.push(row);
    }
  }

  function randomPiece() {
    var idx = Math.floor(Math.random() * SHAPES.length);
    var shape = SHAPES[idx].map(function(row) { return row.slice(); });
    return {
      shape: shape,
      color: COLORS[idx],
      x: Math.floor((COLS - shape[0].length) / 2),
      y: 0
    };
  }

  function collides(piece, dx, dy) {
    var nx = piece.x + dx;
    var ny = piece.y + dy;
    for (var r = 0; r < piece.shape.length; r++) {
      for (var c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        var x = nx + c;
        var y = ny + r;
        if (x < 0 || x >= COLS || y >= ROWS) return true;
        if (y >= 0 && board[y][x]) return true;
      }
    }
    return false;
  }

  function rotateShape(shape) {
    var rows = shape.length;
    var cols = shape[0].length;
    var newShape = [];
    for (var c = 0; c < cols; c++) {
      var newRow = [];
      for (var r = rows - 1; r >= 0; r--) {
        newRow.push(shape[r][c]);
      }
      newShape.push(newRow);
    }
    return newShape;
  }

  function lockPiece() {
    for (var r = 0; r < currentPiece.shape.length; r++) {
      for (var c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
          var x = currentPiece.x + c;
          var y = currentPiece.y + r;
          if (y >= 0) board[y][x] = currentPiece.color;
        }
      }
    }
    clearLines();
    currentPiece = nextPiece;
    nextPiece = randomPiece();
    if (collides(currentPiece, 0, 0)) {
      endGame();
    }
    drawNext();
  }

  function clearLines() {
    var cleared = 0;
    for (var r = ROWS - 1; r >= 0; r--) {
      var full = true;
      for (var c = 0; c < COLS; c++) {
        if (!board[r][c]) { full = false; break; }
      }
      if (full) {
        board.splice(r, 1);
        var emptyRow = [];
        for (var c = 0; c < COLS; c++) emptyRow.push(0);
        board.unshift(emptyRow);
        cleared++;
        r++;
      }
    }
    if (cleared > 0) {
      var points = [0, 100, 300, 500, 800];
      score += points[cleared] * level;
      lines += cleared;
      level = Math.floor(lines / 10) + 1;
      dropInterval = Math.max(100, 1000 - (level - 1) * 80);
      scoreEl.textContent = score;
      linesEl.textContent = lines;
      levelEl.textContent = level;
      saveBest();
    }
  }

  function saveBest() {
    var best = parseInt(localStorage.getItem('tablo-tetris-best') || '0');
    if (score > best) {
      localStorage.setItem('tablo-tetris-best', score.toString());
      bestEl.textContent = score;
    }
  }

  function loadBest() {
    var best = parseInt(localStorage.getItem('tablo-tetris-best') || '0');
    bestEl.textContent = best;
  }

  function drawCell(c, r, color, context) {
    var px = c * BLOCK_SIZE;
    var py = r * BLOCK_SIZE;
    context.fillStyle = color;
    context.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
  }

  function draw() {
    ctx.fillStyle = '#16242f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (board[r][c]) {
          drawCell(c, r, board[r][c], ctx);
        }
      }
    }

    if (currentPiece) {
      for (var r = 0; r < currentPiece.shape.length; r++) {
        for (var c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            drawCell(currentPiece.x + c, currentPiece.y + r, currentPiece.color, ctx);
          }
        }
      }
    }
  }

  function drawNext() {
    nextCtx.fillStyle = '#0f1923';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!nextPiece) return;
    var size = 20;
    var offsetX = (nextCanvas.width - nextPiece.shape[0].length * size) / 2;
    var offsetY = (nextCanvas.height - nextPiece.shape.length * size) / 2;
    for (var r = 0; r < nextPiece.shape.length; r++) {
      for (var c = 0; c < nextPiece.shape[r].length; c++) {
        if (nextPiece.shape[r][c]) {
          nextCtx.fillStyle = nextPiece.color;
          nextCtx.fillRect(offsetX + c * size + 1, offsetY + r * size + 1, size - 2, size - 2);
        }
      }
    }
  }

  function move(dx) {
    if (!currentPiece || gameOver || paused) return;
    if (!collides(currentPiece, dx, 0)) {
      currentPiece.x += dx;
      draw();
    }
  }

  function rotate() {
    if (!currentPiece || gameOver || paused) return;
    var rotated = rotateShape(currentPiece.shape);
    var test = { shape: rotated, x: currentPiece.x, y: currentPiece.y, color: currentPiece.color };
    var kicks = [0, -1, 1, -2, 2];
    for (var i = 0; i < kicks.length; i++) {
      if (!collides(test, kicks[i], 0)) {
        test.x += kicks[i];
        currentPiece = test;
        draw();
        return;
      }
    }
  }

  function softDrop() {
    if (!currentPiece || gameOver || paused) return;
    if (!collides(currentPiece, 0, 1)) {
      currentPiece.y++;
      score++;
      scoreEl.textContent = score;
      draw();
    } else {
      lockPiece();
      draw();
    }
  }

  function hardDrop() {
    if (!currentPiece || gameOver || paused) return;
    while (!collides(currentPiece, 0, 1)) {
      currentPiece.y++;
      score += 2;
    }
    scoreEl.textContent = score;
    lockPiece();
    draw();
  }

  function loop(timestamp) {
    if (gameOver || !running || paused) return;
    if (!lastDrop) lastDrop = timestamp;
    if (timestamp - lastDrop > dropInterval) {
      if (!collides(currentPiece, 0, 1)) {
        currentPiece.y++;
      } else {
        lockPiece();
      }
      lastDrop = timestamp;
      draw();
    }
    animId = requestAnimationFrame(loop);
  }

  function endGame() {
    gameOver = true;
    running = false;
    if (animId) cancelAnimationFrame(animId);
    saveBest();
    modalTitle.textContent = tr('tetris_game_over');
    modalMessage.textContent = tr('tetris_final_score') + ': ' + score + ' • ' + tr('tetris_lines') + ': ' + lines;
    gameOverModal.classList.add('visible');
    gameOverModal.style.display = 'flex';
  }

  function togglePause() {
    if (gameOver || !running) return;
    paused = !paused;
    if (paused) {
      if (animId) cancelAnimationFrame(animId);
      pauseBtn.textContent = tr('tetris_resume');
    } else {
      pauseBtn.textContent = tr('tetris_pause');
      lastDrop = 0;
      animId = requestAnimationFrame(loop);
    }
  }

  function startGame() {
    gameOver = false;
    running = true;
    paused = false;
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    lastDrop = 0;
    createBoard();
    currentPiece = randomPiece();
    nextPiece = randomPiece();
    scoreEl.textContent = '0';
    linesEl.textContent = '0';
    levelEl.textContent = '1';
    pauseBtn.textContent = tr('tetris_pause');
    gameOverModal.classList.remove('visible');
    gameOverModal.style.display = 'none';
    draw();
    drawNext();
    animId = requestAnimationFrame(loop);
  }

  function initGame() {
    canvas = document.getElementById('tetris-canvas');
    ctx = canvas.getContext('2d');
    nextCanvas = document.getElementById('next-canvas');
    nextCtx = nextCanvas.getContext('2d');
    scoreEl = document.getElementById('score');
    linesEl = document.getElementById('lines');
    levelEl = document.getElementById('level');
    bestEl = document.getElementById('best');
    gameOverModal = document.getElementById('game-over-modal');
    modalTitle = document.getElementById('modal-title');
    modalMessage = document.getElementById('modal-message');
    startBtn = document.getElementById('btn-start');
    pauseBtn = document.getElementById('btn-pause');
    playAgainBtn = document.getElementById('btn-play-again');
    toast = document.getElementById('toast');

    loadBest();

    if (startBtn) {
      startBtn.addEventListener('click', function() {
        startGame();
        showToast(tr('toast_restarted'));
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', togglePause);
    }

    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', function() {
        startGame();
      });
    }

    document.addEventListener('keydown', function(e) {
      if (!running) return;
      if (e.key === 'p' || e.key === 'P') { e.preventDefault(); togglePause(); return; }
      if (paused) return;
      switch(e.key) {
        case 'ArrowLeft': e.preventDefault(); move(-1); break;
        case 'ArrowRight': e.preventDefault(); move(1); break;
        case 'ArrowUp': e.preventDefault(); rotate(); break;
        case 'ArrowDown': e.preventDefault(); softDrop(); break;
        case ' ': e.preventDefault(); hardDrop(); break;
      }
    });

    // Touch controls
    var touchStartX = 0;
    var touchStartY = 0;
    var touchStartTime = 0;
    if (canvas) {
      canvas.addEventListener('touchstart', function(e) {
        if (!running) return;
        e.preventDefault();
        var touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
      }, { passive: false });

      canvas.addEventListener('touchend', function(e) {
        if (!running) return;
        e.preventDefault();
        var touch = e.changedTouches[0];
        var dx = touch.clientX - touchStartX;
        var dy = touch.clientY - touchStartY;
        var dt = Date.now() - touchStartTime;

        if (dt < 200 && Math.abs(dx) < 15 && Math.abs(dy) < 15) {
          rotate();
        } else if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 30) move(1);
          else if (dx < -30) move(-1);
        } else {
          if (dy > 30) {
            if (dy > 80) hardDrop();
            else softDrop();
          }
        }
      }, { passive: false });
    }

    createBoard();
    draw();
  }

  window.initGame = initGame;
})();