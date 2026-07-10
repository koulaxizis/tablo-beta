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
  var board = [];
  var currentPlayer = 1;
  var scores = [0, 0];
  var totalBoxes = 0;
  var gameActive = false;
  var lastBoxClosed = null;

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
    var size = PADDING * 2 + n * BOX_WIDTH;
    return size;
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
    svg.setAttribute('viewBox', '0 0 ' + svgSize + ' ' + svgSize);
    svg.innerHTML = '';

    board = {
      horizontal: [],
      vertical: [],
      boxes: []
    };

    totalBoxes = n * n;
    var hLines = n + 1;
    var vLines = n + 1;

    for (var r = 0; r < hLines; r++) {
      board.horizontal[r] = [];
      for (var c = 0; c < n; c++) {
        board.horizontal[r][c] = null;
      }
    }

    for (var c = 0; c < vLines; c++) {
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
    updateUI();
  }

  function renderBoard() {
    var n = gridSize;
    svg.innerHTML = '';

    for (var r = 0; r <= n; r++) {
      for (var c = 0; c <= n; c++) {
        var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', getDotX(c));
        dot.setAttribute('cy', getDotY(r));
        dot.setAttribute('r', DOT_SIZE);
        dot.setAttribute('fill', 'var(--text-primary)');
        svg.appendChild(dot);
      }
    }

    for (var r = 0; r <= n; r++) {
      for (var c = 0; c < n; c++) {
        var lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        lineGroup.classList.add('line-group', 'horizontal-line');
        lineGroup.dataset.type = 'h';
        lineGroup.dataset.row = r;
        lineGroup.dataset.col = c;

        var line = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        var x = getDotX(c) - LINE_THICKNESS / 2 + DOT_SIZE;
        var y = getDotY(r) - LINE_THICKNESS / 2;
        line.setAttribute('x', x);
        line.setAttribute('y', y);
        line.setAttribute('width', BOX_WIDTH - DOT_SIZE * 2 + LINE_THICKNESS);
        line.setAttribute('height', LINE_THICKNESS);
        line.setAttribute('rx', LINE_THICKNESS / 2);
        line.setAttribute('class', 'line-h');
        line.id = 'h-' + r + '-' + c;
        lineGroup.appendChild(line);

        line.addEventListener('click', handleLineClick);
        lineGroup.appendChild(line);
        svg.appendChild(lineGroup);
      }
    }

    for (var c = 0; c <= n; c++) {
      for (var r = 0; r < n; r++) {
        var vGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        vGroup.classList.add('line-group', 'vertical-line');
        vGroup.dataset.type = 'v';
        vGroup.dataset.col = c;
        vGroup.dataset.row = r;

        var vLine = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        var vx = getDotX(c) - LINE_THICKNESS / 2;
        var vy = getDotY(r) - LINE_THICKNESS / 2 + DOT_SIZE;
        vLine.setAttribute('x', vx);
        vLine.setAttribute('y', vy);
        vLine.setAttribute('width', LINE_THICKNESS);
        vLine.setAttribute('height', BOX_HEIGHT - DOT_SIZE * 2 + LINE_THICKNESS);
        vLine.setAttribute('ry', LINE_THICKNESS / 2);
        vLine.setAttribute('class', 'line-v');
        vLine.id = 'v-' + c + '-' + r;
        vGroup.appendChild(vLine);

        vLine.addEventListener('click', handleLineClick);
        vGroup.appendChild(vLine);
        svg.appendChild(vGroup);
      }
    }

    for (var br = 0; br < n; br++) {
      for (var bc = 0; bc < n; bc++) {
        var box = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        box.setAttribute('x', getDotX(bc) + BOX_WIDTH / 2);
        box.setAttribute('y', getDotY(br) + BOX_HEIGHT / 2 + 4);
        box.setAttribute('text-anchor', 'middle');
        box.setAttribute('class', 'box-number');
        box.setAttribute('id', 'box-' + br + '-' + bc);
        box.style.opacity = '0';
        svg.appendChild(box);
      }
    }
  }

  function handleLineClick(e) {
    if (!gameActive) return;

    var group = e.currentTarget.closest('.line-group');
    if (!group || group.classList.contains('claimed')) return;

    var type = group.dataset.type;
    var row = parseInt(group.dataset.row);
    var col = parseInt(group.dataset.col);

    if (type === 'h') {
      board.horizontal[row][col] = currentPlayer;
      group.querySelector('.line-h').setAttribute('fill', currentPlayer === 1 ? 'var(--color-p1)' : 'var(--color-p2)');
      group.classList.add('claimed');
      checkAndAwardBox(row, col, true);
    } else {
      board.vertical[col][row] = currentPlayer;
      group.querySelector('.line-v').setAttribute('fill', currentPlayer === 1 ? 'var(--color-p1)' : 'var(--color-p2)');
      group.classList.add('claimed');
      checkAndAwardBox(row, col, false);
    }

    if (!lastBoxClosed && !isGameOver()) {
      switchPlayer();
    }
    lastBoxClosed = false;
    updateUI();
  }

  function checkAndAwardBox(row, col, isHorizontal) {
    var n = gridSize;
    var awarded = false;

    if (isHorizontal) {
      var boxRow = row;
      var boxCol = col;
      var hTop = board.horizontal[boxRow] && board.horizontal[boxRow][boxCol] !== null;
      var hBottom = board.horizontal[boxRow + 1] && board.horizontal[boxRow + 1][boxCol] !== null;
      var vLeft = board.vertical[boxCol] && board.vertical[boxCol][boxRow] !== null;
      var vRight = board.vertical[boxCol + 1] && board.vertical[boxCol + 1][boxRow] !== null;

      if (hTop && hBottom && vLeft && vRight && !board.boxes[boxRow][boxCol]) {
        awardBox(boxRow, boxCol);
        awarded = true;
      }

      boxRow = row - 1;
      boxCol = col;
      hTop = board.horizontal[boxRow + 1] && board.horizontal[boxRow + 1][boxCol] !== null;
      hBottom = board.horizontal[boxRow] && board.horizontal[boxRow][boxCol] !== null;
      vLeft = board.vertical[boxCol] && board.vertical[boxCol][boxRow] !== null;
      vRight = board.vertical[boxCol + 1] && board.vertical[boxCol + 1][boxRow] !== null;

      if (boxRow >= 0 && hTop && hBottom && vLeft && vRight && !board.boxes[boxRow][boxCol]) {
        awardBox(boxRow, boxCol);
        awarded = true;
      }
    } else {
      var boxRow = row;
      var boxCol = col;
      var hTop = board.horizontal[boxRow] && board.horizontal[boxRow][boxCol] !== null;
      var hBottom = board.horizontal[boxRow + 1] && board.horizontal[boxRow + 1][boxCol] !== null;
      var vLeft = board.vertical[boxCol] && board.vertical[boxCol][boxRow] !== null;
      var vRight = board.vertical[boxCol + 1] && board.vertical[boxCol + 1][boxRow] !== null;

      if (hTop && hBottom && vLeft && vRight && !board.boxes[boxRow][boxCol]) {
        awardBox(boxRow, boxCol);
        awarded = true;
      }

      boxRow = row;
      boxCol = col - 1;
      hTop = board.horizontal[boxRow] && board.horizontal[boxRow][boxCol] !== null;
      hBottom = board.horizontal[boxRow + 1] && board.horizontal[boxRow + 1][boxCol] !== null;
      vLeft = board.vertical[boxCol] && board.vertical[boxCol][boxRow] !== null;
      vRight = board.vertical[boxCol + 1] && board.vertical[boxCol + 1][boxRow] !== null;

      if (boxCol >= 0 && hTop && hBottom && vLeft && vRight && !board.boxes[boxRow][boxCol]) {
        awardBox(boxRow, boxCol);
        awarded = true;
      }
    }

    if (awarded) {
      lastBoxClosed = true;
    }
  }

  function awardBox(boxRow, boxCol) {
    board.boxes[boxRow][boxCol] = currentPlayer;
    var boxEl = document.getElementById('box-' + boxRow + '-' + boxCol);
    if (boxEl) {
      boxEl.textContent = currentPlayer === 1 ? '⚫' : '◼';
      boxEl.style.fill = currentPlayer === 1 ? 'var(--color-p1)' : 'var(--color-p2)';
      boxEl.style.opacity = '1';
      boxEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }

    scores[currentPlayer - 1]++;

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
    var remaining = 0;
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (!board.boxes[r][c]) remaining++;
      }
    }
    return remaining === 0;
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

    var p2Label = currentPlayer === 2 ? ' - ' + tr('dots_your_turn') : '';
    currentPlayerEl.parentElement.querySelector('.stat-label').textContent = 
      tr('dots_player') + (currentPlayer === 1 ? '' : p2Label);
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
      renderBoard();
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