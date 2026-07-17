// ============================================
// Tablo — Snake
// ============================================

(function() {
  'use strict';

  var CELL_SIZE = 18;
  var GRID_COLS = 20;
  var GRID_ROWS = 20;
  var TICK_SPEED = 120;

  var canvas = document.getElementById('snake-canvas');
  var ctx = canvas ? canvas.getContext('2d') : null;

  var snake = [];
  var direction = { x: 1, y: 0 };
  var pendingDir = { x: 1, y: 0 };
  var food = { x: 10, y: 10 };
  var score = 0;
  var bestScore = 0;
  var gameRunning = false;
  var gamePaused = false;
  var loopInterval = null;

  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best-score');
  var lengthEl = document.getElementById('length');
  var startBtn = document.getElementById('btn-start');
  var pauseBtn = document.getElementById('btn-pause');
  var retryBtn = document.getElementById('btn-retry');
  var gameOverModal = document.getElementById('game-over-modal');
  var finalScoreEl = document.getElementById('final-score');
  var toast = document.getElementById('toast');

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

  function initSnake() {
    snake = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    pendingDir = { x: 1, y: 0 };
    score = 0;
    if (scoreEl) scoreEl.textContent = '0';
    if (lengthEl) lengthEl.textContent = '3';
    spawnFood();
  }

  function spawnFood() {
    var valid = false;
    while (!valid) {
      food.x = Math.floor(Math.random() * GRID_COLS);
      food.y = Math.floor(Math.random() * GRID_ROWS);
      valid = true;
      for (var i = 0; i < snake.length; i++) {
        if (snake[i].x === food.x && snake[i].y === food.y) {
          valid = false;
          break;
        }
      }
    }
  }

  function tick() {
    if (gamePaused) return;

    direction = pendingDir;

    var head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y
    };

    if (head.x < 0 || head.x >= GRID_COLS || head.y < 0 || head.y >= GRID_ROWS) {
      endGame();
      return;
    }

    for (var i = 0; i < snake.length; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        endGame();
        return;
      }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score++;
      if (scoreEl) scoreEl.textContent = score;
      if (lengthEl) lengthEl.textContent = snake.length;
      spawnFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function draw() {
    if (!ctx) return;

    ctx.fillStyle = '#0f1923';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (var i = 0; i <= GRID_COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();
    }
    for (var j = 0; j <= GRID_ROWS; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * CELL_SIZE);
      ctx.lineTo(canvas.width, j * CELL_SIZE);
      ctx.stroke();
    }

    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    var fx = food.x * CELL_SIZE + CELL_SIZE / 2;
    var fy = food.y * CELL_SIZE + CELL_SIZE / 2;
    ctx.arc(fx, fy, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    for (var k = 0; k < snake.length; k++) {
      if (k === 0) {
        ctx.fillStyle = '#5eead4';
      } else {
        ctx.fillStyle = '#2dd4bf';
      }
      var sx = snake[k].x * CELL_SIZE;
      var sy = snake[k].y * CELL_SIZE;
      ctx.fillRect(sx + 1, sy + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    }
  }

  function startGame() {
    initSnake();
    gameRunning = true;
    gamePaused = false;
    if (gameOverModal) gameOverModal.classList.remove('visible');
    if (startBtn) startBtn.textContent = tr('snake_restart');
    if (pauseBtn) pauseBtn.disabled = false;

    if (loopInterval) clearInterval(loopInterval);
    loopInterval = setInterval(tick, TICK_SPEED);
    draw();
  }

  function togglePause() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    if (pauseBtn) pauseBtn.textContent = gamePaused ? tr('snake_resume') : tr('snake_pause');
  }

  function endGame() {
    gameRunning = false;
    if (loopInterval) clearInterval(loopInterval);

    if (score > bestScore) {
      bestScore = score;
      if (bestEl) bestEl.textContent = bestScore;
      localStorage.setItem('tablo-snake-best', bestScore.toString());
    }

    if (finalScoreEl) finalScoreEl.textContent = tr('snake_score') + ': ' + score;
    if (gameOverModal) gameOverModal.classList.add('visible');
    if (startBtn) startBtn.textContent = tr('snake_start');
    if (pauseBtn) {
      pauseBtn.textContent = tr('snake_pause');
      pauseBtn.disabled = true;
    }
  }

  function setDirection(dx, dy) {
    if (direction.x === -dx && direction.y === -dy) return;
    if (dx === 0 && dy === 0) return;
    pendingDir = { x: dx, y: dy };
  }

  function handleKey(e) {
    if (!gameRunning) return;
    var key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'w') { setDirection(0, -1); e.preventDefault(); }
    else if (key === 'arrowdown' || key === 's') { setDirection(0, 1); e.preventDefault(); }
    else if (key === 'arrowleft' || key === 'a') { setDirection(-1, 0); e.preventDefault(); }
    else if (key === 'arrowright' || key === 'd') { setDirection(1, 0); e.preventDefault(); }
    else if (key === ' ') { togglePause(); e.preventDefault(); }
  }

  function initGame() {
    var saved = localStorage.getItem('tablo-snake-best');
    if (saved) {
      bestScore = parseInt(saved) || 0;
      if (bestEl) bestEl.textContent = bestScore;
    }

    initSnake();
    draw();

    document.addEventListener('keydown', handleKey);

    if (canvas) {
      var touchStartX = 0, touchStartY = 0;

      canvas.addEventListener('touchstart', function(e) {
        var t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        e.preventDefault();
      }, { passive: false });

      canvas.addEventListener('touchend', function(e) {
        var t = e.changedTouches[0];
        var dx = t.clientX - touchStartX;
        var dy = t.clientY - touchStartY;
        var absX = Math.abs(dx);
        var absY = Math.abs(dy);

        if (absX < 20 && absY < 20) return;

        if (absX > absY) {
          setDirection(dx > 0 ? 1 : -1, 0);
        } else {
          setDirection(0, dy > 0 ? 1 : -1);
        }
        e.preventDefault();
      }, { passive: false });
    }

    if (startBtn) {
      startBtn.addEventListener('click', startGame);
    }
    if (pauseBtn) {
      pauseBtn.addEventListener('click', togglePause);
      pauseBtn.disabled = true;
    }
    if (retryBtn) {
      retryBtn.addEventListener('click', startGame);
    }

    var dpadBtns = document.querySelectorAll('.dpad-btn');
    dpadBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var dir = btn.dataset.dir;
        if (dir === 'up') setDirection(0, -1);
        else if (dir === 'down') setDirection(0, 1);
        else if (dir === 'left') setDirection(-1, 0);
        else if (dir === 'right') setDirection(1, 0);
      });
    });
  }

  window.initGame = initGame;
})();