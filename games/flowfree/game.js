(function() {
  'use strict';

  console.log('[FlowFree] game.js loaded');

  var gridSize = 6;
  var cellSize = 50;
  var canvas, ctx;
  var containerEl;

  var grid = [];
  var endpoints = [];
  var paths = {};
  var dragColor = null;
  var dragFromEndpoint = false;
  var lastCell = null;
  var isDragging = false;

  var moves = 0;
  var level = 1;

  var movesEl, levelEl, pipesEl, sizeSelect;
  var newGameBtn, clearBtn;
  var winnerModal, winnerIcon, winnerTitle, winnerMessage, playAgainBtn;
  var toast;

  var COLOR_LIST = [
    '#ef4444', '#f59e0b', '#2dd4bf', '#3b82f6',
    '#a855f7', '#ec4899', '#eab308', '#22c55e'
  ];

  function tr(key) {
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
    return t ? (t[key] || key) : key;
  }

  function showToast(msg, isRaw) {
    if (!toast) return;
    toast.textContent = isRaw ? msg : tr(msg);
    toast.classList.add('visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function() {
      toast.classList.remove('visible');
    }, 2000);
  }

  function sameCell(a, b) {
    return a && b && a.x === b.x && a.y === b.y;
  }

  function isAdjacent(a, b) {
    if (!a || !b) return false;
    var dx = Math.abs(a.x - b.x);
    var dy = Math.abs(a.y - b.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function findEndpoint(color, cell) {
    for (var i = 0; i < endpoints.length; i++) {
      var ep = endpoints[i];
      if (ep.color === color) {
        if (sameCell(ep.start, cell)) return 'start';
        if (sameCell(ep.end, cell)) return 'end';
      }
    }
    return null;
  }

  function getOtherEnd(color, cell) {
    for (var i = 0; i < endpoints.length; i++) {
      var ep = endpoints[i];
      if (ep.color === color) {
        if (sameCell(ep.start, cell)) return ep.end;
        if (sameCell(ep.end, cell)) return ep.start;
      }
    }
    return null;
  }

  function generateLevel(size) {
    var numPairs = Math.min(Math.max(3, Math.floor(size / 2)), COLOR_LIST.length);
    var pairs = [];
    var occupied = [];

    for (var p = 0; p < numPairs; p++) {
      var pos1, pos2;
      var tries = 0;

      do {
        pos1 = randomCell(size);
        pos2 = randomCell(size);
        tries++;
      } while ((sameCell(pos1, pos2) || isInList(pos1, occupied) || isInList(pos2, occupied)) && tries < 200);

      occupied.push(pos1, pos2);
      pairs.push({ color: COLOR_LIST[p], start: pos1, end: pos2 });
    }

    return pairs;
  }

  function randomCell(size) {
    return { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
  }

  function isInList(cell, list) {
    for (var i = 0; i < list.length; i++) {
      if (sameCell(cell, list[i])) return true;
    }
    return false;
  }

  function resizeCanvas() {
    if (!canvas || !containerEl) return;
    var containerWidth = containerEl.clientWidth;
    var containerHeight = containerEl.clientHeight;

    if (containerWidth === 0 || containerHeight === 0) {
      setTimeout(resizeCanvas, 50);
      return;
    }

    var availableWidth = containerWidth - 32;
    var availableHeight = containerHeight - 32;
    var maxHeight = window.innerHeight * 0.5;
    var maxDim = Math.min(availableWidth, availableHeight, maxHeight, 580);

    cellSize = Math.floor(maxDim / gridSize);
    if (cellSize < 25) cellSize = 25;

    var pixelSize = cellSize * gridSize;
    if (pixelSize > availableWidth) pixelSize = availableWidth;
    if (pixelSize > availableHeight) pixelSize = availableHeight;

    canvas.width = pixelSize;
    canvas.height = pixelSize;
    canvas.style.width = pixelSize + 'px';
    canvas.style.height = pixelSize + 'px';
    canvas.style.margin = '0 auto';

    console.log('[FlowFree] Canvas:', pixelSize, 'cellSize:', cellSize);
    draw();
  }

  function initGame() {
    console.log('[FlowFree] initGame() called');

    canvas = document.getElementById('flow-canvas');
    ctx = canvas.getContext('2d');
    containerEl = document.getElementById('flow-container');
    movesEl = document.getElementById('moves');
    levelEl = document.getElementById('level');
    pipesEl = document.getElementById('pipes');
    sizeSelect = document.getElementById('size-select');
    newGameBtn = document.getElementById('btn-new-game');
    clearBtn = document.getElementById('btn-clear');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    playAgainBtn = document.getElementById('btn-play-again');
    toast = document.getElementById('toast');

    canvas.addEventListener('mousedown', function(e) { e.preventDefault(); var cell = getCellFromPointer(e); startDrag(cell); });
    canvas.addEventListener('mousemove', function(e) { if (!isDragging) return; var cell = getCellFromPointer(e); continueDrag(cell); });
    document.addEventListener('mouseup', function() { if (isDragging) endDrag(); });

    canvas.addEventListener('touchstart', function(e) { e.preventDefault(); var cell = getCellFromPointer(e); startDrag(cell); }, { passive: false });
    canvas.addEventListener('touchmove', function(e) { e.preventDefault(); if (!isDragging) return; var cell = getCellFromPointer(e); continueDrag(cell); }, { passive: false });
    canvas.addEventListener('touchend', function() { if (isDragging) endDrag(); });

    if (sizeSelect) sizeSelect.addEventListener('change', function(e) { gridSize = parseInt(e.target.value); startNewGame(); });
    if (newGameBtn) newGameBtn.addEventListener('click', startNewGame);
    if (clearBtn) clearBtn.addEventListener('click', clearAllPaths);
    
    // FIXED: Close modal FIRST, then new game
    if (playAgainBtn) playAgainBtn.addEventListener('click', function() {
      console.log('[FlowFree] Play Again clicked');
      if (winnerModal) {
        winnerModal.classList.remove('visible');
        winnerModal.style.display = 'none';
        console.log('[FlowFree] Modal hidden');
        // Small delay before new game starts
        setTimeout(function() {
          console.log('[FlowFree] Starting new game');
          startNewGame();
        }, 100);
      }
    });

    window.addEventListener('resize', function() { clearTimeout(resizeCanvas._t); resizeCanvas._t = setTimeout(resizeCanvas, 150); });

    startNewGame();
    setTimeout(function() { resizeCanvas(); console.log('[FlowFree] Delayed resize done'); }, 200);
    console.log('[FlowFree] Init complete');
  }

  function startNewGame() {
    gridSize = parseInt(sizeSelect.value);
    moves = 0;
    isDragging = false;
    dragColor = null;
    lastCell = null;

    grid = [];
    for (var i = 0; i < gridSize; i++) {
      grid[i] = [];
      for (var j = 0; j < gridSize; j++) { grid[i][j] = null; }
    }

    endpoints = generateLevel(gridSize);
    paths = {};

    for (var p = 0; p < endpoints.length; p++) {
      var ep = endpoints[p];
      grid[ep.start.y][ep.start.x] = ep.color;
      grid[ep.end.y][ep.end.x] = ep.color;
      paths[ep.color] = [clone(ep.start)];
    }

    updateStats();
    resizeCanvas();
    draw();
  }

  function clearAllPaths() {
    for (var i = 0; i < gridSize; i++) {
      for (var j = 0; j < gridSize; j++) { grid[i][j] = null; }
    }
    for (var p = 0; p < endpoints.length; p++) {
      var ep = endpoints[p];
      grid[ep.start.y][ep.start.x] = ep.color;
      grid[ep.end.y][ep.end.x] = ep.color;
      paths[ep.color] = [clone(ep.start)];
    }
    moves = 0;
    updateStats();
    draw();
  }

  function updateStats() {
    if (movesEl) movesEl.textContent = moves;
    var connected = 0;
    var total = endpoints.length;

    for (var p = 0; p < endpoints.length; p++) {
      var ep = endpoints[p];
      var path = paths[ep.color];
      if (path && path.length >= 2) {
        var last = path[path.length - 1];
        if (sameCell(last, ep.end)) connected++;
      }
    }

    if (pipesEl) pipesEl.textContent = connected + '/' + total;
  }

  function getCellFromPointer(e) {
    var rect = canvas.getBoundingClientRect();
    var clientX = e.clientX;
    var clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    var x = Math.floor((clientX - rect.left) / cellSize);
    var y = Math.floor((clientY - rect.top) / cellSize);
    if (x < 0) x = 0; if (x >= gridSize) x = gridSize - 1;
    if (y < 0) y = 0; if (y >= gridSize) y = gridSize - 1;
    return { x: x, y: y };
  }

  function startDrag(cell) {
    var cellColor = grid[cell.y][cell.x];
    if (!cellColor) return;
    var epType = findEndpoint(cellColor, cell);

    if (epType) {
      dragColor = cellColor;
      dragFromEndpoint = true;
      clearColorFromGrid(cellColor);
      paths[cellColor] = [clone(cell)];
      grid[cell.y][cell.x] = cellColor;
      isDragging = true;
      lastCell = clone(cell);
      moves++;
      draw();
      updateStats();
    } else {
      dragColor = cellColor;
      dragFromEndpoint = false;
      var path = paths[cellColor];
      if (path) {
        var idx = -1;
        for (var i = 0; i < path.length; i++) {
          if (sameCell(path[i], cell)) { idx = i; break; }
        }
        if (idx >= 0) {
          for (var j = idx + 1; j < path.length; j++) {
            var c = path[j];
            if (!findEndpoint(cellColor, c)) { grid[c.y][c.x] = null; }
          }
          paths[cellColor] = path.slice(0, idx + 1);
        }
      }
      isDragging = true;
      lastCell = clone(cell);
      moves++;
      draw();
      updateStats();
    }
  }

  function continueDrag(cell) {
    if (!isDragging || !dragColor) return;
    if (sameCell(cell, lastCell)) return;

    var path = paths[dragColor];

    if (path.length >= 2) {
      var prev = path[path.length - 2];
      if (sameCell(cell, prev)) {
        var removed = path.pop();
        if (!findEndpoint(dragColor, removed)) { grid[removed.y][removed.x] = null; }
        lastCell = clone(cell);
        draw();
        updateStats();
        return;
      }
    }

    if (!isAdjacent(lastCell, cell)) return;

    for (var i = 0; i < path.length; i++) {
      if (sameCell(path[i], cell)) return;
    }

    var otherEndpoint = false;
    for (var p = 0; p < endpoints.length; p++) {
      var ep = endpoints[p];
      if (ep.color !== dragColor) {
        if (sameCell(ep.start, cell) || sameCell(ep.end, cell)) { otherEndpoint = true; break; }
      }
    }
    if (otherEndpoint) return;

    if (grid[cell.y][cell.x] !== null && grid[cell.y][cell.x] !== dragColor) {
      var otherColor = grid[cell.y][cell.x];
      var otherPath = paths[otherColor];
      if (otherPath) {
        var otherIdx = -1;
        for (var k = 0; k < otherPath.length; k++) {
          if (sameCell(otherPath[k], cell)) { otherIdx = k; break; }
        }
        if (otherIdx >= 0) {
          for (var m = otherIdx; m < otherPath.length; m++) {
            var oc = otherPath[m];
            if (!findEndpoint(otherColor, oc)) { grid[oc.y][oc.x] = null; }
          }
          paths[otherColor] = otherPath.slice(0, otherIdx);
        }
      }
    }

    paths[dragColor].push(clone(cell));
    grid[cell.y][cell.x] = dragColor;
    lastCell = clone(cell);
    moves++;
    draw();
    updateStats();

    var otherEnd = getOtherEnd(dragColor, cell);
    if (otherEnd && sameCell(cell, otherEnd)) {
      console.log('[FlowFree] Reached endpoint - checking win');
      checkWin();
    }
  }

  function endDrag() {
    console.log('[FlowFree] Drag ended - checking win');
    isDragging = false;
    dragColor = null;
    dragFromEndpoint = false;
    lastCell = null;
    updateStats();
    checkWin();
  }

  function clearColorFromGrid(color) {
    for (var i = 0; i < gridSize; i++) {
      for (var j = 0; j < gridSize; j++) {
        if (grid[i][j] === color) {
          var isMyEndpoint = false;
          for (var p = 0; p < endpoints.length; p++) {
            if (endpoints[p].color === color) {
              if (sameCell(endpoints[p].start, {x: j, y: i}) || sameCell(endpoints[p].end, {x: j, y: i})) {
                isMyEndpoint = true; break;
              }
            }
          }
          if (!isMyEndpoint) { grid[i][j] = null; }
        }
      }
    }
  }

  function checkWin() {
    console.log('[FlowFree] checkWin() called - endpoints:', endpoints.length);
    var allConnected = true;

    for (var p = 0; p < endpoints.length; p++) {
      var ep = endpoints[p];
      var path = paths[ep.color];

      console.log('[FlowFree] Checking color', ep.color, '- path length:', path ? path.length : 0);

      if (!path || path.length < 2) {
        allConnected = false;
        console.log('[FlowFree] Path too short');
        break;
      }

      var firstPoint = path[0];
      var lastPoint = path[path.length - 1];

      console.log('[FlowFree] First:', firstPoint, 'Last:', lastPoint, 'Start:', ep.start, 'End:', ep.end);

      var startsAtStart = sameCell(firstPoint, ep.start);
      var startsAtEnd = sameCell(firstPoint, ep.end);
      var endsAtStart = sameCell(lastPoint, ep.start);
      var endsAtEnd = sameCell(lastPoint, ep.end);

      if (!((startsAtStart && endsAtEnd) || (startsAtEnd && endsAtStart))) {
        allConnected = false;
        console.log('[FlowFree] Not properly connected');
        break;
      }

      var hasStart = false;
      var hasEnd = false;
      for (var i = 0; i < path.length; i++) {
        if (sameCell(path[i], ep.start)) hasStart = true;
        if (sameCell(path[i], ep.end)) hasEnd = true;
      }

      if (!hasStart || !hasEnd) {
        allConnected = false;
        console.log('[FlowFree] Missing endpoint');
        break;
      }
    }

    if (allConnected) {
      console.log('[FlowFree] WIN DETECTED!');
      showWinner();
    }
  }

  function showWinner() {
    console.log('[FlowFree] showWinner() called');
    
    if (winnerIcon) winnerIcon.textContent = '\u{1F389}';
    if (winnerTitle) winnerTitle.textContent = tr('flow_solved');
    if (winnerMessage) {
      winnerMessage.textContent = tr('flow_win_message') + ' ' + moves + ' ' + tr('flow_moves_lower');
    }
    
    if (winnerModal) {
      winnerModal.classList.add('visible');
      winnerModal.style.display = 'flex';
      console.log('[FlowFree] Modal shown - display:', winnerModal.style.display, 'class:', winnerModal.className);
    }
  }

  function draw() {
    if (!ctx || !canvas || canvas.width === 0 || canvas.height === 0) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (var i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    for (var p = 0; p < endpoints.length; p++) {
      var ep = endpoints[p];
      var path = paths[ep.color];
      if (path && path.length >= 2) {
        drawPathLine(ep.color, path);
      }
    }

    for (var p = 0; p < endpoints.length; p++) {
      var ep = endpoints[p];
      drawDot(ep.start.x, ep.start.y, ep.color);
      drawDot(ep.end.x, ep.end.y, ep.color);
    }
  }

  function drawPathLine(color, path) {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(3, cellSize * 0.35);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(path[0].x * cellSize + cellSize / 2, path[0].y * cellSize + cellSize / 2);
    for (var i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x * cellSize + cellSize / 2, path[i].y * cellSize + cellSize / 2);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawDot(x, y, color) {
    var cx = x * cellSize + cellSize / 2;
    var cy = y * cellSize + cellSize / 2;
    var radius = Math.max(4, cellSize * 0.32);
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  window.initGame = initGame;
})();