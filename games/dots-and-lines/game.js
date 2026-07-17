// ============================================
// Tablo — Dots & Lines
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

  var dotsEl = document.getElementById('game-svg');
  var turnEl = document.getElementById('turn-display');
  var p1ScoreEl = document.getElementById('score-p1');
  var p2ScoreEl = document.getElementById('score-p2');
  var sizeSelect = document.getElementById('grid-size');
  var resetBtn = document.getElementById('btn-reset');
  var winnerModal = document.getElementById('winner-modal');
  var toast = document.getElementById('toast');

  function tr(key) {
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
    return t ? (t[key] || key) : key;
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = tr(msg);
    toast.classList.add('visible');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function() {
      toast.classList.remove('visible');
    }, 2500);
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
    var width = dotsEl.clientWidth || dotsEl.offsetWidth;
    var height = dotsEl.clientHeight || dotsEl.offsetHeight;
    var dotSpacing = Math.min(width, height) / (GRID_SIZE + 1) * 0.85;
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

    var dotRadius = 12;

    // Render dots
    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', dots[r][c].x);
        dot.setAttribute('cy', dots[r][c].y);
        dot.setAttribute('r', dotRadius);
        dot.setAttribute('fill', '#2dd4bf');
        dot.setAttribute('class', 'dot');

        var clickGroup = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        clickGroup.setAttribute('cx', dots[r][c].x);
        clickGroup.setAttribute('cy', dots[r][c].y);
        clickGroup.setAttribute('r', dotRadius * 2);
        clickGroup.setAttribute('fill', 'transparent');
        clickGroup.style.cursor = 'pointer';

        clickGroup.addEventListener('click', function(e) {
          e.stopPropagation();
        });

        dotsEl.appendChild(clickGroup);
        dotsEl.appendChild(dot);
      }
    }

    // Render horizontal lines
    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        var lineId = 'h-' + r + '-' + c;
        var hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hLine.setAttribute('id', lineId);
        hLine.setAttribute('x1', dots[r][c].x);
        hLine.setAttribute('y1', dots[r][c].y);
        hLine.setAttribute('x2', dots[r][c+1].x);
        hLine.setAttribute('y2', dots[r][c+1].y);
        hLine.setAttribute('stroke-width', 4);
        hLine.setAttribute('stroke-linecap', 'round');
        hLine.setAttribute('data-type', 'horizontal');
        hLine.setAttribute('data-r', r);
        hLine.setAttribute('data-c', c);

        hLine.addEventListener('click', function(e) {
          handleLineClick(parseInt(e.currentTarget.dataset.r), parseInt(e.currentTarget.dataset.c), 'horizontal');
          e.stopPropagation();
        });

        dotsEl.appendChild(hLine);
      }
    }

    // Render vertical lines
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        var lineId = 'v-' + r + '-' + c;
        var vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('id', lineId);
        vLine.setAttribute('x1', dots[r][c].x);
        vLine.setAttribute('y1', dots[r][c].y);
        vLine.setAttribute('x2', dots[r+1][c].x);
        vLine.setAttribute('y2', dots[r+1][c].y);
        vLine.setAttribute('stroke-width', 4);
        vLine.setAttribute('stroke-linecap', 'round');
        vLine.setAttribute('data-type', 'vertical');
        vLine.setAttribute('data-r', r);
        vLine.setAttribute('data-c', c);

        vLine.addEventListener('click', function(e) {
          handleLineClick(parseInt(e.currentTarget.dataset.r), parseInt(e.currentTarget.dataset.c), 'vertical');
          e.stopPropagation();
        });

        dotsEl.appendChild(vLine);
      }
    }

    updateUI();
  }

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
      updateUI();
      checkWin();
    } else {
      currentPlayer = currentPlayer === 0 ? 1 : 0;
      updateUI();
      checkWin();
      if (gameActive && currentPlayer === 1 && sizeSelect && sizeSelect.value === 'ai') {
        setTimeout(aiMove, 500);
      }
    }
  }

  function checkCompletedBox(r, c, orientation) {
    var boxR, boxC;
    if (orientation === 'horizontal') {
      boxR = r;
      boxC = c;
    } else {
      boxR = r;
      boxC = c;
    }

    if (boxR < 0 || boxR >= GRID_SIZE || boxC < 0 || boxC >= GRID_SIZE) return null;
    if (boxes[boxR][boxC].owner !== null) return null;

    var topId = 'h-' + boxR + '-' + boxC;
    var rightId = 'v-' + boxR + '-' + (boxC + 1);
    var bottomId = 'h-' + (boxR + 1) + '-' + boxC;
    var leftId = 'v-' + boxR + '-' + boxC;

    var top = document.getElementById(topId);
    var right = document.getElementById(rightId);
    var bottom = document.getElementById(bottomId);
    var left = document.getElementById(leftId);

    if (top && right && bottom && left &&
        top.classList.contains('drawn') &&
        right.classList.contains('drawn') &&
        bottom.classList.contains('drawn') &&
        left.classList.contains('drawn')) {
      return [boxR, boxC];
    }
    return null;
  }

  function updateUI() {
    if (turnEl) turnEl.textContent = tr('dots_player') + ' ' + (currentPlayer + 1);
    if (p1ScoreEl) p1ScoreEl.textContent = scores[0];
    if (p2ScoreEl) p2ScoreEl.textContent = scores[1];
  }

  function checkWin() {
    var totalBoxes = GRID_SIZE * GRID_SIZE;
    if (scores[0] + scores[1] === totalBoxes) {
      gameActive = false;
      var modalTitle = document.getElementById('winner-title');
      var messageEl = document.getElementById('winner-message');

      if (scores[0] > scores[1]) {
        modalTitle.textContent = tr('dots_player1') + ' ' + tr('dots_won_game');
        messageEl.textContent = tr('dots_wins');
      } else if (scores[1] > scores[0]) {
        modalTitle.textContent = tr('dots_player2') + ' ' + tr('dots_won_game');
        messageEl.textContent = tr('dots_wins');
      } else {
        modalTitle.textContent = tr('ties_all');
        messageEl.textContent = tr('dots_draw');
      }

      document.getElementById('final-score-p1').textContent = scores[0];
      document.getElementById('final-score-p2').textContent = scores[1];
      winnerModal.classList.add('visible');
    }
  }

  function aiMove() {
    aiThinking = true;
    updateUI();

    setTimeout(function() {
      var availableLines = [];
      var lines = dotsEl.querySelectorAll('[data-type]');
      lines.forEach(function(line) {
        if (!line.classList.contains('drawn')) {
          availableLines.push({
            type: line.dataset.type,
            r: parseInt(line.dataset.r),
            c: parseInt(line.dataset.c)
          });
        }
      });

      if (availableLines.length > 0) {
        var chosen = availableLines[Math.floor(Math.random() * availableLines.length)];
        handleLineClick(chosen.r, chosen.c, chosen.type);
      }
      aiThinking = false;
    }, 600);
  }

  function resizeBoard() {
    var size = parseInt(sizeSelect.value) || 5;
    GRID_SIZE = size;
    BOARD_SIZE = GRID_SIZE + 1;
    initBoard();
    renderBoard();
    showToast('dots_grid_resized');
  }

  function resetGame() {
    initBoard();
    renderBoard();
    winnerModal.classList.remove('visible');
    showToast('toast_restarted');
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
      renderBoard();
    });
  }

  window.initGame = initGame;
})();