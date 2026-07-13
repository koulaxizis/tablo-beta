// ============================================
// Tablo — Spot the Difference
// ============================================

(function() {
  'use strict';

  var NUM_DIFFS = 7;
  var found = 0;
  var secondsElapsed = 0;
  var timerInterval = null;
  var gameActive = false;
  var sceneData = [];

  var svgLeft = document.getElementById('scene-left');
  var svgRight = document.getElementById('scene-right');
  var foundEl = document.getElementById('found');
  var timerEl = document.getElementById('timer');
  var bestEl = document.getElementById('best-time');
  var newGameBtn = document.getElementById('btn-new-game');
  var nextBtn = document.getElementById('btn-next');
  var winnerModal = document.getElementById('winner-modal');
  var winnerStats = document.getElementById('winner-stats');
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
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function() { toast.classList.remove('visible'); }, 2000);
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

  var COLORS = ['#2dd4bf','#5eead4','#f59e0b','#f87171','#a78bfa','#60a5fa','#4ade80','#ffd93d','#fb923c','#e879f9'];
  var SHAPES = ['circle','rect','triangle','star'];

  function generateScene() {
    var shapes = [];
    var count = 15;
    for (var i = 0; i < count; i++) {
      shapes.push({
        type: pick(SHAPES),
        cx: rand(40, 360),
        cy: rand(40, 260),
        size: rand(15, 35),
        color: pick(COLORS),
        rotation: rand(0, 360)
      });
    }
    return shapes;
  }

  function pickDifferences(shapes, count) {
    var indices = [];
    for (var i = 0; i < shapes.length; i++) indices.push(i);
    // Shuffle
    for (var j = indices.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = indices[j]; indices[j] = indices[k]; indices[k] = tmp;
    }
    var diffIndices = indices.slice(0, count);
    return diffIndices.map(function(idx) {
      return { idx: idx, type: pick(['move','color','size','remove']) };
    });
  }

  function applyDifferences(shapes, diffs) {
    var modified = shapes.map(function(s) { return Object.assign({}, s); });
    diffs.forEach(function(d) {
      var s = modified[d.idx];
      if (d.type === 'move') {
        s.cx += rand(-30, 30);
        s.cy += rand(-30, 30);
        s.cx = Math.max(20, Math.min(380, s.cx));
        s.cy = Math.max(20, Math.min(280, s.cy));
      } else if (d.type === 'color') {
        s.color = pick(COLORS.filter(function(c) { return c !== s.color; }));
      } else if (d.type === 'size') {
        s.size *= rand(0.6, 1.6);
        s.size = Math.max(10, Math.min(50, s.size));
      } else if (d.type === 'remove') {
        s.removed = true;
      }
    });
    return modified;
  }

  function shapeToSvg(s) {
    if (s.removed) return '';
    var r = s.size;
    if (s.type === 'circle') {
      return '<circle cx="' + s.cx + '" cy="' + s.cy + '" r="' + r + '" fill="' + s.color + '" />';
    } else if (s.type === 'rect') {
      return '<rect x="' + (s.cx - r) + '" y="' + (s.cy - r) + '" width="' + (r * 2) + '" height="' + (r * 2) + '" rx="4" fill="' + s.color + '" transform="rotate(' + s.rotation + ' ' + s.cx + ' ' + s.cy + ')" />';
    } else if (s.type === 'triangle') {
      var halfH = r * 0.866;
      return '<polygon points="' + s.cx + ',' + (s.cy - halfH) + ' ' + (s.cx - r) + ',' + (s.cy + halfH) + ' ' + (s.cx + r) + ',' + (s.cy + halfH) + '" fill="' + s.color + '" transform="rotate(' + s.rotation + ' ' + s.cx + ' ' + s.cy + ')" />';
    } else if (s.type === 'star') {
      var pts = '';
      for (var i = 0; i < 10; i++) {
        var angle = (Math.PI / 5) * i - Math.PI / 2;
        var radius = i % 2 === 0 ? r : r * 0.4;
        pts += (s.cx + Math.cos(angle) * radius) + ',' + (s.cy + Math.sin(angle) * radius) + ' ';
      }
      return '<polygon points="' + pts.trim() + '" fill="' + s.color + '" transform="rotate(' + s.rotation + ' ' + s.cx + ' ' + s.cy + ')" />';
    }
    return '';
  }

  function renderScene(svg, shapes, diffs, isRight) {
    var bg = '<rect width="400" height="300" fill="#0f1923" rx="12" />';
    var content = shapes.map(function(s) { return shapeToSvg(s); }).join('');
    var markers = '';
    if (isRight && diffs) {
      diffs.forEach(function(d, i) {
        if (!d.found) {
          markers += '<circle cx="' + shapes[d.idx].cx + '" cy="' + shapes[d.idx].cy + '" r="25" fill="transparent" stroke="transparent" class="diff-zone" data-diff="' + i + '" style="cursor:pointer;" />';
        } else {
          markers += '<circle cx="' + shapes[d.idx].cx + '" cy="' + shapes[d.idx].cy + '" r="18" fill="none" stroke="#4ade80" stroke-width="3" stroke-dasharray="4" class="diff-found" />';
        }
      });
    }
    svg.innerHTML = bg + content + markers;

    if (isRight) {
      var zones = svg.querySelectorAll('.diff-zone');
      zones.forEach(function(zone) {
        zone.addEventListener('click', function(e) {
          var diffIdx = parseInt(zone.dataset.diff);
          handleDiffClick(diffIdx);
        });
      });
    }
  }

  function handleDiffClick(diffIdx) {
    if (!gameActive) return;
    if (sceneData.diffs[diffIdx].found) return;

    sceneData.diffs[diffIdx].found = true;
    found++;
    foundEl.textContent = found + '/' + NUM_DIFFS;
    renderScene(svgRight, sceneData.rightShapes, sceneData.diffs, true);

    if (found >= NUM_DIFFS) {
      gameWon();
    }
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    secondsElapsed = 0;
    updateTimer();
    timerInterval = setInterval(function() {
      secondsElapsed++;
      updateTimer();
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateTimer() {
    var mins = Math.floor(secondsElapsed / 60);
    var secs = secondsElapsed % 60;
    timerEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function formatTime(s) {
    var mins = Math.floor(s / 60);
    var secs = s % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function gameWon() {
    stopTimer();
    gameActive = false;

    var best = localStorage.getItem('tablo-spot-best');
    if (!best || secondsElapsed < parseInt(best)) {
      localStorage.setItem('tablo-spot-best', secondsElapsed.toString());
      updateBest();
    }

    winnerStats.textContent = tr('spot_time') + ': ' + formatTime(secondsElapsed);
    winnerModal.classList.add('visible');
  }

  function updateBest() {
    var best = localStorage.getItem('tablo-spot-best');
    if (best) bestEl.textContent = formatTime(parseInt(best));
  }

  function newGame() {
    found = 0;
    foundEl.textContent = '0/' + NUM_DIFFS;
    winnerModal.classList.remove('visible');
    gameActive = true;

    var shapes = generateScene();
    var diffs = pickDifferences(shapes, NUM_DIFFS);
    diffs.forEach(function(d) { d.found = false; });

    var rightShapes = applyDifferences(shapes, diffs);

    sceneData = { leftShapes: shapes, rightShapes: rightShapes, diffs: diffs };

    renderScene(svgLeft, shapes, null, false);
    renderScene(svgRight, rightShapes, diffs, true);

    startTimer();
  }

  function initGame() {
    updateBest();
    if (newGameBtn) {
      newGameBtn.addEventListener('click', function() {
        newGame();
        showToast(tr('toast_restarted'));
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', newGame);
    }
    newGame();
  }

  window.initGame = initGame;
})();