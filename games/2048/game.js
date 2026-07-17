// ============================================
// Tablo — 2048
// ============================================

(function() {
  'use strict';

  var SIZE = 4;
  var grid = [];
  var score = 0;
  var bestScore = 0;
  var gameWon = false;
  var continueAfterWin = false;

  var tileContainer = document.getElementById('tile-container');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best-score');
  var newGameBtn = document.getElementById('btn-new-game');
  var retryBtn = document.getElementById('btn-retry');
  var gameOverModal = document.getElementById('game-over-modal');
  var gameOverIcon = document.getElementById('game-over-icon');
  var gameOverTitle = document.getElementById('game-over-title');
  var gameOverMessage = document.getElementById('game-over-message');
  var winnerButtons = document.getElementById('winner-buttons');
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
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function() {
      toast.classList.remove('visible');
    }, 2000);
  }

  function initGrid() {
    grid = [];
    for (var r = 0; r < SIZE; r++) {
      grid[r] = [];
      for (var c = 0; c < SIZE; c++) {
        grid[r][c] = 0;
      }
    }
  }

  function addRandomTile() {
    var empty = [];
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) empty.push({ r: r, c: c });
      }
    }
    if (empty.length === 0) return false;
    var spot = empty[Math.floor(Math.random() * empty.length)];
    grid[spot.r][spot.c] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  function render() {
    if (!tileContainer) return;
    tileContainer.innerHTML = '';
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (grid[r][c] !== 0) {
          var tile = document.createElement('div');
          tile.className = 'tile tile-' + grid[r][c];
          tile.style.top = (r * 25) + '%';
          tile.style.left = (c * 25) + '%';
          tile.textContent = grid[r][c];
          tileContainer.appendChild(tile);
        }
      }
    }
  }

  function slideRow(row) {
    var filtered = row.filter(function(v) { return v !== 0; });
    var merged = [];
    var gained = 0;
    var i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        merged.push(filtered[i] * 2);
        gained += filtered[i] * 2;
        if (filtered[i] * 2 === 2048 && !gameWon) {
          gameWon = true;
        }
        i += 2;
      } else {
        merged.push(filtered[i]);
        i++;
      }
    }
    while (merged.length < SIZE) merged.push(0);
    return { row: merged, gained: gained };
  }

  function arraysEqual(a, b) {
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function reverseRow(row) {
    return row.slice().reverse();
  }

  function rotateClockwise() {
    var newGrid = [];
    for (var r = 0; r < SIZE; r++) {
      newGrid[r] = [];
      for (var c = 0; c < SIZE; c++) {
        newGrid[r][c] = grid[SIZE - 1 - c][r];
      }
    }
    grid = newGrid;
  }

  function rotateCounterClockwise() {
    var newGrid = [];
    for (var r = 0; r < SIZE; r++) {
      newGrid[r] = [];
      for (var c = 0; c < SIZE; c++) {
        newGrid[r][c] = grid[c][SIZE - 1 - r];
      }
    }
    grid = newGrid;
  }

  function moveLeft() {
    var moved = false;
    var totalGained = 0;
    for (var r = 0; r < SIZE; r++) {
      var result = slideRow(grid[r]);
      if (!arraysEqual(grid[r], result.row)) moved = true;
      grid[r] = result.row;
      totalGained += result.gained;
    }
    return { moved: moved, gained: totalGained };
  }

  function move(direction) {
    var result;
    if (direction === 'left') {
      result = moveLeft();
    } else if (direction === 'right') {
      for (var r = 0; r < SIZE; r++) grid[r] = reverseRow(grid[r]);
      result = moveLeft();
      for (var r2 = 0; r2 < SIZE; r2++) grid[r2] = reverseRow(grid[r2]);
    } else if (direction === 'up') {
      rotateCounterClockwise();
      result = moveLeft();
      rotateClockwise();
    } else if (direction === 'down') {
      rotateCounterClockwise();
      for (var r = 0; r < SIZE; r++) grid[r] = reverseRow(grid[r]);
      result = moveLeft();
      for (var r2 = 0; r2 < SIZE; r2++) grid[r2] = reverseRow(grid[r2]);
      rotateClockwise();
    }

    if (result.moved) {
      score += result.gained;
      if (scoreEl) scoreEl.textContent = score;
      addRandomTile();
      render();

      if (score > bestScore) {
        bestScore = score;
        if (bestEl) bestEl.textContent = bestScore;
        localStorage.setItem('tablo-2048-best', bestScore.toString());
      }

      if (gameWon && !continueAfterWin) {
        showWinModal();
      } else if (isGameOver()) {
        showGameOver();
      }
    }
  }

  function isGameOver() {
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) return false;
        if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return false;
        if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return false;
      }
    }
    return true;
  }

  function showWinModal() {
    if (gameOverIcon) gameOverIcon.textContent = '\uD83C\uDF89';
    if (gameOverTitle) gameOverTitle.textContent = tr('game_2048_win');
    if (gameOverMessage) gameOverMessage.textContent = tr('game_2048_win_msg');

    if (winnerButtons) {
      winnerButtons.innerHTML = '';
      var continueBtn = document.createElement('button');
      continueBtn.className = 'game-btn';
      continueBtn.textContent = tr('game_2048_continue');
      continueBtn.onclick = function() {
        continueAfterWin = true;
        if (gameOverModal) gameOverModal.classList.remove('visible');
      };
      var playAgainBtn = document.createElement('button');
      playAgainBtn.className = 'game-btn primary';
      playAgainBtn.textContent = tr('btn_play_again');
      playAgainBtn.onclick = newGame;
      winnerButtons.appendChild(continueBtn);
      winnerButtons.appendChild(playAgainBtn);
    }

    if (gameOverModal) gameOverModal.classList.add('visible');
  }

  function showGameOver() {
    if (gameOverIcon) gameOverIcon.textContent = '\uD83D\uDE22';
    if (gameOverTitle) gameOverTitle.textContent = tr('game_2048_game_over');
    if (gameOverMessage) gameOverMessage.textContent = tr('game_2048_score') + ': ' + score;

    if (winnerButtons) {
      winnerButtons.innerHTML = '';
      var playAgainBtn = document.createElement('button');
      playAgainBtn.className = 'game-btn primary';
      playAgainBtn.textContent = tr('btn_play_again');
      playAgainBtn.onclick = newGame;
      winnerButtons.appendChild(playAgainBtn);
    }

    if (gameOverModal) gameOverModal.classList.add('visible');
  }

  function newGame() {
    initGrid();
    score = 0;
    gameWon = false;
    continueAfterWin = false;
    if (scoreEl) scoreEl.textContent = '0';
    if (gameOverModal) gameOverModal.classList.remove('visible');
    addRandomTile();
    addRandomTile();
    render();
  }

  function handleKey(e) {
    var key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') { move('left'); e.preventDefault(); }
    else if (key === 'arrowright' || key === 'd') { move('right'); e.preventDefault(); }
    else if (key === 'arrowup' || key === 'w') { move('up'); e.preventDefault(); }
    else if (key === 'arrowdown' || key === 's') { move('down'); e.preventDefault(); }
  }

  var touchStartX = 0, touchStartY = 0;
  function handleTouchStart(e) {
    var t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    e.preventDefault();
  }

  function handleTouchEnd(e) {
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStartX;
    var dy = t.clientY - touchStartY;
    var absX = Math.abs(dx);
    var absY = Math.abs(dy);
    if (absX < 30 && absY < 30) return;
    if (absX > absY) {
      move(dx > 0 ? 'right' : 'left');
    } else {
      move(dy > 0 ? 'down' : 'up');
    }
    e.preventDefault();
  }

  function initGame() {
    var saved = localStorage.getItem('tablo-2048-best');
    if (saved) {
      bestScore = parseInt(saved) || 0;
      if (bestEl) bestEl.textContent = bestScore;
    }

    document.addEventListener('keydown', handleKey);

    var gridContainer = document.getElementById('grid-container');
    if (gridContainer) {
      gridContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
      gridContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    if (newGameBtn) {
      newGameBtn.addEventListener('click', function() {
        newGame();
        showToast('toast_restarted');
      });
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', newGame);
    }

    newGame();
  }

  window.initGame = initGame;
})();