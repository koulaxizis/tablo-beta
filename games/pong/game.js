// ============================================
// Tablo — Pong
// ============================================

(function() {
  'use strict';

  console.log('[Pong] game.js loaded');

  var WINNING_SCORE = 5;
  var CANVAS_WIDTH = 800;
  var CANVAS_HEIGHT = 450;
  var PADDLE_WIDTH = 12;
  var PADDLE_HEIGHT = 80;
  var BALL_SIZE = 12;
  var PADDLE_SPEED = 7;
  var BALL_SPEED_BASE = 5;
  var AI_SPEED = 4;

  var canvas, ctx;
  var paddle1Y, paddle2Y, ballX, ballY, ballDX, ballDY;
  var score1, score2;
  var gameRunning = false;
  var aiEnabled = false;
  var animationId = null;

  var keysPressed = {};
  var overlayEl, startBtn, resetBtn, modeSelect;
  var score1El, score2El;
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

  function resetBall() {
    ballX = CANVAS_WIDTH / 2;
    ballY = CANVAS_HEIGHT / 2;
    ballDX = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED_BASE;
    ballDY = (Math.random() * 2 - 1) * BALL_SPEED_BASE;
  }

  function resetPositions() {
    paddle1Y = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
    paddle2Y = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
    resetBall();
  }

  function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawCircle(x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawNet() {
    for (var i = 0; i < CANVAS_HEIGHT; i += 20) {
      drawRect(CANVAS_WIDTH / 2 - 1, i, 2, 10, 'rgba(45, 212, 211, 0.3)');
    }
  }

  function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawNet();

    drawRect(10, paddle1Y, PADDLE_WIDTH, PADDLE_HEIGHT, '#2dd4bf');
    drawRect(CANVAS_WIDTH - 10 - PADDLE_WIDTH, paddle2Y, PADDLE_WIDTH, PADDLE_HEIGHT, '#f97316');
    drawCircle(ballX, ballY, BALL_SIZE / 2, '#e2e8f0');
  }

  function updatePaddle1() {
    if (keysPressed['w'] || keysPressed['W']) {
      paddle1Y -= PADDLE_SPEED;
    }
    if (keysPressed['s'] || keysPressed['S']) {
      paddle1Y += PADDLE_SPEED;
    }
    if (paddle1Y < 0) paddle1Y = 0;
    if (paddle1Y + PADDLE_HEIGHT > CANVAS_HEIGHT) paddle1Y = CANVAS_HEIGHT - PADDLE_HEIGHT;
  }

  function updatePaddle2() {
    if (aiEnabled) {
      var paddleCenter = paddle2Y + PADDLE_HEIGHT / 2;
      if (paddleCenter < ballY - 10) {
        paddle2Y += AI_SPEED;
      } else if (paddleCenter > ballY + 10) {
        paddle2Y -= AI_SPEED;
      }
      if (paddle2Y < 0) paddle2Y = 0;
      if (paddle2Y + PADDLE_HEIGHT > CANVAS_HEIGHT) paddle2Y = CANVAS_HEIGHT - PADDLE_HEIGHT;
    } else {
      if (keysPressed['arrowup']) {
        paddle2Y -= PADDLE_SPEED;
      }
      if (keysPressed['arrowdown']) {
        paddle2Y += PADDLE_SPEED;
      }
      if (paddle2Y < 0) paddle2Y = 0;
      if (paddle2Y + PADDLE_HEIGHT > CANVAS_HEIGHT) paddle2Y = CANVAS_HEIGHT - PADDLE_HEIGHT;
    }
  }

  function updateBall() {
    ballX += ballDX;
    ballY += ballDY;

    if (ballY - BALL_SIZE / 2 < 0 || ballY + BALL_SIZE / 2 > CANVAS_HEIGHT) {
      ballDY = -ballDY;
    }

    if (ballX - BALL_SIZE / 2 < 10 + PADDLE_WIDTH && ballY > paddle1Y && ballY < paddle1Y + PADDLE_HEIGHT) {
      ballDX = -ballDX * 1.05;
      ballX = 10 + PADDLE_WIDTH + BALL_SIZE / 2;
      showToast(tr('pong_rally'));
    }

    if (ballX + BALL_SIZE / 2 > CANVAS_WIDTH - 10 - PADDLE_WIDTH && ballY > paddle2Y && ballY < paddle2Y + PADDLE_HEIGHT) {
      ballDX = -ballDX * 1.05;
      ballX = CANVAS_WIDTH - 10 - PADDLE_WIDTH - BALL_SIZE / 2;
      showToast(tr('pong_rally'));
    }

    if (ballX < 0) {
      score2++;
      updateScore();
      checkWin();
      if (!gameRunning) return;
      resetBall();
    }

    if (ballX > CANVAS_WIDTH) {
      score1++;
      updateScore();
      checkWin();
      if (!gameRunning) return;
      resetBall();
    }
  }

  function updateScore() {
    if (score1El) score1El.textContent = score1;
    if (score2El) score2El.textContent = score2;
  }

  function checkWin() {
    if (score1 >= WINNING_SCORE) {
      gameRunning = false;
      cancelAnimationFrame(animationId);
      showWinner(1);
      return;
    }
    if (score2 >= WINNING_SCORE) {
      gameRunning = false;
      cancelAnimationFrame(animationId);
      showWinner(2);
      return;
    }
  }

  function showWinner(winner) {
    if (winnerIcon) winnerIcon.textContent = '\u{1F389}';
    if (winnerTitle) {
      winnerTitle.textContent = tr('pong_winner') + ' ' + tr('pong_player') + ' ' + winner;
    }
    if (winnerMessage) {
      winnerMessage.textContent = tr('pong_congrats') + '!';
    }

    if (playAgainBtn) {
      playAgainBtn.onclick = function() {
        if (winnerModal) {
          winnerModal.classList.remove('visible');
          winnerModal.style.display = 'none';
        }
        resetGame();
        startGame();
      };
    }

    if (winnerModal) {
      winnerModal.classList.add('visible');
      winnerModal.style.display = 'flex';
    }
  }

  function gameLoop() {
    if (!gameRunning) return;

    updatePaddle1();
    updatePaddle2();
    updateBall();
    draw();

    animationId = requestAnimationFrame(gameLoop);
  }

  function startGame() {
    if (gameRunning) return;
    gameRunning = true;
    resetPositions();
    if (overlayEl) overlayEl.classList.add('hidden');
    console.log('[Pong] Game started');
    gameLoop();
  }

  function stopGame() {
    gameRunning = false;
    if (animationId) cancelAnimationFrame(animationId);
    if (overlayEl) overlayEl.classList.remove('hidden');
  }

  function resetGame() {
    score1 = 0;
    score2 = 0;
    updateScore();
    resetPositions();
    draw();
    stopGame();
    showToast('pong_score_reset');
    console.log('[Pong] Game reset');
  }

  function setMode(mode) {
    aiEnabled = (mode === 'ai');
    console.log('[Pong] Mode set to:', aiEnabled ? 'AI' : '2P');
  }

  function handleKeyDown(e) {
    keysPressed[e.key.toLowerCase()] = true;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      keysPressed[e.key.toLowerCase()] = true;
    }
  }

  function handleKeyUp(e) {
    keysPressed[e.key.toLowerCase()] = false;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      keysPressed[e.key.toLowerCase()] = false;
    }
  }

  function initCanvas() {
    canvas = document.getElementById('pong-canvas');
    if (!canvas) {
      console.error('[Pong] Canvas not found!');
      return;
    }

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx = canvas.getContext('2d');
  }

  function initGame() {
    console.log('[Pong] initGame() called');

    initCanvas();

    overlayEl = document.getElementById('pong-overlay');
    startBtn = document.getElementById('btn-start');
    resetBtn = document.getElementById('btn-reset');
    modeSelect = document.getElementById('mode-select');
    score1El = document.getElementById('score-p1');
    score2El = document.getElementById('score-p2');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    playAgainBtn = document.getElementById('btn-play-again');
    toast = document.getElementById('toast');

    console.log('[Pong] Elements:', {
      canvas: !!canvas,
      startBtn: !!startBtn
    });

    var saved1 = localStorage.getItem('pong-score1');
    var saved2 = localStorage.getItem('pong-score2');
    if (saved1) score1 = parseInt(saved1);
    if (saved2) score2 = parseInt(saved2);

    if (startBtn) startBtn.addEventListener('click', startGame);
    if (resetBtn) resetBtn.addEventListener('click', resetGame);
    if (modeSelect) modeSelect.addEventListener('change', function(e) {
      setMode(e.target.value);
    });

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    resetPositions();
    draw();
    console.log('[Pong] Init complete');
  }

  window.initGame = initGame;
})();