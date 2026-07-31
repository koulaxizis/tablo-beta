============================================
Tablo — Flow Free Game.js (Complete)
============================================

// ============================================
// Tablo — Flow Free
// ============================================

(function() {
  'use strict';

  console.log('[FlowFree] game.js loaded');

  var gridSize = 6;
  var cellSize = 50;
  var canvas, ctx;
  var grid = [];
  var endpoints = [];
  var paths = {};
  var moves = 0;
  var level = 1;
  var hintsUsed = 0;
  var gameActive = true;
  var dragging = false;
  var currentColor = null;
  var startPos = null;
  var history = [];

  var containerEl, movesEl, levelEl, hintsEl, sizeSelect;
  var newGameBtn, undoBtn, hintBtn, clearBtn;
  var winnerModal, winnerIcon, winnerTitle, winnerMessage, playAgainBtn, nextLevelBtn;
  var toast;

  var COLORS = {
    red:    '#ef4444',
    orange: '#f59e0b',
    teal:   '#2dd4bf',
    blue:   '#3b82f6',
    purple: '#a855f7',
    pink:   '#ec4899',
    yellow: '#eab308',
    green:  '#22c55e'
  };

  var COLOR_KEYS = Object.keys(COLORS);

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

  function generateLevel(size, difficulty) {
    var numPairs = Math.min(3 + Math.floor(difficulty / 2), COLOR_KEYS.length);
    var pairs = [];
    var used = [];

    for (var p = 0; p < numPairs; p++) {
      var pos1, pos2;
      var attempts = 0;

      do {
        pos1 = {
          x: Math.floor(Math.random() * size),
          y: Math.floor(Math.random() * size)
        };
        pos2 = {
          x: Math.floor(Math.random() * size),
          y: Math.floor(Math.random() * size)
        };
        attempts++;
      } while ((pos1.x === pos2.x && pos1.y === pos2.y) || 
               isOccupied(pos1, used) || 
               isOccupied(pos2, used) ||
               attempts < 100);

      used.push(pos1, pos2);
      pairs.push({
        color: COLORS[COLOR_KEYS[p]],
        start: pos1,
        end: pos2
      });
    }

    return pairs;
  }

  function isOccupied(pos, used) {
    for (var i = 0; i < used.length; i++) {
      if (used[i].x === pos.x && used[i].y === pos.y) return true;
    }
    return false;
  }

  function initGame() {
    console.log('[FlowFree] initGame() called');

    canvas = document.getElementById('flow-canvas');
    ctx = canvas.getContext('2d');
    containerEl = document.getElementById('flow-container');
    movesEl = document.getElementById('moves');
    levelEl = document.getElementById('level');
    hintsEl = document.getElementById('hints');
    sizeSelect = document.getElementById('size-select');
    newGameBtn = document.getElementById('btn-new-game');
    undoBtn = document.getElementById('btn-undo');
    hintBtn = document.getElementById('btn-hint');
    clearBtn = document.getElementById('btn-clear');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    playAgainBtn = document.getElementById('btn-play-again');
    nextLevelBtn = document.getElementById('btn-next-level');
    toast = document.getElementById('toast');

    sizeSelect.value = '6';
    startNewGame();

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleMouseUp);

    if (sizeSelect) sizeSelect.addEventListener('change', function(e) {
      gridSize = parseInt(e.target.value);
      startNewGame();
    });

    if (newGameBtn) newGameBtn.addEventListener('click', startNewGame);
    if (undoBtn) undoBtn.addEventListener('click', undoMove);
    if (hintBtn) hintBtn.addEventListener('click', useHint);
    if (clearBtn) clearBtn.addEventListener('click', clearPaths);
    if (playAgainBtn) playAgainBtn.addEventListener('click', closeWinnerAndNewGame);
    if (nextLevelBtn) nextLevelBtn.addEventListener('click', nextLevel);

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    console.log('[FlowFree] Init complete');
  }

  function resizeCanvas() {
    var maxSize = Math.min(containerEl.clientWidth - 40, 600);
    cellSize = Math.floor(maxSize / gridSize);
    canvas.width = cellSize * gridSize;
    canvas.height = cellSize * gridSize;
    draw();
  }

  function startNewGame() {
    gridSize = parseInt(sizeSelect.value);
    level = 1;
    moves = 0;
    hintsUsed = 0;
    gameActive = true;
    history = [];
    paths = {};

    endpoints = generateLevel(gridSize, level);
    grid = [];

    for (var i = 0; i < gridSize; i++) {
      grid[i] = [];
      for (var j = 0; j < gridSize; j++) {
        grid[i][j] = null;
      }
    }

    for (var p = 0; p < endpoints.length; p++) {
      var ep = endpoints[p];
      grid[ep.start.y][ep.start.x] = ep.color;
      grid[ep.end.y][ep.end.x] = ep.color;
      paths[ep.color] = [ep.start, ep.end];
    }

    updateStats();
    resizeCanvas();
    draw();
  }

  function closeWinnerAndNewGame() {
    if (winnerModal) winnerModal.classList.remove('visible');
    startNewGame();
  }

  function nextLevel() {
    if (winnerModal) winnerModal.classList.remove('visible');
    level++;
    startNewGame();
  }

  function updateStats() {
    if (movesEl) movesEl.textContent = moves;
    if (levelEl) levelEl.textContent = level;
    if (hintsEl) hintsEl.textContent = hintsUsed;
  }

  function getCellFromEvent(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    
    var clientX = e.clientX || (e.touches && e.touches[0].clientX);
    var clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    var x = Math.floor((clientX - rect.left) * scaleX / cellSize);
    var y = Math.floor((clientY - rect.top) * scaleY / cellSize);
    
    return { x: x, y: y };
  }

  function handleMouseDown(e) {
    if (!gameActive) return;
    var cell = getCellFromEvent(e);
    startDrag(cell);
  }

  function handleTouchStart(e) {
    if (!gameActive) return;
    e.preventDefault();
    var cell = getCellFromEvent(e);
    startDrag(cell);
  }

  function handleMouseMove(e) {
    if (!dragging) return;
    var cell = getCellFromEvent(e);
    continueDrag(cell);
  }

  function handleTouchMove(e) {
    if (!dragging) return;
    e.preventDefault();
    var cell = getCellFromEvent(e);
    continueDrag(cell);
  }

  function handleMouseUp() {
    if (dragging) {
      endDrag();
    }
  }

  function startDrag(cell) {
    if (cell.x < 0 || cell.x >= gridSize || cell.y < 0 || cell.y >= gridSize) return;

    var cellColor = grid[cell.y][cell.x];
    if (!cellColor) return;

    dragging = true;
    currentColor = cellColor;
    startPos = cell;
  }

  function continueDrag(cell) {
    if (!dragging || !gameActive) return;
    if (cell.x < 0 || cell.x >= gridSize || cell.y < 0 || cell.y >= gridSize) return;

    if (cell.x === startPos.x && cell.y === startPos.y) return;

    if (grid[cell.y][cell.x] === null || grid[cell.y][cell.x] === currentColor) {
      addToPath(currentColor, cell);
      moves++;
      updateStats();
      startPos = cell;
      draw();
      checkWin();
    }
  }

  function endDrag() {
    dragging = false;
    currentColor = null;
    startPos = null;
  }

  function addToPath(color, cell) {
    if (!paths[color]) paths[color] = [];

    var last = paths[color][paths[color].length - 1];
    if (last && last.x === cell.x && last.y === cell.y) return;

    history.push({
      color: color,
      action: 'add',
      cell: cell,
      pathIndex: paths[color].length
    });

    paths[color].push(cell);
    grid[cell.y][cell.x] = color;
  }

  function removeFromPath(color, cell) {
    if (!paths[color]) return;

    var idx = -1;
    for (var i = 0; i < paths[color].length; i++) {
      if (paths[color][i].x === cell.x && paths[color][i].y === cell.y) {
        idx = i;
        break;
      }
    }

    if (idx > -1 && idx < paths[color].length - 1) {
      history.push({
        color: color,
        action: 'remove',
        cell: cell,
        pathIndex: idx
      });

      paths[color].splice(idx, 1);
      grid[cell.y][cell.x] = null;
      
      if (isEndpoint(color, cell)) {
        grid[cell.y][cell.x] = color;
      }
    }
  }

  function isEndpoint(color, cell) {
    for (var p = 0; p < endpoints.length; p++) {
      var ep = endpoints[p];
      if (ep.color === color) {
        if (ep.start.x === cell.x && ep.start.y === cell.y) return true;
        if (ep.end.x === cell.x && ep.end.y === cell.y) return true;
      }
    }
    return false;
  }

  function undoMove() {
    if (history.length === 0 || !gameActive) return;

    var last = history.pop();
    moves = Math.max(0, moves - 1);
    updateStats();

    if (last.action === 'add') {
      grid[last.cell.y][last.cell.x] = isEndpoint(last.color, last.cell) ? last.color : null;
      if (paths[last.color]) {
        paths[last.color].pop();
      }
    } else if (last.action === 'remove') {
      grid[last.cell.y][last.cell.x] = last.color;
      if (paths[last.color]) {
        paths[last.color].splice(last.pathIndex, 0, last.cell);
      }
    }

    draw();
  }

  function clearPaths() {
    if (!gameActive) return;

    for (var p = 0; p < endpoints.length; p++) {
      var ep = endpoints[p];
      for (var i = 0; i < gridSize; i++) {
        for (var j = 0; j < gridSize; j++) {
          if (grid[i][j] === ep.color && !isEndpoint(ep.color, {x: j, y: i})) {
            grid[i][j] = null;
          }
        }
      }
      paths[ep.color] = [ep.start, ep.end];
    }

    history = [];
    moves = 0;
    updateStats();
    draw();
  }

  function useHint() {
    if (!gameActive) return;

    for (var p = 0; p < endpoints.length; p++) {
      var ep = endpoints[p];
      var path = paths[ep.color];
      var last = path[path.length - 1];

      var neighbors = [
        {x: last.x+1, y: last.y},
        {x: last.x-1, y: last.y},
        {x: last.x, y: last.y+1},
        {x: last.x, y: last.y-1}
      ];

      for (var n = 0; n < neighbors.length; n++) {
        var nb = neighbors[n];
        if (nb.x >= 0 && nb.x < gridSize && nb.y >= 0 && nb.y < gridSize) {
          if (grid[nb.y][nb.x] === null || (nb.x === ep.end.x && nb.y === ep.end.y)) {
            addToPath(ep.color, nb);
            hintsUsed++;
            updateStats();
            draw();
            showToast('flow_hint_used', false);
            checkWin();
            return;
          }
        }
      }
    }

    showToast('flow_no_hint_available');
  }

  function checkWin() {
    for (var p = 0; p < endpoints.length; p++) {
      var ep = endpoints[p];
      var path = paths[ep.color];

      var connected = false;
      for (var i = 0; i < path.length - 1; i++) {
        if (path[i].x === ep.end.x && path[i].y === ep.end.y) {
          connected = true;
          break;
        }
        if (path[i+1].x === ep.end.x && path[i+1].y === ep.end.y) {
          connected = true;
          break;
        }
      }

      if (!connected) return;
    }

    gameActive = false;
    showWinner();
  }

  function showWinner() {
    if (winnerIcon) winnerIcon.textContent = '\u{1F389}';
    if (winnerTitle) winnerTitle.textContent = tr('flow_solved');
    if (winnerMessage) {
      winnerMessage.textContent = tr('flow_win_message') + ' ' + moves + ' ' + tr('flow_moves_lower');
    }
    if (winnerModal) winnerModal.classList.add('visible');
  }

  function draw() {
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < gridSize; i++) {
      for (var j = 0; j < gridSize; j++) {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }

    for (var p = 0; p < endpoints.length; p++) {
      var ep = endpoints[p];
      drawPath(ep.color, paths[ep.color]);
      drawEndpoint(ep.start.x, ep.start.y, ep.color);
      drawEndpoint(ep.end.x, ep.end.y, ep.color);
    }
  }

  function drawPath(color, path) {
    if (path.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = cellSize * 0.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(path[0].x * cellSize + cellSize/2, path[0].y * cellSize + cellSize/2);

    for (var i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x * cellSize + cellSize/2, path[i].y * cellSize + cellSize/2);
    }

    ctx.stroke();
  }

  function drawEndpoint(x, y, color) {
    var cx = x * cellSize + cellSize/2;
    var cy = y * cellSize + cellSize/2;
    var radius = cellSize * 0.35;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  window.initGame = initGame;
})();