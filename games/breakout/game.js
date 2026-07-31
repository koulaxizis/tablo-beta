// ============================================
// Tablo — Breakout
// ============================================

(function() {
  'use strict';

  console.log('[Breakout] game.js loaded');

  var canvas, ctx;
  var canvasWidth = 720;
  var canvasHeight = 500;

  var gameState = 'idle';
  var score = 0;
  var lives = 3;
  var level = 1;
  var animationId = null;

  var paddle = {
    x: 0,
    y: 0,
    width: 110,
    height: 14,
    speed: 8,
    dx: 0
  };

  var ball = {
    x: 0,
    y: 0,
    radius: 8,
    speed: 5,
    dx: 0,
    dy: 0
  };

  var bricks = [];
  var brickRows = 5;
  var brickCols = 10;
  var brickWidth = 60;
  var brickHeight = 22;
  var brickPadding = 8;
  var brickOffsetTop = 50;
  var brickOffsetLeft = 35;

  var brickColors = ['#ef4444', '#f59e0b', '#2dd4bf', '#3b82f6', '#a855f7'];
  var brickPoints = [50, 40, 30, 20, 10];

  var mouseX = 0;
  var leftPressed = false;
  var rightPressed = false;

  var scoreEl, livesEl, levelEl;
  var newGameBtn, pauseBtn, startBtn;
  var startOverlay;
  var winnerModal, winnerIcon, winnerTitle, winnerMessage, playAgainBtn;
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

  function initGame() {
    console.log('[Breakout] initGame() called');

    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

    scoreEl = document.getElementById('score');
    livesEl = document.getElementById('lives');
    levelEl = document.getElementById('level');
    newGameBtn = document.getElementById('btn-new-game');
    pauseBtn = document.getElementById('btn-pause');
    startBtn = document.getElementById('btn-start');
    startOverlay = document.getElementById('start-overlay');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    playAgainBtn = document.getElementById('btn-play-again');
    toast = document.getElementById('toast');

    // Fixed mouse/touch tracking for scaled canvas
    canvas.addEventListener('mousemove', function(e) {
      var rect = canvas.getBoundingClientRect();
      var scaleX = canvas.width / rect.width;
      mouseX = (e.clientX - rect.left) * scaleX;
    });

    canvas.addEventListener('touchmove', function(e) {
      e.preventDefault();
      var rect = canvas.getBoundingClientRect();
      var scaleX = canvas.width / rect.width;
      mouseX = (e.touches[0].clientX - rect.left) * scaleX;
    }, { passive: false });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft' || e.key === 'a') leftPressed = true;
      if (e.key === 'ArrowRight' || e.key === 'd') rightPressed = true;
      if (e.key === ' ' || e.key === 'p') {
        e.preventDefault();
        togglePause();
      }
    });

    document.addEventListener('keyup', function(e) {
      if (e.key === 'ArrowLeft' || e.key === 'a') leftPressed = false;
      if (e.key === 'ArrowRight' || e.key === 'd') rightPressed = false;
    });

    if (startBtn) startBtn.addEventListener('click', startGame);
    if (newGameBtn) newGameBtn.addEventListener('click', resetGame);
    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
    if (playAgainBtn) playAgainBtn.addEventListener('click', function() {
      if (winnerModal) winnerModal.classList.remove('visible');
      resetGame();
    });

    resetGame();
    console.log('[Breakout] Init complete');
  }

  function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    gameState = 'idle';
    initBricks();
    resetBall();
    resetPaddle();
    updateStats();
    if (startOverlay) {
      startOverlay.style.display = 'flex';
      var titleEl = startOverlay.querySelector('.start-title');
      var textEl = startOverlay.querySelector('.start-text');
      var btnEl = startOverlay.querySelector('#btn-start');
      if (titleEl) titleEl.textContent = tr('breakout_ready');
      if (textEl) textEl.textContent = tr('breakout_instructions');
      if (btnEl) btnEl.textContent = tr('breakout_start');
    }
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    draw();
  }

  function startGame() {
    if (startOverlay) startOverlay.style.display = 'none';
    gameState = 'playing';
    if (!animationId) gameLoop();
  }

  function togglePause() {
    if (gameState === 'playing') {
      gameState = 'paused';
      if (pauseBtn) pauseBtn.textContent = tr('breakout_resume');
    } else if (gameState === 'paused') {
      gameState = 'playing';
      if (pauseBtn) pauseBtn.textContent = tr('breakout_pause');
    }
  }

  function initBricks() {
    bricks = [];
    for (var r = 0; r < brickRows; r++) {
      bricks[r] = [];
      for (var c = 0; c < brickCols; c++) {
        bricks[r][c] = {
          x: brickOffsetLeft + c * (brickWidth + brickPadding),
          y: brickOffsetTop + r * (brickHeight + brickPadding),
          status: 1,
          color: brickColors[r % brickColors.length],
          points: brickPoints[r % brickPoints.length]
        };
      }
    }
  }

  function resetPaddle() {
    paddle.y = canvas.height - 40;
    paddle.x = (canvas.width - paddle.width) / 2;
    paddle.dx = 0;
  }

  function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 60;
    var baseSpeed = 5 + (level - 1) * 0.5;
    ball.speed = baseSpeed;
    var angle = (Math.random() * 60 - 30) * Math.PI / 180;
    ball.dx = ball.speed * Math.sin(angle);
    ball.dy = -ball.speed * Math.cos(angle);

    if (Math.abs(ball.dx) < 1.5) {
      ball.dx = ball.dx >= 0 ? 1.5 : -1.5;
    }
  }

  function updatePaddle() {
    if (leftPressed) {
      paddle.x -= paddle.speed;
    }
    if (rightPressed) {
      paddle.x += paddle.speed;
    }

    if (mouseX > 0 && !leftPressed && !rightPressed) {
      var target = mouseX - paddle.width / 2;
      paddle.x += (target - paddle.x) * 0.25;
    }

    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
  }

  function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x + ball.radius > canvas.width) {
      ball.x = canvas.width - ball.radius;
      ball.dx = -ball.dx;
    }
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.dx = -ball.dx;
    }
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.dy = -ball.dy;
    }

    if (ball.y + ball.radius >= paddle.y &&
        ball.y + ball.radius <= paddle.y + paddle.height + 5 &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width &&
        ball.dy > 0) {

      ball.y = paddle.y - ball.radius;

      var hitPos = (ball.x - paddle.x) / paddle.width;
      var angle = (hitPos - 0.5) * Math.PI * 0.6;
      ball.dx = ball.speed * Math.sin(angle);
      ball.dy = -ball.speed * Math.cos(angle);

      if (Math.abs(ball.dx) < 1.5) {
        ball.dx = ball.dx >= 0 ? 1.5 : -1.5;
      }
    }

    for (var r = 0; r < brickRows; r++) {
      for (var c = 0; c < brickCols; c++) {
        var b = bricks[r][c];
        if (b.status === 1) {
          if (ball.x + ball.radius > b.x &&
              ball.x - ball.radius < b.x + brickWidth &&
              ball.y + ball.radius > b.y &&
              ball.y - ball.radius < b.y + brickHeight) {

            b.status = 0;
            score += b.points;
            updateStats();

            var ballPrevX = ball.x - ball.dx;
            var hitFromSide = (ballPrevX + ball.radius <= b.x) || (ballPrevX - ball.radius >= b.x + brickWidth);

            if (hitFromSide) {
              ball.dx = -ball.dx;
            } else {
              ball.dy = -ball.dy;
            }

            checkLevelComplete();
            return;
          }
        }
      }
    }

    if (ball.y + ball.radius > canvas.height) {
      lives--;
      updateStats();

      if (lives <= 0) {
        gameState = 'lost';
        showLose();
      } else {
        resetBall();
        resetPaddle();
        gameState = 'idle';
        if (startOverlay) {
          var titleEl = startOverlay.querySelector('.start-title');
          var textEl = startOverlay.querySelector('.start-text');
          var btnEl = startOverlay.querySelector('#btn-start');
          if (titleEl) titleEl.textContent = tr('breakout_try_again');
          if (textEl) textEl.textContent = tr('breakout_lives_remaining') + ' ' + lives;
          if (btnEl) btnEl.textContent = tr('breakout_continue');
          startOverlay.style.display = 'flex';
        }
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      }
    }
  }

  function checkLevelComplete() {
    var remaining = 0;
    for (var r = 0; r < brickRows; r++) {
      for (var c = 0; c < brickCols; c++) {
        if (bricks[r][c].status === 1) remaining++;
      }
    }

    if (remaining === 0) {
      level++;
      score += 100;
      updateStats();

      if (level > 5) {
        gameState = 'won';
        showWin();
      } else {
        initBricks();
        resetBall();
        resetPaddle();
        gameState = 'idle';
        if (startOverlay) {
          var titleEl = startOverlay.querySelector('.start-title');
          var textEl = startOverlay.querySelector('.start-text');
          var btnEl = startOverlay.querySelector('#btn-start');
          if (titleEl) titleEl.textContent = tr('breakout_level') + ' ' + level;
          if (textEl) textEl.textContent = tr('breakout_get_ready');
          if (btnEl) btnEl.textContent = tr('breakout_start');
          startOverlay.style.display = 'flex';
        }
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      }
    }
  }

  function updateStats() {
    if (scoreEl) scoreEl.textContent = score;
    if (livesEl) livesEl.textContent = lives;
    if (levelEl) levelEl.textContent = level;
  }

  function drawBricks() {
    for (var r = 0; r < brickRows; r++) {
      for (var c = 0; c < brickCols; c++) {
        var b = bricks[r][c];
        if (b.status === 1) {
          ctx.fillStyle = b.color;
          ctx.fillRect(b.x, b.y, brickWidth, brickHeight);

          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(b.x, b.y, brickWidth, 4);

          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(b.x, b.y + brickHeight - 4, brickWidth, 4);
        }
      }
    }
  }

  function drawPaddle() {
    ctx.shadowColor = '#2dd4bf';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#2dd4bf';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;
  }

  function drawBall() {
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function draw() {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawBricks();
    drawPaddle();
    drawBall();

    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 32px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tr('breakout_paused'), canvas.width / 2, canvas.height / 2);
    }
  }

  function gameLoop() {
    if (gameState === 'playing') {
      updatePaddle();
      updateBall();
    }
    draw();
    animationId = requestAnimationFrame(gameLoop);
  }

  function showWin() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (winnerIcon) winnerIcon.textContent = '\u{1F389}';
    if (winnerTitle) winnerTitle.textContent = tr('breakout_you_win');
    if (winnerMessage) {
      winnerMessage.textContent = tr('breakout_win_message') + ' ' + score + ' ' + tr('breakout_points');
    }
    if (winnerModal) winnerModal.classList.add('visible');
  }

  function showLose() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (winnerIcon) winnerIcon.textContent = '\u{1F480}';
    if (winnerTitle) winnerTitle.textContent = tr('breakout_game_over');
    if (winnerMessage) {
      winnerMessage.textContent = tr('breakout_final_score') + ' ' + score + ' • ' + tr('breakout_level') + ' ' + level;
    }
    if (winnerModal) winnerModal.classList.add('visible');
  }

  window.initGame = initGame;
})();