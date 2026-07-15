// ============================================
// Tablo — Bubble Shooter Game
// ============================================

(function() {
  'use strict';

  var canvas, ctx;
  var scoreEl, levelEl, restartBtn, playAgainBtn, gameOverModal, finalScoreEl, toast;

  var BUBBLE_RADIUS = 14;
  var COLS = 11;
  var ROWS_INITIAL = 5;
  var ROWS_MAX = 14;
  var grid = [];
  var currentBubble = null;
  var nextBubble = null;
  var shooting = false;
  var shotBubble = null;
  var shotDx = 0;
  var shotDy = 0;
  var aimAngle = -Math.PI / 2;
  var score = 0;
  var level = 1;
  var gameOver = false;
  var animId = null;

  var COLORS = ['#2dd4bf', '#f59e0b', '#a78bfa', '#4ade80', '#f87171', '#60a5fa'];

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function() {
      toast.classList.remove('visible');
    }, 2500);
  }

  function randColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  function initGrid() {
    grid = [];
    for (var r = 0; r < ROWS_INITIAL; r++) {
      var row = [];
      for (var c = 0; c < COLS; c++) {
        row.push(randColor());
      }
      grid.push(row);
    }
  }

  function getBubbleCenter(row, col) {
    var offset = (row % 2 === 1) ? BUBBLE_RADIUS : 0;
    var x = col * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + offset;
    var y = row * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS;
    return { x: x, y: y };
  }

  function drawGrid() {
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        if (grid[r][c]) {
          var pos = getBubbleCenter(r, c);
          drawBubble(pos.x, pos.y, grid[r][c]);
        }
      }
    }
  }

  function drawBubble(x, y, color) {
    ctx.beginPath();
    ctx.arc(x, y, BUBBLE_RADIUS - 1, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawAimer() {
    var sx = canvas.width / 2;
    var sy = canvas.height - BUBBLE_RADIUS - 5;
    var len = 80;
    var ex = sx + Math.cos(aimAngle) * len;
    var ey = sy + Math.sin(aimAngle) * len;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawCurrent() {
    if (currentBubble) {
      drawBubble(canvas.width / 2, canvas.height - BUBBLE_RADIUS - 5, currentBubble);
    }
  }

  function drawShot() {
    if (shotBubble) {
      drawBubble(shotBubble.x, shotBubble.y, shotBubble.color);
    }
  }

  function render() {
    var bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-surface').trim() || '#16242f';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    if (!shooting && !gameOver) drawAimer();
    drawCurrent();
    drawShot();
  }

  function snapToGrid(x, y, color) {
    var col = Math.round((x - BUBBLE_RADIUS) / (BUBBLE_RADIUS * 2));
    var row = Math.round((y - BUBBLE_RADIUS) / (BUBBLE_RADIUS * 2));

    col = Math.max(0, Math.min(col, COLS - 1));
    row = Math.max(0, Math.min(row, ROWS_MAX - 1));

    while (grid.length <= row) {
      grid.push(new Array(COLS).fill(null));
    }

    var offset = (row % 2 === 1) ? 1 : 0;
    if (offset && col === COLS - 1) col = COLS - 2;

    grid[row][col] = color;

    popMatches(row, col, color);
    checkGameOver();
  }

  function popMatches(row, col, color) {
    var matched = [];
    var visited = {};
    var stack = [[row, col]];

    while (stack.length > 0) {
      var pos = stack.pop();
      var r = pos[0], c = pos[1];
      var key = r + ',' + c;
      if (visited[key]) continue;
      visited[key] = true;

      if (r < 0 || r >= grid.length || c < 0 || c >= grid[r].length) continue;
      if (grid[r][c] !== color) continue;

      matched.push([r, c]);

      var offsets = (r % 2 === 1) ?
        [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]] :
        [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];

      for (var i = 0; i < offsets.length; i++) {
        stack.push([r + offsets[i][0], c + offsets[i][1]]);
      }
    }

    if (matched.length >= 3) {
      matched.forEach(function(pos) {
        grid[pos[0]][pos[1]] = null;
      });
      score += matched.length * 10 * level;
      scoreEl.textContent = score;
      removeFloating();
    }
  }

  function removeFloating() {
    var connected = {};
    var stack = [];
    for (var c = 0; c < COLS; c++) {
      if (grid[0] && grid[0][c]) stack.push([0, c]);
    }
    while (stack.length > 0) {
      var pos = stack.pop();
      var r = pos[0], c2 = pos[1];
      var key = r + ',' + c2;
      if (connected[key]) continue;
      connected[key] = true;
      if (r < 0 || r >= grid.length || c2 < 0 || c2 >= grid[r].length) continue;
      if (!grid[r][c2]) continue;

      var offsets = (r % 2 === 1) ?
        [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]] :
        [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];

      for (var i = 0; i < offsets.length; i++) {
        stack.push([r + offsets[i][0], c2 + offsets[i][1]]);
      }
    }

    for (var r2 = 0; r2 < grid.length; r2++) {
      for (var c3 = 0; c3 < grid[r2].length; c3++) {
        if (grid[r2][c3] && !connected[r2 + ',' + c3]) {
          grid[r2][c3] = null;
          score += 5 * level;
        }
      }
    }
    scoreEl.textContent = score;
  }

  function checkGameOver() {
    var lowestY = 0;
    for (var r = grid.length - 1; r >= 0; r--) {
      for (var c = 0; c < grid[r].length; c++) {
        if (grid[r][c]) {
          var pos = getBubbleCenter(r, c);
          if (pos.y + BUBBLE_RADIUS > canvas.height - BUBBLE_RADIUS * 3) {
            endGame();
            return;
          }
        }
      }
    }

    if (isGridEmpty()) {
      levelUp();
    }
  }

  function isGridEmpty() {
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        if (grid[r][c]) return false;
      }
    }
    return true;
  }

  function levelUp() {
    level++;
    levelEl.textContent = level;
    addNewRow();
  }

  function addNewRow() {
    var newRow = [];
    for (var c = 0; c < COLS; c++) newRow.push(randColor());
    grid.unshift(newRow);
  }

  function endGame() {
    gameOver = true;
    finalScoreEl.textContent = score;
    gameOverModal.classList.add('visible');
    var bestKey = 'tablo-bubble-best';
    var best = parseInt(localStorage.getItem(bestKey) || '0');
    if (score > best) localStorage.setItem(bestKey, score);
  }

  function shoot() {
    if (shooting || gameOver || !currentBubble) return;
    shooting = true;
    var speed = 8;
    shotDx = Math.cos(aimAngle) * speed;
    shotDy = Math.sin(aimAngle) * speed;
    shotBubble = {
      x: canvas.width / 2,
      y: canvas.height - BUBBLE_RADIUS - 5,
      color: currentBubble
    };
    currentBubble = null;
  }

  function updateShot() {
    if (!shotBubble) return;
    shotBubble.x += shotDx;
    shotBubble.y += shotDy;

    if (shotBubble.x - BUBBLE_RADIUS < 0) {
      shotBubble.x = BUBBLE_RADIUS;
      shotDx = -shotDx;
    }
    if (shotBubble.x + BUBBLE_RADIUS > canvas.width) {
      shotBubble.x = canvas.width - BUBBLE_RADIUS;
      shotDx = -shotDx;
    }
    if (shotBubble.y - BUBBLE_RADIUS < 0) {
      snapToGrid(shotBubble.x, shotBubble.y, shotBubble.color);
      shotBubble = null;
      shooting = false;
      currentBubble = nextBubble;
      nextBubble = randColor();
      return;
    }

    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        if (grid[r][c]) {
          var pos = getBubbleCenter(r, c);
          var dx = shotBubble.x - pos.x;
          var dy = shotBubble.y - pos.y;
          if (dx * dx + dy * dy < (BUBBLE_RADIUS * 2 - 2) * (BUBBLE_RADIUS * 2 - 2)) {
            snapToGrid(shotBubble.x, shotBubble.y, shotBubble.color);
            shotBubble = null;
            shooting = false;
            currentBubble = nextBubble;
            nextBubble = randColor();
            return;
          }
        }
      }
    }
  }

  function loop() {
    if (gameOver) return;
    if (shooting) updateShot();
    render();
    animId = requestAnimationFrame(loop);
  }

  function startGame() {
    gameOver = false;
    score = 0;
    level = 1;
    scoreEl.textContent = '0';
    levelEl.textContent = '1';
    initGrid();
    currentBubble = randColor();
    nextBubble = randColor();
    shooting = false;
    shotBubble = null;
    gameOverModal.classList.remove('visible');
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  function init() {
    canvas = document.getElementById('bubble-canvas');
    ctx = canvas.getContext('2d');
    scoreEl = document.getElementById('score');
    levelEl = document.getElementById('level');
    restartBtn = document.getElementById('btn-restart');
    playAgainBtn = document.getElementById('btn-play-again');
    gameOverModal = document.getElementById('game-over-modal');
    finalScoreEl = document.getElementById('final-score');
    toast = document.getElementById('toast');

    if (restartBtn) {
      restartBtn.addEventListener('click', function() {
        startGame();
        showToast('Game restarted');
      });
    }

    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', function() {
        startGame();
      });
    }

    if (canvas) {
      canvas.addEventListener('mousemove', function(e) {
        var rect = canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var sx = canvas.width / 2;
        var sy = canvas.height - BUBBLE_RADIUS - 5;
        aimAngle = Math.atan2(my - sy, mx - sx);
        if (aimAngle > -0.1) aimAngle = -0.1;
        if (aimAngle < -Math.PI + 0.1) aimAngle = -Math.PI + 0.1;
      });

      canvas.addEventListener('click', function(e) {
        shoot();
      });

      canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        var rect = canvas.getBoundingClientRect();
        var touch = e.touches[0];
        var mx = touch.clientX - rect.left;
        var my = touch.clientY - rect.top;
        var sx = canvas.width / 2;
        var sy = canvas.height - BUBBLE_RADIUS - 5;
        aimAngle = Math.atan2(my - sy, mx - sx);
        if (aimAngle > -0.1) aimAngle = -0.1;
        if (aimAngle < -Math.PI + 0.1) aimAngle = -Math.PI + 0.1;
      }, { passive: false });

      canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        shoot();
      }, { passive: false });
    }

    startGame();
  }

  window.initGame = init;
})();