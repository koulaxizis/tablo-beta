// ============================================
// Tablo — Spot the Difference (Fixed Timer + Win Modal + Obvious Differences)
// ============================================

(function() {
  'use strict';

  console.log('[Spot] Game initialized');

  // 6 Different Scene Templates
  var sceneTemplates = [
    {
      id: 1, name: 'Mountain Sunset',
      bgTop: '#1a2a3a', bgBottom: '#0f1923',
      sunY: 60, mountainsColor: '#2d4a3e'
    },
    {
      id: 2, name: 'Forest Dawn',
      bgTop: '#2a3a4a', bgBottom: '#152028',
      sunY: 80, mountainsColor: '#1d3a2e'
    },
    {
      id: 3, name: 'Valley Evening',
      bgTop: '#3a2a4a', bgBottom: '#1a0f1a',
      sunY: 50, mountainsColor: '#3d2a3e'
    },
    {
      id: 4, name: 'Coastal Morning',
      bgTop: '#1a3a5a', bgBottom: '#0f1a2a',
      sunY: 70, mountainsColor: '#1d4a5e'
    },
    {
      id: 5, name: 'Garden Night',
      bgTop: '#0a1a3a', bgBottom: '#050a15',
      sunY: 40, mountainsColor: '#0d1a3e'
    },
    {
      id: 6, name: 'Meadow Sunset',
      bgTop: '#2a2a4a', bgBottom: '#15152a',
      sunY: 90, mountainsColor: '#2d3a4e'
    }
  ];

  var currentScene = null;
  var NUM_DIFFERENCES = 5;
  var HIT_RADIUS = 30;
  
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
    
    // Very obvious differences (large sizes, clear colors)
    pool.push({ id: 'sun_color', x: 300, y: scene.sunY, size: 40, type: 'sun' });
    pool.push({ id: 'tree1_present', x: 50, y: 230, size: 50, type: 'tree' });
    pool.push({ id: 'tree2_present', x: 160, y: 225, size: 50, type: 'tree' });
    pool.push({ id: 'house_door_color', x: 165, y: 205, size: 35, type: 'door' });
    pool.push({ id: 'window_present', x: 115, y: 190, size: 25, type: 'window' });
    pool.push({ id: 'bird1_present', x: 130, y: 90, size: 30, type: 'bird' });
    pool.push({ id: 'bird2_present', x: 290, y: 95, size: 30, type: 'bird' });
    pool.push({ id: 'flower_present', x: 70, y: 280, size: 35, type: 'flower' });
    pool.push({ id: 'cloud_size', x: 90, y: 65, size: 60, type: 'cloud' });
    pool.push({ id: 'moon_color', x: 300, y: scene.sunY, size: 40, type: 'moon' });

    var shuffled = shuffle(pool.slice());
    var selected = shuffled.slice(0, Math.min(NUM_DIFFERENCES, shuffled.length));
    return selected.map(function(d) { 
      return { ...d, found: false }; 
    });
  }

  function hasDifference(type) {
    for (var i = 0; i < activeDifferences.length; i++) {
      if (activeDifferences[i].type === type) return true;
    }
    return false;
  }

  function drawScene(ctx, isImageB) {
    if (!ctx || !currentScene) return;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;

    // Background gradient
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, currentScene.bgTop);
    grad.addColorStop(1, currentScene.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    for (var s = 0; s < 20; s++) {
      var sx = (s * 37 + 30) % w;
      var sy = (s * 23 + 25) % 120;
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // Celestial body (sun/moon)
    var celestialColor = '#fbbf24';
    if (isImageB && hasDifference('sun')) {
      celestialColor = '#ef4444'; // RED instead of yellow - VERY obvious
    } else if (isImageB && hasDifference('moon')) {
      celestialColor = '#9ca3af'; // Gray instead of yellow
    }
    ctx.beginPath();
    ctx.arc(300, currentScene.sunY, 35, 0, Math.PI * 2);
    ctx.fillStyle = celestialColor;
    ctx.fill();

    // Clouds - clear size difference
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    var cloudScale = hasDifference('cloud') && isImageB ? 0.6 : 1.0;
    ctx.beginPath();
    ctx.arc(90, 65, 30 * cloudScale, 0, Math.PI * 2);
    ctx.arc(125, 60, 35 * cloudScale, 0, Math.PI * 2);
    ctx.arc(160, 65, 30 * cloudScale, 0, Math.PI * 2);
    ctx.fill();

    // Mountains
    ctx.fillStyle = currentScene.mountainsColor;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.lineTo(w * 0.18, h * 0.42);
    ctx.lineTo(w * 0.32, h * 0.65);
    ctx.lineTo(w * 0.48, h * 0.38);
    ctx.lineTo(w * 0.68, h * 0.6);
    ctx.lineTo(w * 0.85, h * 0.45);
    ctx.lineTo(w, h * 0.7);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Trees - very obvious presence/absence
    var treePositions = [
      {x:50, y:230}, {x:160, y:225}, {x:250, y:228}, {x:340, y:230}
    ];
    treePositions.forEach(function(tree, idx) {
      var present = true;
      if (idx === 0 && isImageB && hasDifference('tree1')) present = false;
      if (idx === 1 && isImageB && hasDifference('tree2')) present = false;
      
      if (present) {
        // Trunk
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(tree.x - 8, tree.y, 16, 35);
        
        // Leaves - LARGE and obivous
        ctx.beginPath();
        ctx.arc(tree.x, tree.y - 10, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#4a8a4a';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tree.x - 15, tree.y, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tree.x + 15, tree.y, 22, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // House
    var houseX = w * 0.32;
    var houseY = h * 0.56;
    
    // Main building
    ctx.fillStyle = '#8b6a4a';
    ctx.fillRect(houseX, houseY, 90, 60);
    
    // Roof
    ctx.beginPath();
    ctx.moveTo(houseX - 8, houseY);
    ctx.lineTo(houseX + 45, houseY - 40);
    ctx.lineTo(houseX + 98, houseY);
    ctx.closePath();
    ctx.fillStyle = '#6b4a3a';
    ctx.fill();
    
    // Door - color difference VERY obvious
    var doorColor = '#2dd4bf'; // Teal
    if (isImageB && hasDifference('door')) {
      doorColor = '#ef4444'; // RED - huge contrast
    }
    ctx.fillStyle = doorColor;
    ctx.fillRect(houseX + 35, houseY + 30, 25, 30);
    
    // Window - presence difference
    var windowPresent = !isImageB || !hasDifference('window');
    if (windowPresent) {
      ctx.fillStyle = '#1a3a4a';
      ctx.fillRect(houseX + 15, houseY + 12, 22, 22);
      // Window frame
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(houseX + 15, houseY + 12, 22, 22);
    }
    
    // Second window (always present)
    ctx.fillStyle = '#1a3a4a';
    ctx.fillRect(houseX + 55, houseY + 12, 22, 22);

    // Birds - very obvious presence
    var bird1Present = !isImageB || !hasDifference('bird1');
    var bird2Present = !isImageB || !hasDifference('bird2');
    
    if (bird1Present) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('\u{1F426}', 120, 95);
    }
    if (bird2Present) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('\u{1F426}', 280, 100);
    }

    // Flower - obvious presence/color
    var flowerPresent = !isImageB || !hasDifference('flower');
    if (flowerPresent) {
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(70, 285, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(70, 285, 6, 0, Math.PI * 2);
      ctx.fill();
      // Stem
      ctx.strokeStyle = '#4a8a4a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(70, 285);
      ctx.lineTo(70, 310);
      ctx.stroke();
    }

    // Draw FOUND markers on Image B - very visible
    if (isImageB) {
      for (var i = 0; i < activeDifferences.length; i++) {
        if (activeDifferences[i].found) {
          var diff = activeDifferences[i];
          ctx.beginPath();
          ctx.arc(diff.x, diff.y, HIT_RADIUS, 0, Math.PI * 2);
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 5;
          ctx.stroke();
          
          ctx.fillStyle = 'rgba(45, 212, 191, 0.4)';
          ctx.fill();
          
          // Checkmark
          ctx.fillStyle = '#2dd4bf';
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('\u2713', diff.x, diff.y);
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
        console.log('[Spot] Found difference:', activeDifferences[i].id);
        activeDifferences[i].found = true;
        foundCount++;
        if (foundEl) foundEl.textContent = foundCount + '/' + NUM_DIFFERENCES;
        drawScene(ctxB, true);

        if (foundCount >= NUM_DIFFERENCES) {
          console.log('[Spot] ALL FOUND - calling endGame');
          endGame();
        }
        return;
      }
    }
  }

  function startTimer() {
    startTime = Date.now();
    console.log('[Spot] Timer started');
    timerInterval = setInterval(function() {
      elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      var mins = Math.floor(elapsedSeconds / 60);
      var secs = elapsedSeconds % 60;
      if (timeEl) {
        timeEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      console.log('[Spot] Timer stopped');
    }
  }

  function showWinnerModal() {
    console.log('[Spot] Showing winner modal');
    if (winnerModal) {
      winnerModal.style.display = 'flex';
      winnerModal.classList.add('visible');
      console.log('[Spot] Modal display:', winnerModal.style.display);
    }
  }

  function hideWinnerModal() {
    if (winnerModal) {
      winnerModal.style.display = 'none';
      winnerModal.classList.remove('visible');
    }
  }

  function endGame() {
    console.log('[Spot] endGame called, foundCount:', foundCount);
    gameActive = false;
    stopTimer();

    // Save best time
    var best = localStorage.getItem('tablo-spot-best');
    if (!best || elapsedSeconds < parseInt(best)) {
      localStorage.setItem('tablo-spot-best', elapsedSeconds.toString());
      if (bestEl) bestEl.textContent = timeEl.textContent;
    }

    // Show stats in modal
    if (winnerStats) {
      winnerStats.textContent = tr('spot_time') + ': ' + timeEl.textContent;
      console.log('[Spot] Winner stats set:', winnerStats.textContent);
    }

    // CRITICAL: Show modal
    showWinnerModal();
    console.log('[Spot] Modal should be visible now');
  }

  function newGame() {
    console.log('[Spot] New game starting');
    currentScene = selectScene();
    activeDifferences = selectDifferencesForScene(currentScene);
    
    foundCount = 0;
    elapsedSeconds = 0;
    gameActive = true;
    
    hideWinnerModal();
    
    if (foundEl) foundEl.textContent = '0/' + NUM_DIFFERENCES;
    if (timeEl) timeEl.textContent = '00:00';

    if (ctxA) {
      console.log('[Spot] Drawing scene A');
      drawScene(ctxA, false);
    }
    if (ctxB) {
      console.log('[Spot] Drawing scene B');
      drawScene(ctxB, true);
    }

    stopTimer();
    startTimer();
    console.log('[Spot] New game ready, scene:', currentScene.name);
  }

  function initGame() {
    console.log('[Spot] initGame called');
    
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

    console.log('[Spot] Elements:', {
      canvasA: !!canvasA,
      canvasB: !!canvasB,
      winnerModal: !!winnerModal,
      newGameBtn: !!newGameBtn
    });

    if (canvasB) {
      canvasB.addEventListener('click', handleClick);
      console.log('[Spot] Click listener attached');
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', newGame);
      console.log('[Spot] Next button listener attached');
    }
    if (newGameBtn) {
      newGameBtn.addEventListener('click', newGame);
      console.log('[Spot] New game button listener attached');
    }

    // Load best time
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