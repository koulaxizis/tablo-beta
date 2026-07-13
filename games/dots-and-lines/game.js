// ============================================
// Tablo — Dots & Lines (Complete Fix)
// ============================================

(function() {
  'use strict';

  var GRID_SIZE = 5;
  var BOARD_SIZE = GRID_SIZE + 1;
  var dots = [];
  var lines = [];
  var boxes = [];
  var currentPlayer = 0;
  var scores = [0, 0];
  var gameActive = false;
  var aiThinking = false;

  var dotsEl = document.getElementById('dots-grid');
  var turnEl = document.getElementById('turn-display');
  var p1ScoreEl = document.getElementById('p1-score');
  var p2ScoreEl = document.getElementById('p2-score');
  var sizeSelect = document.getElementById('game-size');
  var resetBtn = document.getElementById('reset-btn');
  var winnerModal = document.getElementById('winner-modal');
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

  function initBoard() {
    dots = [];
    lines = [];
    boxes = [];
    scores = [0, 0];

    for (var r = 0; r < BOARD_SIZE; r++) {
      dots[r] = [];
      for (var c = 0; c < BOARD_SIZE; c++) {
        dots[r][c] = { x: 0, y: 0 };
      }
    }

    for (var br = 0; br < GRID_SIZE; br++) {
      boxes[br] = [];
      for (var bc = 0; bc < GRID_SIZE; bc++) {
        boxes[br][bc] = { top: null, right: null, bottom: null, left: null, owner: null };
      }
    }

    currentPlayer = 0;
    gameActive = true;
  }

  function calculatePositions() {
    if (!dotsEl) return;
    var width = dotsEl.offsetWidth;
    var height = dotsEl.offsetHeight;
    var dotSpacing = (Math.min(width, height) - 40) / GRID_SIZE;
    var startX = (width - dotSpacing * GRID_SIZE) / 2;
    var startY = (height - dotSpacing * GRID_SIZE) / 2;

    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        dots[r][c].x = startX + c * dotSpacing;
        dots[r][c].y = startY + r * dotSpacing;
      }
    }
  }

  function renderBoard() {
    if (!dotsEl) return;
    dotsEl.innerHTML = '';
    calculatePositions();

    var dotRadius = Math.max(10, Math.min(12, dotsEl.offsetWidth / (BOARD_SIZE * 3)));

    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        var dot = document.createElement('div');
        dot.className = 'dot';
        dot.dataset.r = r;
        dot.dataset.c = c;
        dot.style.width = dotRadius * 2 + 'px';
        dot.style.height = dotRadius * 2 + 'px';
        dot.style.left = (dots[r][c].x - dotRadius) + 'px';
        dot.style.top = (dots[r][c].y - dotRadius) + 'px';

        dot.addEventListener('click', function(e) {
          handleDotClick(parseInt(e.currentTarget.dataset.r), parseInt(e.currentTarget.dataset.c));
        });

        dotsEl.appendChild(dot);
      }
    }

    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        var lineId = 'h-' + r + '-' + c;
        var hLine = document.createElement('div');
        hLine.className = 'line horizontal';
        hLine.id = lineId;
        hLine.dataset.r = r;
        hLine.dataset.c = c;
        hLine.style.left = dots[r][c].x + 'px';
        hLine.style.top = (dots[r][c].y + 1) + 'px';
        hLine.style.width = (dots[r][c+1].x - dots[r][c].x) + 'px';
        hLine.style.height = '2px';

        hLine.addEventListener('click', function(e) {
          handleLineClick(parseInt(e.currentTarget.dataset.r), parseInt(e.currentTarget.dataset.c), 'horizontal');
          e.stopPropagation();
        });

        dotsEl.appendChild(hLine);
      }
    }

    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        var lineId = 'v-' + r + '-' + c;
        var vLine = document.createElement('div');
        vLine.className = 'line vertical';
        vLine.id = lineId;
        vLine.dataset.r = r;
        vLine.dataset.c = c;
        vLine.style.left = (dots[r+1][c].x + 1) + 'px';
        vLine.style.top = dots[r][c].y + 'px';
        vLine.style.height = (dots[r+1][c].y - dots[r][c].y) + 'px';
        vLine.style.width = '2px';

        vLine.addEventListener('click', function(e) {
          handleLineClick(parseInt(e.currentTarget.dataset.r), parseInt(e.currentTarget.dataset.c), 'vertical');
          e.stopPropagation();
        });

        dotsEl.appendChild(vLine);
      }
    }

    updateUI();
  }

  function handleDotClick(r, c) {}

  function handleLineClick(r, c, orientation) {
    if (!gameActive || aiThinking) return;

    var lineId = orientation === 'horizontal' ? 'h-' + r + '-' + c : 'v-' + r + '-' + c;
    var lineElement = document.getElementById(lineId);
    if (!lineElement || lineElement.classList.contains('drawn')) return;

    lines.push({ r: r, c: c, orientation: orientation, player: currentPlayer });
    lineElement.classList.add('drawn');
    lineElement.classList.add(currentPlayer === 0 ? 'player1' : 'player2');

    var completedBox = checkCompletedBox(r, c, orientation);
    if (completedBox !== null) {
      scores[currentPlayer]++;
      boxes[completedBox[0]][completedBox[1]].owner = currentPlayer;
      var boxElement = document.getElementById('box-' + completedBox[0] + '-' + completedBox[1]);
      if (boxElement) {
        boxElement.classList.add(currentPlayer === 0 ? 'box-p1' : 'box-p2');
        boxElement.textContent = currentPlayer === 0 ? 'P1' : 'P2';
      }
      updateUI();
      checkWin();
    } else {
      currentPlayer = currentPlayer === 0 ? 1 : 0;
      updateUI();
      checkWin();
      if (gameActive && currentPlayer === 1 && sizeSelect && sizeSelect.value === 'ai') {
        aiMove();
      }
    }
  }

  function checkCompletedBox(r, c, orientation) {
    var boxR = orientation === 'horizontal' ? r : r;
    var boxC = orientation === 'horizontal' ? c : c;

    if (boxR < 0 || boxR >= GRID_SIZE || boxC < 0 || boxC >= GRID_SIZE) return null;

    var box = boxes[boxR][boxC];
    if (box.owner !== null) return null;

    var topIdx = 'h-' + boxR + '-' + boxC;
    var rightIdx = 'v-' + boxR + '-' + (boxC + 1);
    var bottomIdx = 'h-' + (boxR + 1) + '-' + boxC;
    var leftIdx = 'v-' + boxR + '-' + boxC;

    if (document.getElementById(topIdx).classList.contains('drawn') &&
        document.getElementById(rightIdx).classList.contains('drawn') &&
        document.getElementById(bottomIdx).classList.contains('drawn') &&
        document.getElementById(leftIdx).classList.contains('drawn')) {
      return [boxR, boxC];
    }
    return null;
  }

  function updateUI() {
    if (!turnEl) return;
    turnEl.textContent = tr('dots_player') + ' ' + (currentPlayer + 1);
    if (p1ScoreEl) p1ScoreEl.textContent = scores[0];
    if (p2ScoreEl) p2ScoreEl.textContent = scores[1];
  }

  function checkWin() {
    var totalBoxes = GRID_SIZE * GRID_SIZE;
    var drawnLines = lines.length;
    var maxLines = 2 * GRID_SIZE * (GRID_SIZE + 1);

    if (drawnLines === maxLines || scores[0] + scores[1] === totalBoxes) {
      gameActive = false;
      var modalTitle = document.getElementById('modal-title');
      var messageEl = document.getElementById('modal-message');

      if (scores[0] > scores[1]) {
        modalTitle.textContent = tr('dots_player1') + ' ' + tr('dots_won_game');
        messageEl.textContent = tr('dots_wins');
      } else if (scores[1] > scores[0]) {
        modalTitle.textContent = tr('dots_player2') + ' ' + tr('dots_won_game');
        messageEl.textContent = tr('dots_wins');
      } else {
        modalTitle.textContent = tr('ties_all');
      }
      winnerModal.classList.add('visible');
    }
  }

  function aiMove() {
    aiThinking = true;
    updateUI();

    setTimeout(function() {
      var availableLines = [];
      for (var r = 0; r < BOARD_SIZE; r++) {
        for (var c = 0; c < GRID_SIZE; c++) {
          var hId = 'h-' + r + '-' + c;
          var hLine = document.getElementById(hId);
          if (hLine && !hLine.classList.contains('drawn')) {
            availableLines.push({ type: 'horizontal', r: r, c: c });
          }
        }
      }
      for (var r = 0; r < GRID_SIZE; r++) {
        for (var c = 0; c < BOARD_SIZE; c++) {
          var vId = 'v-' + r + '-' + c;
          var vLine = document.getElementById(vId);
          if (vLine && !vLine.classList.contains('drawn')) {
            availableLines.push({ type: 'vertical', r: r, c: c });
          }
        }
      }

      if (availableLines.length > 0) {
        var chosen = availableLines[Math.floor(Math.random() * availableLines.length)];
        handleLineClick(chosen.r, chosen.c, chosen.type);
      }
      aiThinking = false;
    }, 500);
  }

  function resizeBoard() {
    var size = parseInt(sizeSelect.value) || 5;
    GRID_SIZE = size;
    BOARD_SIZE = GRID_SIZE + 1;
    initBoard();
    renderBoard();
    showToast(tr('dots_grid_resized'));
  }

  function resetGame() {
    gridSize = parseInt(sizeSelect.value) || 5;
    initBoard();
    renderBoard();
    winnerModal.classList.remove('visible');
    showToast(tr('toast_restarted'));
  }

  function initGame() {
    initBoard();
    renderBoard();

    if (resetBtn) {
      resetBtn.addEventListener('click', resetGame);
    }

    if (sizeSelect) {
      sizeSelect.addEventListener('change', resizeBoard);
    }

    window.addEventListener('resize', function() {
      calculatePositions();
    });
  }

  window.initGame = initGame;
})();