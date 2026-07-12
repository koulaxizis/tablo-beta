// ============================================
// Tablo — Dots & Lines Game
// ============================================

(function() {
  'use strict';

  var DOT_SIZE = 8;
  var LINE_THICKNESS = 4;
  var PADDING = 40;
  var BOX_HEIGHT = 50;
  var BOX_WIDTH = 50;

  var gridSize = 5;
  var board = {};
  var currentPlayer = 1;
  var scores = [0, 0];
  var totalBoxes = 0;
  var gameActive = false;
  var lastBoxClosed = false;

  var svg = document.getElementById('game-svg');
  var currentPlayerEl = document.getElementById('current-player');
  var scoreP1El = document.getElementById('score-p1');
  var scoreP2El = document.getElementById('score-p2');
  var boxesTotalEl = document.getElementById('boxes-total');
  var gridSizeSelect = document.getElementById('grid-size');
  var resetBtn = document.getElementById('btn-reset');
  var winnerModal = document.getElementById('winner-modal');
  var winnerTitle = document.getElementById('winner-title');
  var winnerMessage = document.getElementById('winner-message');
  var winnerIcon = document.getElementById('winner-icon');
  var finalScoreP1El = document.getElementById('final-score-p1');
  var finalScoreP2El = document.getElementById('final-score-p2');
  var playAgainBtn = document.getElementById('btn-play-again');
  var toast = document.getElementById('toast');

  function tr(key) {
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
    return t ? (t[key] || key) : key;
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function() {
      toast.classList.remove('visible');
    }, 3000);
  }

  function calculateSVGSize(n) {
    return PADDING * 2 + n * BOX_WIDTH;
  }

  function getDotX(col) {
    return PADDING + col * BOX_WIDTH;
  }

  function getDotY(row) {
    return PADDING + row * BOX_HEIGHT;
  }

  function createBoard() {
    var n = gridSize;
    var svgSize = calculateSVGSize(n);
    
    // Clear and resize SVG
    svg.setAttribute('viewBox', '0 0 ' + svgSize + ' ' + svgSize);
    svg.innerHTML = '';

    board = { horizontal: [], vertical: [], boxes: [] };
    totalBoxes = n * n;

    // Initialize arrays
    for (var r = 0; r <= n; r++) {
      board.horizontal[r] = [];
      for (var c = 0; c < n; c++) {
        board.horizontal[r][c] = null;
      }
    }

    for (var c = 0; c <= n; c++) {
      board.vertical[c] = [];
      for (var r = 0; r < n; r++) {
        board.vertical[c][r] = null;
      }
    }

    for (var r = 0; r < n; r++) {
      board.boxes[r] = [];
      for (var c = 0; c < n; c++) {
        board.boxes[r][c] = null;
      }
    }

    renderBoard();
    attachClickHandlers();
    updateUI();
  }

  function attachClickHandlers() {
    var n = gridSize;
    var allSize = calculateSVGSize(n);
    var clickableArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    clickableArea.setAttribute('id', 'click-area');
    clickableArea.setAttribute('x', 0);
    clickableArea.setAttribute('y', 0);
    clickableArea.setAttribute('width', allSize);
    clickableArea.setAttribute('height', allSize);
    clickableArea.setAttribute('fill', 'transparent');
    clickableArea.style.pointerEvents = 'all';
    svg.insertBefore(clickableArea, svg.firstChild);
    
    clickableArea.addEventListener('click', function(e) {
      var pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      var ctm = svg.getScreenCTM().inverse();
      var svgPt = pt.matrixTransform(ctm);
      
      findNearestLine(svgPt.x, svgPt.y);
    });
  }

  function findNearestLine(x, y) {
    var n = gridSize;
    var clickedLine = null;
    var minDistance = 10;

    // Check horizontal lines
    for (var r = 0; r <= n; r++) {
      for (var c = 0; c < n; c++) {
        var lineY = getDotY(r);
        var lineXStart = getDotX(c) + DOT_SIZE;
        var lineXEnd = getDotX(c + 1) - DOT_SIZE;

        if (y >= lineY - LINE_THICKNESS && y <= lineY + LINE_THICKNESS) {
          if (x >= lineXStart - LINE_THICKNESS && x <= lineXEnd + LINE_THICKNESS) {
            var dist = Math.abs(y - lineY);
            if (dist < minDistance) {
              minDistance = dist;
              clickedLine = { type: 'h', row: r, col: c };
            }
          }
        }
      }
    }

    // Check vertical lines
    for (var c = 0; c <= n; c++) {
      for (var r = 0; r < n; r++) {
        var lineX = getDotX(c);
        var lineYStart = getDotY(r) + DOT_SIZE;
        var lineYEnd = getDotY(r + 1) - DOT_SIZE;

        if (x >= lineX - LINE_THICKNESS && x <= lineX + LINE_THICKNESS) {
          if (y >= lineYStart - LINE_THICKNESS && y <= lineYEnd + LINE_THICKNESS) {
            var dist = Math.abs(x - lineX);
            if (dist < minDistance) {
              minDistance = dist;
              clickedLine = { type: 'v', row: r, col: c };
            }
          }
        }
      }
    }

    if (clickedLine) {
      handleLineClick(clickedLine);
    }
  }

  function handleLineClick(lineInfo) {
    if (!gameActive) return;

    var type = lineInfo.type;
    var row = lineInfo.row;
    var col = lineInfo.col;

    if (type === 'h') {
      if (board.horizontal[row][col]) return;
      board.horizontal[row][col] = currentPlayer;
      markLineClaimed('h', row, col);
      checkAndAwardBox(row, col, true);
    } else {
      if (board.vertical[col][row]) return;
      board.vertical[col][row] = currentPlayer;
      markLineClaimed('v', col, row);
      checkAndAwardBox(row, col, false);
    }

    if (!lastBoxClosed && !isGameOver()) {
      switchPlayer();
    }
    lastBoxClosed = false;
    updateUI();
  }

  function markLineClaimed(type, rowOrCol1, rowOrCol2) {
    var rect = type === 'h' 
      ? getHLineRect(rowOrCol1, rowOrCol2)
      : getVLineRect(rowOrCol1, rowOrCol2);

    rect.style.fill = currentPlayer === 1 ? 'var(--color-p1)' : 'var(--color-p2)';
    rect.style.pointerEvents = 'none';
    rect.style.cursor = 'default';
  }

  function getHLineRect(row, col) {
    var n = gridSize;
    var g = document.getElementById('h-group-' + row + '-' + col);
    if (!g) {
      g = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      g.id = 'h-group-' + row + '-' + col;
      var x = getDotX(col) + DOT_SIZE;
      var y = getDotY(row) - LINE_THICKNESS / 2;
      g.setAttribute('x', x);
      g.setAttribute('y', y);
      g.setAttribute('width', BOX_WIDTH - DOT_SIZE * 2);
      g.setAttribute('height', LINE_THICKNESS);
      g.setAttribute('fill', 'var(--text-muted)');
      g.setAttribute('rx', LINE_THICKNESS / 2);
      svg.insertBefore(g, svg.getElementById('click-area'));
    }
    return g;
  }

  function getVLineRect(col, row) {
    var n = gridSize;
    var g = document.getElementById('v-group-' + col + '-' + row);
    if (!g) {
      g = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      g.id = 'v-group-' + col + '-' + row;
      var x = getDotX(col) - LINE_THICKNESS / 2;
      var y = getDotY(row) + DOT_SIZE;
      g.setAttribute('x', x);
      g.setAttribute('y', y);
      g.setAttribute('width', LINE_THICKNESS);
      g.setAttribute('height', BOX_HEIGHT - DOT_SIZE * 2);
      g.setAttribute('fill', 'var(--text-muted)');
      g.setAttribute('ry', LINE_THICKNESS / 2);
      svg.insertBefore(g, svg.getElementById('click-area'));
    }
    return g;
  }

  function checkAndAwardBox(row, col, isHorizontal) {
    var n = gridSize;
    var awarded = false;

    if (isHorizontal) {
      // Box above
      if (row > 0 && row <= n) {
        var boxRow = row - 1;
        var boxCol = col;
        if (canCompleteBox(boxRow, boxCol)) {
          awardBox(boxRow, boxCol);
          awarded = true;
        }
      }
      // Box below
      if (row < n) {
        var boxRow = row;
        var boxCol = col;
        if (canCompleteBox(boxRow, boxCol)) {
          awardBox(boxRow, boxCol);
          awarded = true;
        }
      }
    } else {
      // Box left
      if (col > 0 && col <= n) {
        var boxRow = row;
        var boxCol = col - 1;
        if (canCompleteBox(boxRow, boxCol)) {
          awardBox(boxRow, boxCol);
          awarded = true;
        }
      }
      // Box right
      if (col < n) {
        var boxRow = row;
        var boxCol = col;
        if (canCompleteBox(boxRow, boxCol)) {
          awardBox(boxRow, boxCol);
          awarded = true;
        }
      }
    }

    if (awarded) {
      lastBoxClosed = true;
    }
  }

  function canCompleteBox(br, bc) {
    if (board.boxes[br][bc]) return false;
    if (!board.horizontal[br][bc]) return false;
    if (!board.horizontal[br + 1][bc]) return false;
    if (!board.vertical[bc][br]) return false;
    if (!board.vertical[bc + 1][br]) return false;
    return true;
  }

  function awardBox(br, bc) {
    board.boxes[br][bc] = currentPlayer;
    scores[currentPlayer - 1]++;

    var text = document.getElementById('box-txt-' + br + '-' + bc);
    if (!text) {
      text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.id = 'box-txt-' + br + '-' + bc;
      text.setAttribute('x', getDotX(bc) + BOX_WIDTH / 2);
      text.setAttribute('y', getDotY(br) + BOX_HEIGHT / 2 + 4);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '16');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('font-family', 'Nunito');
      text.style.opacity = '0';
      svg.appendChild(text);
    }

    text.textContent = currentPlayer === 1 ? '⚫' : '◼';
    text.style.fill = currentPlayer === 1 ? 'var(--color-p1)' : 'var(--color-p2)';
    text.style.opacity = '1';

    if (isGameOver()) {
      endGame();
    }
  }

  function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateUI();
  }

  function isGameOver() {
    var n = gridSize;
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (!board.boxes[r][c]) return false;
      }
    }
    return true;
  }

  function updateUI() {
    currentPlayerEl.textContent = currentPlayer;
    scoreP1El.textContent = scores[0];
    scoreP2El.textContent = scores[1];

    var filled = 0;
    var n = gridSize;
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (board.boxes[r][c]) filled++;
      }
    }
    boxesTotalEl.textContent = filled + '/' + totalBoxes;

    var p2TurnMsg = currentPlayer === 2 ? ' - ' + tr('dots_your_turn') : '';
    currentPlayerEl.parentElement.querySelector('.stat-label').textContent =
      tr('dots_player') + p2TurnMsg;
  }

  function endGame() {
    gameActive = false;

    if (scores[0] > scores[1]) {
      winnerIcon.textContent = '🔵';
      winnerTitle.textContent = tr('dots_player1') + ' ' + tr('dots_wins');
      winnerMessage.textContent = tr('dots_player1') + ' ' + tr('dots_won_game');
      winnerTitle.style.color = 'var(--color-p1)';
    } else if (scores[1] > scores[0]) {
      winnerIcon.textContent = '🟡';
      var p2Name = tr('dots_player2');
      winnerTitle.textContent = p2Name + ' ' + tr('dots_wins');
      winnerMessage.textContent = p2Name + ' ' + tr('dots_won_game');
      winnerTitle.style.color = 'var(--color-p2)';
    } else {
      winnerIcon.textContent = '🤝';
      winnerTitle.textContent = tr('dots_draw');
      winnerMessage.textContent = tr('ties_all');
      winnerTitle.style.color = 'var(--text-secondary)';
    }

    finalScoreP1El.textContent = scores[0];
    finalScoreP2El.textContent = scores[1];
    winnerModal.classList.add('visible');
  }

  function resetGame() {
    gridSize = parseInt(gridSizeSelect.value) || 5;
    scores = [0, 0];
    currentPlayer = 1;
    gameActive = true;
    lastBoxClosed = false;
    board = {};
    createBoard();
    winnerModal.classList.remove('visible');
  }

  function initGame() {
    gridSizeSelect.value = '5';
    gridSize = 5;
    resetGame();

    gridSizeSelect.addEventListener('change', function() {
      resetGame();
      showToast(tr('dots_grid_resized'));
    });

    window.addEventListener('resize', function() {
      createBoard();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      resetGame();
      showToast(tr('toast_restarted'));
    });
  }

  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', function() {
      resetGame();
    });
  }

  window.initGame = initGame;

})();