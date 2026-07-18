// ============================================
// Tablo — Spot the Difference (Randomized)
// ============================================

(function() {
  'use strict';

  // Pool of possible differences (12 total)
  var diffPool = [
    { id: 'sun_color', x: 300, y: 60, w: 35, h: 35 },
    { id: 'tree1_color', x: 30, y: 216, w: 18, h: 25 },
    { id: 'tree2_color', x: 120, y: 216, w: 18, h: 25 },
    { id: 'tree3_color', x: 210, y: 216, w: 18, h: 25 },
    { id: 'tree4_color', x: 300, y: 216, w: 18, h: 25 },
    { id: 'door_color', x: 155, y: 195, w: 20, h: 20 },
    { id: 'star1_present', x: 60, y: 40, w: 4, h: 4 },
    { id: 'star2_present', x: 140, y: 60, w: 4, h: 4 },
    { id: 'star3_present', x: 80, y: 80, w: 4, h: 4 },
    { id: 'bird_present', x: 180, y: 100, w: 12, h: 8 },
    { id: 'flower_present', x: 50, y: 250, w: 10, h: 10 },
    { id: 'butterfly_present', x: 320, y: 180, w: 10, h: 8 }
  ];

  var NUM_DIFFERENCES = 5;
  var HIT_RADIUS = 20;
  
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

  function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  function selectDifferences() {
    var shuffled = shuffle(diffPool.slice());
    var selected = shuffled.slice(0, NUM_DIFFERENCES);
    return selected.map(function(d) { 
      return { ...d, found: false }; 
    });
  }

  function drawScene(ctx, hasDiff) {
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

    // Stars (base layer)
    var starPositions = [
      { x: 60, y: 40 }, { x: 140, y: 60 }, { x: 80, y: 80 },
      { x: 220, y: 35 }, { x: 300, y: 75 }, { x: 120, y: 100 }
    ];
    starPositions.forEach(function(star, idx) {
      var present = !hasDiff || activeDifferences.every(function(d) {
        return !(d.id === 'star1_present' && idx === 0) &&
               !(d.id === 'star2_present' && idx === 1) &&
               !(d.id === 'star3_present' && idx === 2);
      });
      // Simplified: show all stars unless specific difference applies
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sun/Moon
    var sunColor = !hasDiff || !activeDifferences.some(function(d) { return d.id === 'sun_color'; }) ? '#fbbf24' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(w * 0.75, h * 0.2, 35, 0, Math.PI * 2);
    ctx.fillStyle = sunColor;
    ctx.fill();

    // Birds
    if (!hasDiff || !activeDifferences.some(function(d) { return d.id === 'bird_present'; })) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(180, 100);
      ctx.lineTo(186, 96);
      ctx.lineTo(192, 100);
      ctx.lineTo(186, 104);
      ctx.closePath();
      ctx.fill();
    }

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

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(80, 50, 20, 0, Math.PI * 2);
    ctx.arc(110, 45, 25, 0, Math.PI * 2);
    ctx.arc(140, 50, 20, 0, Math.PI * 2);
    ctx.fill();

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

    var doorColor = !hasDiff || !activeDifferences.some(function(d) { return d.id === 'door_color'; }) ? '#2dd4bf' : '#5dd4bf';
    ctx.fillStyle = doorColor;
    ctx.fillRect(w * 0.3 + 25, h * 0.65, 20, 20);

    // Windows
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(w * 0.32, h * 0.58, 12, 12);
    ctx.fillRect(w * 0.46, h * 0.58, 12, 12);

    // Trees
    var treeColors = ['#4a7a4a', '#5a8a5a'];
    var treePositions = [{x:30,y:216},{x:120,y:216},{x:210,y:216},{x:300,y:216}];
    
    treePositions.forEach(function(tree, idx) {
      var isDiffTree = hasDiff && activeDifferences.some(function(d) {
        var diffIdx = ['tree1_color','tree2_color','tree3_color','tree4_color'].indexOf(d.id);
        return diffIdx === idx;
      });
      
      // Trunk
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(tree.x - 4, tree.y, 8, 25);
      
      // Leaves
      ctx.beginPath();
      ctx.arc(tree.x, tree.y - 5, 18, 0, Math.PI * 2);
      ctx.fillStyle = isDiffTree ? '#5a8a5a' : treeColors[idx % 2];
      ctx.fill();
    });

    // Flower
    if (!hasDiff || !activeDifferences.some(function(d) { return d.id === 'flower_present'; })) {
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(50, 255, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff9c4';
      ctx.beginPath();
      ctx.arc(50, 255, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Butterfly
    if (!hasDiff || !activeDifferences.some(function(d) { return d.id === 'butterfly_present'; })) {
      ctx.fillStyle = '#ba46d6';
      ctx.beginPath();
      ctx.arc(325, 180, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff9eff';
      ctx.beginPath();
      ctx.arc(318, 177, 3, 0, Math.PI * 2);
      ctx.arc(332, 177, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw found markers on image B only
    if (hasDiff) {
      for (var i = 0; i < activeDifferences.length; i++) {
        if (activeDifferences[i].found) {
          ctx.beginPath();
          ctx.arc(activeDifferences[i].x, activeDifferences[i].y, HIT_RADIUS, 0, Math.PI * 2);
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

    for (var i = 0; i < activeDifferences.length; i++) {
      if (activeDifferences[i].found) continue;
      var dx = x - activeDifferences[i].x;
      var dy = y - activeDifferences[i].y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= HIT_RADIUS) {
        activeDifferences[i].found = true;
        foundCount++;
        if (foundEl) foundEl.textContent = foundCount + '/' + NUM_DIFFERENCES;
        drawScene(ctxB, true);

        if (foundCount === NUM_DIFFERENCES) {
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
    activeDifferences = selectDifferences();
    foundCount = 0;
    elapsedSeconds = 0;
    if (foundEl) foundEl.textContent = '0/' + NUM_DIFFERENCES;
    if (timeEl) timeEl.textContent = '00:00';
    if (winnerModal) winnerModal.classList.remove('visible');

    if (ctxA) drawScene(ctxA, false);
    if (ctxB) drawScene(ctxB, true);

    gameActive = true;
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

    if (canvasB) {
      canvasB.addEventListener('click', handleClick);
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', newGame);
    }
    if (newGameBtn) {
      newGameBtn.addEventListener('click', newGame);
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