// ============================================
// Tablo — Spot the Difference (6 Scenes + Clear Differences)
// ============================================

(function() {
  'use strict';

  // 6 Different Scene Templates
  var sceneTemplates = [
    {
      id: 1, name: 'Mountain Sunset',
      bgGrad: ['#1a2a3a', '#0f1923'],
      sunY: 60, mountainColor: '#2d4a3e',
      elements: ['sun', 'mountains', 'trees', 'house', 'clouds', 'birds']
    },
    {
      id: 2, name: 'Forest Dawn',
      bgGrad: ['#2a3a4a', '#152028'],
      sunY: 80, mountainColor: '#1d3a2e',
      elements: ['sun', 'trees', 'house', 'flowers', 'butterflies']
    },
    {
      id: 3, name: 'Valley Evening',
      bgGrad: ['#3a2a3a', '#1a0f15'],
      sunY: 100, mountainColor: '#3d2a3e',
      elements: ['moon', 'stars', 'trees', 'house', 'fireflies']
    },
    {
      id: 4, name: 'Coastal Morning',
      bgGrad: ['#1a3a4a', '#0f1a23'],
      sunY: 50, mountainColor: '#1d4a3e',
      elements: ['sun', 'water', 'boats', 'birds', 'seagulls']
    },
    {
      id: 5, name: 'Garden Night',
      bgGrad: ['#0a1a2a', '#050a10'],
      sunY: 40, mountainColor: '#0d1a2e',
      elements: ['moon', 'stars', 'flowers', 'lanterns', 'fireflies']
    },
    {
      id: 6, name: 'Meadow Sunset',
      bgGrad: ['#2a2a3a', '#151520'],
      sunY: 70, mountainColor: '#2d3a2e',
      elements: ['sun', 'grass', 'trees', 'butterflies', 'bees']
    }
  ];

  var currentScene = null;
  var NUM_DIFFERENCES = 5;
  var HIT_RADIUS = 25;
  
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

  function selectScene() {
    return sceneTemplates[Math.floor(Math.random() * sceneTemplates.length)];
  }

  function selectDifferencesForScene(scene) {
    var pool = [];
    
    // Scene-specific difference pools (obvious visual changes)
    if (scene.elements.includes('sun') || scene.elements.includes('moon')) {
      pool.push({ id: 'celestial_color', x: 300, y: scene.sunY, w: 40, h: 40, type: 'color' });
    }
    if (scene.elements.includes('trees')) {
      pool.push({ id: 'tree1_color', x: 40, y: 220, w: 25, h: 30, type: 'color' });
      pool.push({ id: 'tree2_present', x: 150, y: 210, w: 30, h: 35, type: 'present' });
    }
    if (scene.elements.includes('house')) {
      pool.push({ id: 'door_color', x: 160, y: 200, w: 25, h: 25, type: 'color' });
      pool.push({ id: 'window_present', x: 100, y: 180, w: 15, h: 15, type: 'present' });
    }
    if (scene.elements.includes('birds') || scene.elements.includes('seagulls')) {
      pool.push({ id: 'bird1_present', x: 120, y: 80, w: 15, h: 10, type: 'present' });
      pool.push({ id: 'bird2_present', x: 280, y: 90, w: 15, h: 10, type: 'present' });
    }
    if (scene.elements.includes('flowers')) {
      pool.push({ id: 'flower1_present', x: 60, y: 270, w: 15, h: 15, type: 'present' });
    }
    if (scene.elements.includes('butterflies')) {
      pool.push({ id: 'butterfly_present', x: 320, y: 150, w: 12, h: 12, type: 'present' });
    }
    if (scene.elements.includes('clouds')) {
      pool.push({ id: 'cloud1_size', x: 80, y: 60, w: 50, h: 30, type: 'size' });
    }
    if (scene.elements.includes('stars') || scene.elements.includes('fireflies')) {
      pool.push({ id: 'star1_present', x: 70, y: 50, w: 8, h: 8, type: 'present' });
    }
    if (scene.elements.includes('boats')) {
      pool.push({ id: 'boat1_present', x: 50, y: 240, w: 35, h: 20, type: 'present' });
    }
    if (scene.elements.includes('lanterns')) {
      pool.push({ id: 'lantern1_color', x: 200, y: 200, w: 12, h: 18, type: 'color' });
    }

    // Select exactly 5 differences
    var shuffled = shuffle(pool.slice());
    var selected = shuffled.slice(0, Math.min(NUM_DIFFERENCES, shuffled.length));
    return selected.map(function(d) { 
      return { ...d, found: false }; 
    });
  }

  function drawBaseScene(ctx, scene, isImageB) {
    if (!ctx) return;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;

    // Background gradient
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, scene.bgGrad[0]);
    grad.addColorStop(1, scene.bgGrad[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Celestial body (sun/moon)
    var celestialColor = scene.id === 3 || scene.id === 5 ? '#fbbf24' : '#f59e0b';
    if (isImageB && activeDifferences.some(function(d) { return d.id === 'celestial_color'; })) {
      celestialColor = scene.id === 3 || scene.id === 5 ? '#f59e0b' : '#fbbf24';
    }
    ctx.beginPath();
    ctx.arc(w * 0.75, scene.sunY, 35, 0, Math.PI * 2);
    ctx.fillStyle = celestialColor;
    ctx.fill();

    // Stars/Fireflies
    if (scene.elements.includes('stars') || scene.elements.includes('fireflies')) {
      for (var s = 0; s < 15; s++) {
        var sx = (s * 37 + 40) % w;
        var sy = (s * 23 + 30) % 120;
        var present = !isImageB || !activeDifferences.some(function(d) {
          return d.id === 'star1_present' && s === 0;
        });
        if (present) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Birds
    if (scene.elements.includes('birds') || scene.elements.includes('seagulls')) {
      var bird1Present = !isImageB || !activeDifferences.some(function(d) { return d.id === 'bird1_present'; });
      var bird2Present = !isImageB || !activeDifferences.some(function(d) { return d.id === 'bird2_present'; });
      
      if (bird1Present) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(120, 80);
        ctx.lineTo(127, 76);
        ctx.lineTo(135, 80);
        ctx.lineTo(127, 84);
        ctx.closePath();
        ctx.fill();
      }
      if (bird2Present) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(280, 90);
        ctx.lineTo(287, 86);
        ctx.lineTo(295, 90);
        ctx.lineTo(287, 94);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Clouds
    if (scene.elements.includes('clouds')) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      var cloudSize = !isImageB || !activeDifferences.some(function(d) { return d.id === 'cloud1_size'; }) ? 1 : 0.7;
      ctx.beginPath();
      ctx.arc(80, 60, 25 * cloudSize, 0, Math.PI * 2);
      ctx.arc(110, 55, 30 * cloudSize, 0, Math.PI * 2);
      ctx.arc(140, 60, 25 * cloudSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mountains
    ctx.beginPath();
    ctx.moveTo(0, h * 0.72);
    ctx.lineTo(w * 0.15, h * 0.45);
    ctx.lineTo(w * 0.3, h * 0.68);
    ctx.lineTo(w * 0.45, h * 0.4);
    ctx.lineTo(w * 0.65, h * 0.62);
    ctx.lineTo(w * 0.8, h * 0.48);
    ctx.lineTo(w, h * 0.72);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = scene.mountainColor;
    ctx.fill();

    // Trees
    if (scene.elements.includes('trees')) {
      var treePositions = [
        {x:40, y:220, present:true},
        {x:150, y:210, present:true},
        {x:240, y:215, present:true},
        {x:330, y:220, present:true}
      ];
      
      treePositions.forEach(function(tree, idx) {
        var isDiffTree = false;
        if (idx === 0 && activeDifferences.some(function(d) { return d.id === 'tree1_color'; })) {
          isDiffTree = true;
        }
        if (idx === 1 && activeDifferences.some(function(d) { return d.id === 'tree2_present'; })) {
          tree.present = !isImageB;
        }
        
        if (tree.present) {
          // Trunk
          ctx.fillStyle = '#3a2a1a';
          ctx.fillRect(tree.x - 5, tree.y, 10, 30);
          
          // Leaves
          ctx.beginPath();
          ctx.arc(tree.x, tree.y - 5, 22, 0, Math.PI * 2);
          ctx.fillStyle = isDiffTree ? '#6a9a6a' : '#4a7a4a';
          ctx.fill();
        }
      });
    }

    // House
    if (scene.elements.includes('house')) {
      var houseX = w * 0.3;
      var houseY = h * 0.58;
      
      ctx.fillStyle = '#8a6a4a';
      ctx.fillRect(houseX, houseY, 80, 55);
      
      // Roof
      ctx.beginPath();
      ctx.moveTo(houseX - 5, houseY);
      ctx.lineTo(houseX + 40, houseY - 35);
      ctx.lineTo(houseX + 85, houseY);
      ctx.closePath();
      ctx.fillStyle = '#6a4a3a';
      ctx.fill();
      
      // Door
      var doorColor = '#2dd4bf';
      if (isImageB && activeDifferences.some(function(d) { return d.id === 'door_color'; })) {
        doorColor = '#5dd4bf';
      }
      ctx.fillStyle = doorColor;
      ctx.fillRect(houseX + 30, houseY + 25, 25, 30);
      
      // Windows
      var windowPresent = !isImageB || !activeDifferences.some(function(d) { return d.id === 'window_present'; });
      if (windowPresent) {
        ctx.fillStyle = '#1a2a3a';
        ctx.fillRect(houseX + 12, houseY + 10, 18, 18);
      }
      ctx.fillStyle = '#1a2a3a';
      ctx.fillRect(houseX + 50, houseY + 10, 18, 18);
    }

    // Flowers
    if (scene.elements.includes('flowers')) {
      var flowerPresent = !isImageB || !activeDifferences.some(function(d) { return d.id === 'flower1_present'; });
      if (flowerPresent) {
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(60, 275, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff9c4';
        ctx.beginPath();
        ctx.arc(60, 275, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Stem
        ctx.strokeStyle = '#4a7a4a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(60, 275);
        ctx.lineTo(60, 295);
        ctx.stroke();
      }
    }

    // Butterflies
    if (scene.elements.includes('butterflies')) {
      var butterflyPresent = !isImageB || !activeDifferences.some(function(d) { return d.id === 'butterfly_present'; });
      if (butterflyPresent) {
        ctx.fillStyle = '#ba46d6';
        ctx.beginPath();
        ctx.ellipse(325, 150, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff9eff';
        ctx.beginPath();
        ctx.ellipse(315, 145, 6, 8, -0.3, 0, Math.PI * 2);
        ctx.ellipse(335, 145, 6, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Boats (for coastal scene)
    if (scene.elements.includes('boats')) {
      var boat1Present = !isImageB || !activeDifferences.some(function(d) { return d.id === 'boat1_present'; });
      if (boat1Present) {
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.moveTo(50, 260);
        ctx.lineTo(85, 260);
        ctx.lineTo(80, 280);
        ctx.lineTo(55, 280);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#d4a574';
        ctx.fillRect(58, 250, 22, 12);
      }
    }

    // Lanterns (for garden night)
    if (scene.elements.includes('lanterns')) {
      var lanternColor = '#ff9800';
      if (isImageB && activeDifferences.some(function(d) { return d.id === 'lantern1_color'; })) {
        lanternColor = '#ff5722';
      }
      ctx.fillStyle = lanternColor;
      ctx.beginPath();
      ctx.arc(200, 209, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(200, 185);
      ctx.lineTo(200, 195);
      ctx.stroke();
    }

    // Water/coast (for coastal scene)
    if (scene.elements.includes('water')) {
      ctx.fillStyle = '#1a5a7a';
      ctx.fillRect(0, h * 0.78, w, h * 0.22);
      
      ctx.fillStyle = '#2a6a8a';
      ctx.fillRect(0, h * 0.78, w, 8);
    }

    // Grass (for meadow scene)
    if (scene.elements.includes('grass')) {
      ctx.fillStyle = '#4a8a4a';
      ctx.fillRect(0, h * 0.75, w, h * 0.25);
      
      ctx.fillStyle = '#5a9a5a';
      for (var g = 0; g < 30; g++) {
        var gx = g * 15 + Math.random() * 10;
        ctx.beginPath();
        ctx.moveTo(gx, h * 0.75);
        ctx.lineTo(gx + 3, h * 0.7);
        ctx.lineTo(gx + 6, h * 0.75);
        ctx.fill();
      }
    }

    // Draw found markers on image B only
    if (isImageB) {
      for (var i = 0; i < activeDifferences.length; i++) {
        if (activeDifferences[i].found) {
          ctx.beginPath();
          ctx.arc(activeDifferences[i].x, activeDifferences[i].y, HIT_RADIUS, 0, Math.PI * 2);
          ctx.strokeStyle = '#ff3333';
          ctx.lineWidth = 4;
          ctx.stroke();
          
          // Fill with semi-transparent green
          ctx.fillStyle = 'rgba(45, 212, 191, 0.3)';
          ctx.fill();
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
        drawBaseScene(ctxB, currentScene, true);

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
    currentScene = selectScene();
    activeDifferences = selectDifferencesForScene(currentScene);
    foundCount = 0;
    elapsedSeconds = 0;
    if (foundEl) foundEl.textContent = '0/' + NUM_DIFFERENCES;
    if (timeEl) timeEl.textContent = '00:00';
    if (winnerModal) winnerModal.classList.remove('visible');

    if (ctxA) drawBaseScene(ctxA, currentScene, false);
    if (ctxB) drawBaseScene(ctxB, currentScene, true);

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