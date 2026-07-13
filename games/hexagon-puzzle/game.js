// ============================================
// Tablo — Hexagon Puzzle (Hex Flood)
// ============================================

(function() {
  'use strict';

  var GRID_RADIUS = 5;
  var COLORS = [
    '#2dd4bf', '#f59e0b', '#f87171',
    '#a78bfa', '#60a5fa', '#4ade80'
  ];
  var canvas = document.getElementById('hex-canvas');
  var ctx = canvas.getContext('2d');
  var colorPickerEl = document.getElementById('color-picker');
  var movesEl = document.getElementById('moves');
  var parEl = document.getElementById('par');
  var bestEl = document.getElementById('best-score');
  var newGameBtn = document.getElementById('btn-new-game');
  var nextBtn = document.getElementById('btn-next');
  var winnerModal = document.getElementById('winner-modal');
  var winnerStats = document.getElementById('winner-stats');
  var toast = document.getElementById('toast');

  var hexSize = 22;
  var centerX = 210, centerY = 200;
  var grid = {};
  var currentColor = 0;
  var moves = 0;
  var par = 0;
  var gameActive = false;

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

  function hexKey(q, r) { return q + ',' + r; }

  function generateGrid() {
    grid = {};
    for (var q = -GRID_RADIUS; q <= GRID_RADIUS; q++) {
      for (var r = -GRID_RADIUS; r <= GRID_RADIUS; r++) {
        var s = -q - r;
        if (Math.abs(s) > GRID_RADIUS) continue;
        grid[hexKey(q, r)] = { q: q, r: r, color: Math.floor(Math.random() * COLORS.length) };
      }
    }
  }

  function hexToPixel(q, r) {
    var x = hexSize * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
    var y = hexSize * (1.5 * r);
    return { x: x + centerX, y: y + centerY };
  }

  function pixelToHex(px, py) {
    var x = px - centerX;
    var y = py - centerY;
    var q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / hexSize;
    var r = (2 / 3 * y) / hexSize;
    return hexRound(q, r);
  }

  function hexRound(q, r) {
    var s = -q - r;
    var rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
    var dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
    if (dq > dr && dq > ds) rq = -rr - rs;
    else if (dr > ds) rr = -rq - rs;
    return { q: rq, r: rr };
  }

  function drawHex(x, y, size, fillColor, strokeColor) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var angle = Math.PI / 3 * i + Math.PI / 6;
      var hx = x + size * Math.cos(angle);
      var hy = y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var key in grid) {
      if (!grid.hasOwnProperty(key)) continue;
      var h = grid[key];
      var p = hexToPixel(h.q, h.r);
      drawHex(p.x, p.y, hexSize - 1, COLORS[h.color], 'rgba(0,0,0,0.15)');
    }
  }

  function getNeighbors(q, r) {
    var dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
    var neighbors = [];
    for (var i = 0; i < dirs.length; i++) {
      var k = hexKey(q + dirs[i][0], r + dirs[i][1]);
      if (grid[k]) neighbors.push(grid[k]);
    }
    return neighbors;
  }

  function getConnectedRegion(startQ, startR) {
    var startKey = hexKey(startQ, startR);
    if (!grid[startKey]) return [];
    var startColor = grid[startKey].color;
    var visited = {};
    var queue = [grid[startKey]];
    visited[startKey] = true;
    var region = [grid[startKey]];

    while (queue.length > 0) {
      var cur = queue.shift();
      var neighbors = getNeighbors(cur.q, cur.r);
      for (var i = 0; i < neighbors.length; i++) {
        var nk = hexKey(neighbors[i].q, neighbors[i].r);
        if (!visited[nk] && neighbors[i].color === startColor) {
          visited[nk] = true;
          queue.push(neighbors[i]);
          region.push(neighbors[i]);
        }
      }
    }
    return region;
  }

  function flood(newColor) {
    if (!gameActive) return;
    var region = getConnectedRegion(0, 0);
    if (region[0].color === newColor) return;

    for (var i = 0; i < region.length; i++) {
      region[i].color = newColor;
    }
    moves++;
    movesEl.textContent = moves;
    draw();
    updateColorPicker();

    if (isSolved()) {
      gameWon();
    }
  }

  function isSolved() {
    var firstColor = grid[hexKey(0, 0)].color;
    for (var key in grid) {
      if (grid[key].color !== firstColor) return false;
    }
    return true;
  }

  function calculatePar() {
    var remaining = 0;
    var seen = {};
    for (var key in grid) {
      if (!seen[key]) {
        var region = getConnectedRegion(grid[key].q, grid[key].r);
        for (var i = 0; i < region.length; i++) {
          seen[hexKey(region[i].q, region[i].r)] = true;
        }
        remaining++;
      }
    }
    return remaining - 1 + Math.floor(GRID_RADIUS / 2);
  }

  function gameWon() {
    gameActive = false;
    var best = localStorage.getItem('tablo-hex-best');
    if (!best || moves < parseInt(best)) {
      localStorage.setItem('tablo-hex-best', moves.toString());
      updateBest();
    }
    winnerStats.textContent = tr('hex_moves') + ': ' + moves + ' / ' + tr('hex_par') + ': ' + par;
    winnerModal.classList.add('visible');
  }

  function updateBest() {
    var best = localStorage.getItem('tablo-hex-best');
    bestEl.textContent = best || '--';
  }

  function renderColorPicker() {
    colorPickerEl.innerHTML = '';
    for (var i = 0; i < COLORS.length; i++) {
      var btn = document.createElement('button');
      btn.className = 'color-btn';
      btn.style.background = COLORS[i];
      btn.dataset.color = i;
      btn.addEventListener('click', function(e) {
        flood(parseInt(e.currentTarget.dataset.color));
      });
      colorPickerEl.appendChild(btn);
    }
  }

  function updateColorPicker() {
    var btns = colorPickerEl.querySelectorAll('.color-btn');
    btns.forEach(function(btn, i) {
      if (grid[hexKey(0,0)] && i === grid[hexKey(0,0)].color) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function newGame() {
    generateGrid();
    moves = 0;
    par = calculatePar();
    movesEl.textContent = '0';
    parEl.textContent = par;
    gameActive = true;
    winnerModal.classList.remove('visible');
    draw();
    updateColorPicker();
  }

  function initGame() {
    updateBest();
    renderColorPicker();

    if (newGameBtn) {
      newGameBtn.addEventListener('click', function() {
        newGame();
        showToast(tr('toast_restarted'));
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', newGame);
    }

    canvas.addEventListener('click', function(e) {
      var rect = canvas.getBoundingClientRect();
      var x = (e.clientX - rect.left) * (canvas.width / rect.width);
      var y = (e.clientY - rect.top) * (canvas.height / rect.height);
      var h = pixelToHex(x, y);
      if (grid[hexKey(h.q, h.r)]) {
        flood(grid[hexKey(h.q, h.r)].color);
      }
    });

    newGame();
  }

  window.initGame = initGame;
})();