// ============================================
// Tablo — Spot the Difference (Clean Rebuild)
// ============================================

(function() {
  'use strict';

  // 3 Theme variations (same layout, different moods)
  var themes = [
    { skyTop: '#2a4a6a', skyBottom: '#1a2a3a', ground: '#3a5a3a', sunColor: '#fbbf24' },
    { skyTop: '#4a2a3a', skyBottom: '#2a1a1a', ground: '#3a3a2a', sunColor: '#f97316' },
    { skyTop: '#0a0a2a', skyBottom: '#050510', ground: '#1a1a2a', sunColor: '#e2e8f0' }
  ];

  // FIXED element positions — these EXACTLY match drawing coordinates
  var elements = {
    sun:       { x: 320, y: 50 },
    cloud:     { x: 100, y: 55 },
    tree1:     { x: 55, y: 200 },
    tree2:     { x: 185, y: 195 },
    house:     { x: 250, y: 210 },   // base-left corner
    door:      { x: 285, y: 245 },
    window:    { x: 265, y: 230 },
    bird:      { x: 150, y: 85 },
    flower1:   { x: 90, y: 260 },
    flower2:   { x: 370, y: 255 },
    mountain:  { x: 200, y: 170 }
  };

  // Difference pool (pick 5 random each game)
  var diffPool = [
    { id: 'sun_color',     x: 320, y: 50,  type: 'color',  target: 'sun' },
    { id: 'cloud_size',    x: 100, y: 55,  type: 'size',   target: 'cloud' },
    { id: 'tree1_missing', x: 55,  y: 200, type: 'missing', target: 'tree1' },
    { id: 'tree2_missing', x: 185, y: 195, type: 'missing', target: 'tree2' },
    { id: 'door_color',    x: 285, y: 245, type: 'color',  target: 'door' },
    { id: 'window_missing', x: 265, y: 230, type: 'missing', target: 'window' },
    { id: 'bird_missing',  x: 150, y: 85,  type: 'missing', target: 'bird' },
    { id: 'flower1_missing', x: 90, y: 260, type: 'missing', target: 'flower1' },
    { id: 'flower2_missing', x: 370, y: 255, type: 'missing', target: 'flower2' },
    { id: 'tree1_color',   x: 55,  y: 200, type: 'color',  target: 'tree1' }
  ];

  var NUM_DIFFERENCES = 5;
  var HIT_RADIUS = 28;
  var HORIZON_Y = 210;

  var currentTheme = null;
  var activeDifferences = [];
  var foundCount = 0;
  var startTime = null;
  var timerInterval = null;
  var elapsedSeconds = 0;
  var gameActive = false;

  var canvasA, canvasB, ctxA, ctxB;
  var foundEl, timeEl, bestEl;
  var winnerModal, winnerStats, nextBtn, newGameBtn, toast;

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

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function hasDiff(targetId) {
    for (var i = 0; i < activeDifferences.length; i++) {
      if (activeDifferences[i].target === targetId) return true;
    }
    return false;
  }

  function isMissing(targetId, isImageB) {
    if (!isImageB) return false;
    for (var i = 0; i < activeDifferences.length; i++) {
      if (activeDifferences[i].target === targetId && activeDifferences[i].type === 'missing') return true;
    }
    return false;
  }

  function drawScene(ctx, isImageB) {
    if (!ctx || !currentTheme) return;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    var t = currentTheme;

    // --- SKY ---
    var grad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
    grad.addColorStop(0, t.skyTop);
    grad.addColorStop(1, t.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, HORIZON_Y);

    // Stars (night theme only)
    if (t.sunColor === '#e2e8f0') {
      for (var s = 0; s < 25; s++) {
        var sx = (s * 37 + 20) % w;
        var sy = (s * 23 + 15) % 180;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    }

    // --- SUN/MOON ---
    var sunColor = t.sunColor;
    if (isImageB && hasDiff('sun')) {
      sunColor = '#a855f7'; // purple — VERY obvious
    }
    ctx.beginPath();
    ctx.arc(elements.sun.x, elements.sun.y, 30, 0, Math.PI * 2);
    ctx.fillStyle = sunColor;
    ctx.fill();

    // --- CLOUD ---
    if (!isMissing('cloud', isImageB)) {
      var cloudScale = (isImageB && hasDiff('cloud')) ? 0.45 : 1.0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(elements.cloud.x - 20, elements.cloud.y, 18 * cloudScale, 0, Math.PI * 2);
      ctx.arc(elements.cloud.x, elements.cloud.y - 5, 22 * cloudScale, 0, Math.PI * 2);
      ctx.arc(elements.cloud.x + 20, elements.cloud.y, 18 * cloudScale, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- MOUNTAINS (decorative, no diff) ---
    ctx.fillStyle = '#2d4a3e';
    ctx.beginPath();
    ctx.moveTo(0, HORIZON_Y);
    ctx.lineTo(60, 160);
    ctx.lineTo(120, 190);
    ctx.lineTo(200, 140);
    ctx.lineTo(280, 180);
    ctx.lineTo(360, 155);
    ctx.lineTo(w, 190);
    ctx.lineTo(w, HORIZON_Y);
    ctx.closePath();
    ctx.fill();

    // Darker mountain shade
    ctx.fillStyle = '#1d3a2e';
    ctx.beginPath();
    ctx.moveTo(100, HORIZON_Y);
    ctx.lineTo(170, 175);
    ctx.lineTo(220, 195);
    ctx.lineTo(280, 165);
    ctx.lineTo(340, 190);
    ctx.lineTo(w, HORIZON_Y);
    ctx.closePath();
    ctx.fill();

    // --- GROUND ---
    ctx.fillStyle = t.ground;
    ctx.fillRect(0, HORIZON_Y, w, h - HORIZON_Y);

    // Grass texture lines
    ctx.strokeStyle = t.ground;
    ctx.lineWidth = 1;
    for (var g = 0; g < 40; g++) {
      var gx = (g * 13 + 5) % w;
      ctx.beginPath();
      ctx.moveTo(gx, HORIZON_Y + 5);
      ctx.lineTo(gx, HORIZON_Y + 15);
      ctx.stroke();
    }

    // --- HOUSE (on ground) ---
    var hx = elements.house.x;
    var hy = elements.house.y;

    // Walls
    ctx.fillStyle = '#8b6f47';
    ctx.fillRect(hx, hy, 80, 50);

    // Roof
    ctx.fillStyle = '#5c3a1f';
    ctx.beginPath();
    ctx.moveTo(hx - 6, hy);
    ctx.lineTo(hx + 40, hy - 28);
    ctx.lineTo(hx + 86, hy);
    ctx.closePath();
    ctx.fill();

    // Chimney
    ctx.fillStyle = '#6b4a2a';
    ctx.fillRect(hx + 55, hy - 25, 12, 20);

    // Window (can be missing)
    if (!isMissing('window', isImageB)) {
      ctx.fillStyle = '#1a3a5a';
      ctx.fillRect(elements.window.x - 12, elements.window.y - 12, 24, 24);
      // Frame
      ctx.strokeStyle = '#daa520';
      ctx.lineWidth = 2;
      ctx.strokeRect(elements.window.x - 12, elements.window.y - 12, 24, 24);
      // Cross
      ctx.beginPath();
      ctx.moveTo(elements.window.x, elements.window.y - 12);
      ctx.lineTo(elements.window.x, elements.window.y + 12);
      ctx.moveTo(elements.window.x - 12, elements.window.y);
      ctx.lineTo(elements.window.x + 12, elements.window.y);
      ctx.stroke();
    }

    // Door (color can change)
    var doorColor = '#2dd4bf';
    if (isImageB && hasDiff('door')) {
      doorColor = '#ef4444'; // red — VERY obvious
    }
    ctx.fillStyle = doorColor;
    ctx.fillRect(elements.door.x - 13, elements.door.y - 18, 26, 36);
    // Door knob
    ctx.fillStyle = '#daa520';
    ctx.beginPath();
    ctx.arc(elements.door.x + 7, elements.door.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // --- TREE 1 ---
    if (!isMissing('tree1', isImageB)) {
      drawTree(ctx, elements.tree1.x, elements.tree1.y, isImageB && hasDiff('tree1'));
    }

    // --- TREE 2 ---
    if (!isMissing('tree2', isImageB)) {
      drawTree(ctx, elements.tree2.x, elements.tree2.y, false);
    }

    // --- BIRD ---
    if (!isMissing('bird', isImageB)) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(elements.bird.x - 10, elements.bird.y);
      ctx.quadraticCurveTo(elements.bird.x - 5, elements.bird.y - 8, elements.bird.x, elements.bird.y);
      ctx.quadraticCurveTo(elements.bird.x + 5, elements.bird.y - 8, elements.bird.x + 10, elements.bird.y);
      ctx.stroke();
    }

    // --- FLOWER 1 ---
    if (!isMissing('flower1', isImageB)) {
      drawFlower(ctx, elements.flower1.x, elements.flower1.y);
    }

    // --- FLOWER 2 ---
    if (!isMissing('flower2', isImageB)) {
      drawFlower(ctx, elements.flower2.x, elements.flower2.y);
    }

    // --- FOUND MARKERS (Image B only) ---
    if (isImageB) {
      for (var i = 0; i < activeDifferences.length; i++) {
        if (activeDifferences[i].found) {
          var d = activeDifferences[i];
          ctx.beginPath();
          ctx.arc(d.x, d.y, HIT_RADIUS, 0, Math.PI * 2);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
          ctx.fill();
        }
      }
    }
  }

  function drawTree(ctx, x, y, isOrange) {
    // Trunk
    ctx.fillStyle = '#4a2f1a';
    ctx.fillRect(x - 7, y, 14, 35);

    // Leaves — multi-circle canopy
    var leafColor = isOrange ? '#f97316' : '#4a8a4a';
    ctx.fillStyle = leafColor;
    ctx.beginPath();
    ctx.arc(x, y - 15, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 20, y - 5, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 20, y - 5, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFlower(ctx, x, y) {
    // Stem
    ctx.strokeStyle = '#3a6a3a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 25);
    ctx.stroke();

    // Petals
    ctx.fillStyle = '#ec4899';
    for (var p = 0; p < 5; p++) {
      var angle = (p / 5) * Math.PI * 2;
      var px = x + Math.cos(angle) * 8;
      var py = y + Math.sin(angle) * 8;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function handleClick(e) {
    if (!gameActive) return;
    var rect = canvasB.getBoundingClientRect();
    var scaleX = canvasB.width / rect.width;
    var scaleY = canvasB.height / rect.height;
    var cx = (e.clientX - rect.left) * scaleX;
    var cy = (e.clientY - rect.top) * scaleY;

    for (var i = 0; i < activeDifferences.length; i++) {
      if (activeDifferences[i].found) continue;
      var dx = cx - activeDifferences[i].x;
      var dy = cy - activeDifferences[i].y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= HIT_RADIUS) {
        activeDifferences[i].found = true;
        foundCount++;
        if (foundEl) foundEl.textContent = foundCount + '/' + NUM_DIFFERENCES;
        drawScene(ctxB, true);
        if (foundCount >= NUM_DIFFERENCES) {
          endGame();
        }
        return;
      }
    }
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

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function endGame() {
    gameActive = false;
    stopTimer();

    var best = localStorage.getItem('tablo-spot-best');
    if (!best || elapsedSeconds < parseInt(best)) {
      localStorage.setItem('tablo-spot-best', elapsedSeconds.toString());
      if (bestEl) bestEl.textContent = timeEl.textContent;
    }

    if (winnerStats) winnerStats.textContent = tr('spot_time') + ': ' + timeEl.textContent;
    if (winnerModal) {
      winnerModal.classList.add('visible');
      winnerModal.style.display = 'flex';
    }
  }

  function newGame() {
    currentTheme = themes[Math.floor(Math.random() * themes.length)];
    activeDifferences = shuffle(diffPool.slice()).slice(0, NUM_DIFFERENCES).map(function(d) {
      return { id: d.id, x: d.x, y: d.y, type: d.type, target: d.target, found: false };
    });

    foundCount = 0;
    elapsedSeconds = 0;
    gameActive = true;

    if (winnerModal) {
      winnerModal.classList.remove('visible');
      winnerModal.style.display = 'none';
    }
    if (foundEl) foundEl.textContent = '0/' + NUM_DIFFERENCES;
    if (timeEl) timeEl.textContent = '00:00';

    drawScene(ctxA, false);
    drawScene(ctxB, true);

    stopTimer();
    startTimer();
  }

  function initGame() {
    canvasA = document.getElementById('canvas-a');
    canvasB = document.getElementById('canvas-b');
    ctxA = canvasA ? canvasA.getContext('2d') : null;
    ctxB = canvasB ? canvasB.getContext('2d') : null;
    foundEl = document.getElementById('spot-found');
    timeEl = document.getElementById('spot-time');
    bestEl = document.getElementById('spot-best');
    winnerModal = document.getElementById('spot-winner');
    winnerStats = document.getElementById('spot-winner-stats');
    nextBtn = document.getElementById('btn-next');
    newGameBtn = document.getElementById('btn-new-game');
    toast = document.getElementById('toast');

    if (canvasB) canvasB.addEventListener('click', handleClick);
    if (nextBtn) nextBtn.addEventListener('click', newGame);
    if (newGameBtn) newGameBtn.addEventListener('click', newGame);

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