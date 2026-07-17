// ============================================
// Tablo — Dots & Lines
// ============================================

(function() {
  'use strict';

  var SVG_SIZE = 320;
  var GRID_SIZE = 5;
  var BOARD_SIZE = GRID_SIZE + 1;
  var dots = [];
  var lines = [];
  var boxes = [];
  var currentPlayer = 0;
  var scores = [0, 0];
  var gameActive = false;
  var aiThinking = false;

  var svgEl = document.getElementById('game-svg');
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
    var padding = 30;
    var usable = SVG_SIZE - padding * 2;
    var spacing = usable / GRID_SIZE;

    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        dots[r][c].x = padding + c * spacing;
        dots[r][c].y = padding + r * spacing;
      }
    }
  }

  function createSvg(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  function renderBoard() {
    if (!svgEl) return;
    svgEl.innerHTML = '';
    calculatePositions();

    // Render boxes (behind everything)
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        var rect = createSvg('rect');
        rect.setAttribute('id', 'box-' + r + '-' + c);
        rect.setAttribute('x', dots[r][c].x);
        rect.setAttribute('y', dots[r][c].y);
        rect.setAttribute('width', dots[r][c+1].x - dots[r][c].x);
        rect.setAttribute('height', dots[r+1][c].y - dots[r][c].y);
        rect.setAttribute('fill', 'transparent');
        rect.setAttribute('class', 'box');
        svgEl.appendChild(rect);

        var text = createSvg('text');
        text.setAttribute('x', (dots[r][c].x + dots[r][c+1].x) / 2);
        text.setAttribute('y', (dots[r][c].y + dots[r+1][c].y) / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('class', 'box-label');
        text.setAttribute('id', 'box-label-' + r + '-' + c);
        text.style.opacity = '0';
        svgEl.appendChild(text);
      }
    }

    // Render horizontal lines (clickable hit areas + visual lines)
    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        var lineId = 'h-' + r + '-' + c;
        var x1 = dots[r][c].x;
        var y1 = dots[r][c].y;
        var x2 = dots[r][c+1].x;
        var y2 = dots[r][c+1].y;

        // Invisible thick hit area
        var hit = createSvg('line');
        hit.setAttribute('x1', x1);
        hit.setAttribute('y1', y1);
        hit.setAttribute('x2', x2);
        hit.setAttribute('y2', y2);
        hit.setAttribute('stroke', 'transparent');
        hit.setAttribute('stroke-width', 16);
        hit.setAttribute('stroke-linecap', 'round');
        hit.setAttribute('cursor', 'pointer');
        hit.setAttribute('data-type', 'horizontal');
        hit.setAttribute('data-r', r);
        hit.setAttribute('data-c', c);
        hit.addEventListener('click', function(e) {
          handleLineClick(parseInt(e.currentTarget.dataset.r), parseInt(e.currentTarget.dataset.c), 'horizontal');
          e.stopPropagation();
        });
        svgEl.appendChild(hit);

        // Visible line
        var vis = createSvg('line');
        vis.setAttribute('id', lineId);
        vis.setAttribute('x1', x1);
        vis.setAttribute('y1', y1);
        vis.setAttribute('x2', x2);
        vis.setAttribute('y2', y2);
        vis.setAttribute('stroke', 'rgba(90, 110, 124, 0.3)');
        vis.setAttribute('stroke-width', 4);
        vis.setAttribute('stroke-linecap', 'round');
        vis.setAttribute('pointer-events', 'none');
        svgEl.appendChild(vis);
      }
    }

    // Render vertical lines
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        var lineId = 'v-' + r + '-' + c;
        var x1 = dots[r][c].x;
        var y1 = dots[r][c].y;
        var x2 = dots[r+1][c].x;
        var y2 = dots[r+1][c].y;

        var hit = createSvg('line');
        hit.setAttribute('x1', x1);
        hit.setAttribute('y1', y1);
        hit.setAttribute('x2', x2);
        hit.setAttribute('y2', y2);
        hit.setAttribute('stroke', 'transparent');
        hit.setAttribute('stroke-width', 16);
        hit.setAttribute('stroke-linecap', 'round');
        hit.setAttribute('cursor', 'pointer');
        hit.setAttribute('data-type', 'vertical');
        hit.setAttribute('data-r', r);
        hit.setAttribute('data-c', c);
        hit.addEventListener('click', function(e) {
          handleLineClick(parseInt(e.currentTarget.dataset.r), parseInt(e.currentTarget.dataset.c), 'vertical');
          e.stopPropagation();
        });
        svgEl.appendChild(hit);

        var vis = createSvg('line');
        vis.setAttribute('id', lineId);
        vis.setAttribute('x1', x1);
        vis.setAttribute('y1', y1);
        vis.setAttribute('x2', x2);
        vis.setAttribute('y2', y2);
        vis.setAttribute('stroke', 'rgba(90, 110, 124, 0.3)');
        vis.setAttribute('stroke-width', 4);
        vis.setAttribute('stroke-linecap', 'round');
        vis.setAttribute('pointer-events', 'none');
        svgEl.appendChild(vis);
      }
    }

    // Render dots (on top)
    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        var dot = createSvg('circle');
        dot.setAttribute('cx', dots[r][c].x);
        dot.setAttribute('cy', dots[r][c].y);
        dot.setAttribute('r', 6);
        dot.setAttribute('fill', '#2dd4bf');
        dot.setAttribute('pointer-events', 'none');
        svgEl.appendChild(dot);
      }
    }

    updateUI();
  }

  function handleLineClick(r, c, orientation) {
    if (!gameActive || aiThinking) return;

    var lineId = orientation === 'horizontal' ? 'h-' + r + '-' + c : 'v-' + r + '-' + c;
    var lineElement = document.getElementById(lineId);
    if (!lineElement) return;
    if (lineElement.getAttribute('data-drawn') === 'true') return;

    lineElement.setAttribute('data-drawn', 'true');
    lineElement.setAttribute('stroke', currentPlayer === 0 ? '#ff6b6b' : '#ffd93d');
    lineElement.setAttribute('stroke-width', 5);

    lines.push({ r: r, c: c, orientation: orientation, player: currentPlayer });

    // Check ALL adjacent boxes
    var completedBoxes = checkCompletedBoxes(r, c, orientation);
    if (completedBoxes.length > 0) {
      for (var i = 0; i < completedBoxes.length; i++) {
        var boxR = completedBoxes[i][0];
        var boxC = completedBoxes[i][1];
        scores[currentPlayer]++;
        boxes[boxR][boxC].owner = currentPlayer;

        var boxRect = document.getElementById('box-' + boxR + '-' + boxC);
        if (boxRect) {
          boxRect.setAttribute('fill', currentPlayer === 0 ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 217, 61, 0.2)');
        }
        var boxLabel = document.getElementById('box-label-' + boxR + '-' + boxC);
        if (boxLabel) {
          boxLabel.textContent = currentPlayer === 0 ? 'P1' : 'P2';
          boxLabel.setAttribute('fill', currentPlayer === 0 ? '#ff6b6b' : '#ffd93d');
          boxLabel.style.opacity = '1';
        }
      }
      updateUI();
      checkWin();
      // Player goes again — no switch
      if (gameActive && currentPlayer === 1 && sizeSelect && sizeSelect.value === 'ai') {
        setTimeout(aiMove, 600);
      }
    } else {
      currentPlayer = currentPlayer === 0 ? 1 : 0;
      updateUI();
      checkWin();
      if (gameActive && currentPlayer === 1 && sizeSelect && sizeSelect.value === 'ai') {
        setTimeout(aiMove, 600);
      }
    }
  }

  function isLineDrawn(id) {
    var el = document.getElementById(id);
    return el && el.getAttribute('data-drawn') === 'true';
  }

  function checkCompletedBoxes(r, c, orientation) {
    var completed = [];

    if (orientation === 'horizontal') {
      // Box above (r-1, c) — exists if r > 0
      if (r > 0) {
        var topId = 'h-' + (r-1) + '-' + c;
        var leftId = 'v-' + (r-1) + '-' + c;
        var rightId = 'v-' + (r-1) + '-' + (c+1);
        var bottomId = 'h-' + r + '-' + c;
        if (isLineDrawn(topId) && isLineDrawn(leftId) && isLineDrawn(rightId) && isLineDrawn(bottomId)) {
          if (boxes[r-1][c].owner === null) completed.push([r-1, c]);
        }
      }
      // Box below (r, c) — exists if r < GRID_SIZE
      if (r < GRID_SIZE) {
        var topId2 = 'h-' + r + '-' + c;
        var leftId2 = 'v-' + r + '-' + c;
        var rightId2 = 'v-' + r + '-' + (c+1);
        var bottomId2 = 'h-' + (r+1) + '-' + c;
        if (isLineDrawn(topId2) && isLineDrawn(leftId2) && isLineDrawn(rightId2) && isLineDrawn(bottomId2)) {
          if (boxes[r][c].owner === null) completed.push([r, c]);
        }
      }
    } else {
      // Box to the left (r, c-1) — exists if c > 0
      if (c > 0) {
        var topId = 'h-' + r + '-' + (c-1);
        var bottomId = 'h-' + (r+1) + '-' + (c-1);
        var leftId = 'v-' + r + '-' + (c-1);
        var rightId = 'v-' + r + '-' + c;
        if (isLineDrawn(topId) && isLineDrawn(bottomId) && isLineDrawn(leftId) && isLineDrawn(rightId)) {
          if (boxes[r][c-1].owner === null) completed.push([r, c-1]);
        }
      }
      // Box to the right (r, c) — exists if c < GRID_SIZE
      if (c < GRID_SIZE) {
        var topId2 = 'h-' + r + '-' + c;
        var bottomId2 = 'h-' + (r+1) + '-' + c;
        var leftId2 = 'v-' + r + '-' + c;
        var rightId2 = 'v-' + r + '-' + (c+1);
        if (isLineDrawn(topId2) && isLineDrawn(bottomId2) && isLineDrawn(leftId2) && isLineDrawn(rightId2)) {
          if (boxes[r][c].owner === null) completed.push([r, c]);
        }
      }
    }

    return completed;
  }

  function updateUI() {
    if (turnEl) {
      var label = currentPlayer === 0 ? tr('dots_player1') : tr('dots_player2');
      turnEl.textContent = label;
      turnEl.style.color = currentPlayer === 0 ? 'var(--color-p1)' : 'var(--color-p2)';
    }
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

      var fp1 = document.getElementById('final-score-p1');
      var fp2 = document.getElementById('final-score-p2');
      if (fp1) fp1.textContent = scores[0];
      if (fp2) fp2.textContent = scores[1];
      winnerModal.classList.add('visible');
    }
  }

  function aiMove() {
    aiThinking = true;
    updateUI();

    setTimeout(function() {
      var availableLines = [];
      var hits = svgEl.querySelectorAll('[data-type]');
      for (var i = 0; i < hits.length; i++) {
        var line = hits[i];
        if (!line.getAttribute('data-drawn')) {
          availableLines.push({
            type: line.getAttribute('data-type'),
            r: parseInt(line.getAttribute('data-r')),
            c: parseInt(line.getAttribute('data-c'))
          });
        }
      }

      if (availableLines.length > 0) {
        var chosen = availableLines[Math.floor(Math.random() * availableLines.length)];
        aiThinking = false;
        handleLineClick(chosen.r, chosen.c, chosen.type);
      } else {
        aiThinking = false;
      }
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
  }

  window.initGame = initGame;
})();