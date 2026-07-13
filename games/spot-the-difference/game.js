// ============================================
// Tablo — Spot the Difference (Fixed cursor + markers)
// ============================================

(function() {
  'use strict';

  var differences = [
    { x: 120, y: 80, found: false },
    { x: 250, y: 150, found: false },
    { x: 80, y: 220, found: false },
    { x: 310, y: 60, found: false },
    { x: 180, y: 280, found: false },
    { x: 340, y: 200, found: false },
    { x: 50, y: 140, found: false }
  ];

  var HIT_RADIUS = 25;
  var foundCount = 0;
  var startTime = null;
  var timerInterval = null;
  var elapsedSeconds = 0;
  var gameActive = false;

  var canvasB = document.getElementById('canvas-b');
  var ctxB = canvasB ? canvasB.getContext('2d') : null;
  var foundEl = document.getElementById('spot-found');
  var timeEl = document.getElementById('spot-time');
  var bestEl = document.getElementById('spot-best');
  var winnerModal = document.getElementById('spot-winner');
  var winnerStats = document.getElementById('spot-winner-stats');
  var nextBtn = document.getElementById('btn-next');
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
    setTimeout(function() { toast.classList.remove('visible'); }, 2000);
  }

  function drawScene(ctx, isImageB) {
    if (!ctx) return;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background gradient
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a2a3a');
    grad.addColorStop(1, '#0f1923');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Sun/Moon
    ctx.beginPath();
    ctx.arc(w * 0.75, h * 0.2, 35, 0, Math.PI * 2);
    ctx.fillStyle = isImageB ? '#f59e0b' : '#fbbf24';
    ctx.fill();

    // Mountains
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.lineTo(w * 0.2, h * 0.4);
    ctx.lineTo(w * 0.35, h * 0.65);
    ctx.lineTo(w * 0.5, h * 0.35);
    ctx.lineTo(w * 0.7, h * 0.6);
    ctx.lineTo(w * 0.85, h * 0.45);
    ctx.lineTo(w, h * 0.7);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = '#2d4a3e';
    ctx.fill();

    // Trees
    for (var i = 0; i < 4; i++) {
      var tx = 30 + i * 90;
      var ty = h * 0.72;
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(tx - 4, ty, 8, 25);
      ctx.beginPath();
      ctx.arc(tx, ty - 5, 18, 0, Math.PI * 2);
      ctx.fillStyle = isImageB && i === 1 ? '#5a8a5a' : '#4a7a4a';
      ctx.fill();
    }

    // House
    ctx.fillStyle = '#8a6a4a';
    ctx.fillRect(w * 0.3, h * 0.55, 70, 50);
    ctx.beginPath();
    ctx.moveTo(w * 0.3 - 5, h * 0.55);
    ctx.lineTo(w * 0.3 + 35, h * 0.4);
    ctx.lineTo(w * 0.3 + 75, h * 0.55);
    ctx.closePath();
    ctx.fillStyle = '#6a4a3a';
    ctx.fill();
    ctx.fillStyle = isImageB ? '#5dd4bf' : '#2dd4bf';
    ctx.fillRect(w * 0.3 + 25, h * 0.65, 20, 20);

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(80, 50, 20, 0, Math.PI * 2);
    ctx.arc(110, 45, 25, 0, Math.PI * 2);
    ctx.arc(140, 50, 20, 0, Math.PI * 2);
    ctx.fill();

    // Stars
    for (var s = 0; s < 8; s++) {
      var sx = (s * 53 + 20) % w;
      var sy = (s * 31 + 15) % (h * 0.3);
      ctx.fillStyle = isImageB && s === 3 ? '#ff6b6b' : '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw found markers on image B
    if (isImageB) {
      for (var d = 0; d < differences.length; d++) {
        if (differences[d].found) {
          ctx.beginPath();
          ctx.arc(differences[d].x, differences[d].y, HIT_RADIUS, 0, Math.PI * 2);
          ctx.strokeStyle = '#ff3333';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    }
  }

  function handleClick(e) {
    if (!gameActive) return;
    var rect = canvasB.getBoundingClientRect();
    var scaleX = canvasB.width / rect.width;
    var scaleY = canvasB.height / rect.height;
    var x = (e.clientX - rect.left) * scaleX;
    var y = (e.clientY - rect.top) * scaleY;

    for (var i = 0; i < differences.length; i++) {
      if (differences[i].found) continue;
      var dx = x - differences[i].x;
      var dy = y - differences[i].y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= HIT_RADIUS) {
        differences[i].found = true;
        foundCount++;
        if (foundEl) foundEl.textContent = foundCount + '/' + differences.length;
        drawScene(ctxB, true);

        if (foundCount === differences.length) {
          endGame();
        }
        return;
      }
    }
  }

  function handleMouseMove(e) {
    if (!gameActive) return;
    var rect = canvasB.getBoundingClientRect();
    var scaleX = canvasB.width / rect.width;
    var scaleY = canvasB.height / rect.height;
    var x = (e.clientX - rect.left) * scaleX;
    var y = (e.clientY - rect.top) * scaleY;

    var hovering = false;
    for (var i = 0; i < differences.length; i++) {
      if (differences[i].found) continue;
      var dx = x - differences[i].x;
      var dy = y - differences[i].y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= HIT_RADIUS) {
        hovering = true;
        break;
      }
    }
    canvasB.style.cursor = hovering ? 'crosshair' : 'crosshair';
  }

  function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(function() {
      elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      var mins = Math.floor(elapsedSeconds / 60);
      var secs = elapsedSeconds % 60;
      if (timeEl) timeEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }, 1000);
  }

  function endGame() {
    gameActive = false;
    clearInterval(timerInterval);

    var best = localStorage.getItem('tablo-spot-best');
    if (!best || elapsedSeconds < parseInt(best)) {
      localStorage.setItem('tablo-spot-best', elapsedSeconds.toString());
      if (bestEl) bestEl.textContent = timeEl.textContent;
    }

    if (winnerStats) winnerStats.textContent = tr('spot_time') + ': ' + timeEl.textContent;
    if (winnerModal) winnerModal.classList.add('visible');
  }

  function newGame() {
    for (var i = 0; i < differences.length; i++) {
      differences[i].found = false;
    }
    foundCount = 0;
    elapsedSeconds = 0;
    if (foundEl) foundEl.textContent = '0/' + differences.length;
    if (timeEl) timeEl.textContent = '00:00';
    if (winnerModal) winnerModal.classList.remove('visible');

    var canvasA = document.getElementById('canvas-a');
    if (canvasA) {
      drawScene(canvasA.getContext('2d'), false);
    }
    if (ctxB) {
      drawScene(ctxB, true);
    }

    gameActive = true;
    startTimer();
  }

  function initGame() {
    if (canvasB) {
      canvasB.addEventListener('click', handleClick);
      canvasB.addEventListener('mousemove', handleMouseMove);
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', newGame);
    }

    var best = localStorage.getItem('tablo-spot-best');
    if (bestEl && best) {
      var mins = Math.floor(parseInt(best) / 60);
      var secs = parseInt(best) % 60;
      bestEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }

    newGame();
  }

  window.initGame = initGame;
})();