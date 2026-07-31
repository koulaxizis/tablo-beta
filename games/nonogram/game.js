// ============================================
// Tablo — Nonogram (Picross)
// ============================================

(function() {
  'use strict';

  console.log('[Nonogram] game.js loaded');

  var gridSize = 10;
  var solution = [];
  var playerGrid = [];
  var rowClues = [];
  var colClues = [];
  var mistakes = 0;
  var gameActive = false;
  var timerInterval = null;
  var seconds = 0;
  var hintsUsed = 0;

  var containerEl, timeEl, mistakesEl, sizeSelect, hintsEl;
  var newGameBtn, checkBtn, clearBtn, hintBtn;
  var winnerModal, winnerIcon, winnerTitle, winnerMessage, playAgainBtn, newDifficultyBtn;
  var toast, settingsBtn;

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

  function getCellSize() {
    return window.innerWidth <= 600 ? 28 : 35;
  }

  function getClueColHeight() {
    return window.innerWidth <= 600 ? 40 : 50;
  }

  function getClueRowWidth() {
    return window.innerWidth <= 600 ? 45 : 60;
  }

  function generateSolution(size) {
    var sol = [];
    var density = 0.45;

    for (var i = 0; i < size; i++) {
      sol[i] = [];
      for (var j = 0; j < size; j++) {
        sol[i][j] = Math.random() < density ? 1 : 0;
      }
    }

    for (var i = 0; i < size; i++) {
      var rowHas = sol[i].some(function(v) { return v === 1; });
      if (!rowHas) sol[i][Math.floor(Math.random() * size)] = 1;
      var colHas = false;
      for (var r = 0; r < size; r++) { if (sol[r][i] === 1) { colHas = true; break; } }
      if (!colHas) sol[Math.floor(Math.random() * size)][i] = 1;
    }

    return sol;
  }

  function calculateClues(grid, size, isRow) {
    var clues = [];
    for (var i = 0; i < size; i++) {
      var clueGroups = [];
      var currentRun = 0;
      for (var j = 0; j < size; j++) {
        var val = isRow ? grid[i][j] : grid[j][i];
        if (val === 1) {
          currentRun++;
        } else if (currentRun > 0) {
          clueGroups.push(currentRun);
          currentRun = 0;
        }
      }
      if (currentRun > 0) clueGroups.push(currentRun);
      clues[i] = clueGroups.length > 0 ? clueGroups : [0];
    }
    return clues;
  }

  // Fixed: Join clues with comma for readability
  function formatClue(clueArray) {
    return clueArray.join(', ');
  }

  function initGame() {
    console.log('[Nonogram] initGame() called');

    containerEl = document.getElementById('nonogram-container');
    timeEl = document.getElementById('time');
    mistakesEl = document.getElementById('mistakes');
    hintsEl = document.getElementById('hints');
    sizeSelect = document.getElementById('size-select');
    newGameBtn = document.getElementById('btn-new-game');
    checkBtn = document.getElementById('btn-check');
    clearBtn = document.getElementById('btn-clear');
    hintBtn = document.getElementById('btn-hint');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    playAgainBtn = document.getElementById('btn-play-again');
    newDifficultyBtn = document.getElementById('btn-new-difficulty');
    toast = document.getElementById('toast');
    settingsBtn = document.querySelector('#tablo-header button[id$="settings"]');

    startTimer();
    startNewGame();

    if (sizeSelect) sizeSelect.addEventListener('change', function(e) {
      gridSize = parseInt(e.target.value);
      startNewGame();
    });

    if (newGameBtn) newGameBtn.addEventListener('click', startNewGame);
    if (checkBtn) checkBtn.addEventListener('click', checkPuzzle);
    if (clearBtn) clearBtn.addEventListener('click', clearGrid);
    if (hintBtn) hintBtn.addEventListener('click', useHint);
    if (playAgainBtn) playAgainBtn.addEventListener('click', closeWinnerAndNewGame);
    if (newDifficultyBtn) newDifficultyBtn.addEventListener('click', closeWinnerAndNewGame);

    document.addEventListener('contextmenu', function(e) {
      if (e.target.classList.contains('cell')) {
        e.preventDefault();
        handleCellRightClick(e.target);
      }
    });

    console.log('[Nonogram] Init complete');
  }

  function startNewGame() {
    solution = generateSolution(gridSize);
    rowClues = calculateClues(solution, gridSize, true);
    colClues = calculateClues(solution, gridSize, false);

    playerGrid = [];
    for (var i = 0; i < gridSize; i++) {
      playerGrid[i] = [];
      for (var j = 0; j < gridSize; j++) {
        playerGrid[i][j] = 0;
      }
    }

    mistakes = 0;
    hintsUsed = 0;
    seconds = 0;
    gameActive = true;
    resetTimer();
    renderBoard();
    updateStats();
  }

  function closeWinnerAndNewGame() {
    if (winnerModal) winnerModal.classList.remove('visible');
    startNewGame();
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(function() {
      if (gameActive) {
        seconds++;
        updateTimerDisplay();
      }
    }, 1000);
  }

  function resetTimer() {
    seconds = 0;
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    if (timeEl) {
      timeEl.textContent = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    }
  }

  function updateStats() {
    if (mistakesEl) mistakesEl.textContent = mistakes;
    if (hintsEl) hintsEl.textContent = hintsUsed;
  }

  function useHint() {
    if (!gameActive) return;

    // Find first empty cell that should be filled
    for (var i = 0; i < gridSize; i++) {
      for (var j = 0; j < gridSize; j++) {
        if (playerGrid[i][j] === 0 && solution[i][j] === 1) {
          playerGrid[i][j] = 1;
          hintsUsed++;
          updateStats();
          updateCells();
          showToast(tr('nonogram_hint_used'), false);
          return;
        }
      }
    }
    
    // If no empty cells to fill, find wrong X mark
    for (var i = 0; i < gridSize; i++) {
      for (var j = 0; j < gridSize; j++) {
        if (playerGrid[i][j] === 2 && solution[i][j] === 1) {
          playerGrid[i][j] = 1;
          hintsUsed++;
          updateStats();
          updateCells();
          showToast(tr('nonogram_hint_used'), false);
          return;
        }
      }
    }

    showToast('nonogram_no_hint_available');
  }

  // Fixed: Completely rewritten renderBoard with comma separators
  function renderBoard() {
    if (!containerEl) return;

    containerEl.innerHTML = '';

    var cellSize = getCellSize();
    var clueColHeight = getClueColHeight();
    var clueRowWidth = getClueRowWidth();

    var wrapper = document.createElement('div');
    wrapper.className = 'nonogram-grid-wrapper';

    // TOP ROW: corner + column clues
    var topRow = document.createElement('div');
    topRow.className = 'nonogram-top-row';

    var corner = document.createElement('div');
    corner.className = 'nonogram-corner';
    corner.style.width = clueRowWidth + 'px';
    corner.style.height = clueColHeight + 'px';
    topRow.appendChild(corner);

    var colCluesContainer = document.createElement('div');
    colCluesContainer.className = 'col-clues-row';
    for (var j = 0; j < gridSize; j++) {
      var colClueEl = document.createElement('div');
      colClueEl.className = 'clue-cell col-clue';
      colClueEl.style.width = cellSize + 'px';
      colClueEl.style.height = clueColHeight + 'px';
      
      var clueText = formatClue(colClues[j]);
      var span = document.createElement('span');
      span.textContent = clueText;
      colClueEl.appendChild(span);
      
      colCluesContainer.appendChild(colClueEl);
    }
    topRow.appendChild(colCluesContainer);
    wrapper.appendChild(topRow);

    // BOTTOM ROW: row clues column + grid
    var bottomRow = document.createElement('div');
    bottomRow.className = 'nonogram-bottom-row';

    var rowCluesColumn = document.createElement('div');
    rowCluesColumn.className = 'row-clues-column';
    for (var i = 0; i < gridSize; i++) {
      var rowClueEl = document.createElement('div');
      rowClueEl.className = 'clue-cell row-clue';
      rowClueEl.style.width = clueRowWidth + 'px';
      rowClueEl.style.height = cellSize + 'px';
      
      var clueText = formatClue(rowClues[i]);
      var span = document.createElement('span');
      span.textContent = clueText;
      rowClueEl.appendChild(span);
      
      rowCluesColumn.appendChild(rowClueEl);
    }
    bottomRow.appendChild(rowCluesColumn);

    var gridContainer = document.createElement('div');
    gridContainer.className = 'nonogram-cell-grid';
    gridContainer.id = 'grid-container';
    gridContainer.style.gridTemplateColumns = 'repeat(' + gridSize + ', ' + cellSize + 'px)';

    for (var i = 0; i < gridSize; i++) {
      for (var j = 0; j < gridSize; j++) {
        var cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.width = cellSize + 'px';
        cell.style.height = cellSize + 'px';
        cell.dataset.row = i;
        cell.dataset.col = j;

        if (playerGrid[i][j] === 1) {
          cell.classList.add('filled');
        } else if (playerGrid[i][j] === 2) {
          cell.classList.add('marked');
        }

        (function(r, c) {
          cell.addEventListener('click', function(e) {
            handleCellLeftClick(r, c);
          });
        })(i, j);

        gridContainer.appendChild(cell);
      }
    }

    bottomRow.appendChild(gridContainer);
    wrapper.appendChild(bottomRow);
    containerEl.appendChild(wrapper);
  }

  function handleCellLeftClick(row, col) {
    if (!gameActive) return;

    if (playerGrid[row][col] === 1) {
      playerGrid[row][col] = 0;
    } else {
      playerGrid[row][col] = 1;
    }

    updateCells();
    checkWin();
  }

  function handleCellRightClick(cellEl) {
    if (!gameActive) return;

    var row = parseInt(cellEl.dataset.row);
    var col = parseInt(cellEl.dataset.col);

    if (playerGrid[row][col] === 2) {
      playerGrid[row][col] = 0;
    } else {
      playerGrid[row][col] = 2;
    }

    updateCells();
  }

  function updateCells() {
    var cells = document.querySelectorAll('.cell');
    cells.forEach(function(cell) {
      var r = parseInt(cell.dataset.row);
      var c = parseInt(cell.dataset.col);
      cell.classList.remove('filled', 'marked');
      if (playerGrid[r][c] === 1) {
        cell.classList.add('filled');
      } else if (playerGrid[r][c] === 2) {
        cell.classList.add('marked');
      }
    });
  }

  function checkPuzzle() {
    var mistakesCount = 0;

    for (var i = 0; i < gridSize; i++) {
      for (var j = 0; j < gridSize; j++) {
        if (playerGrid[i][j] === 1 && solution[i][j] === 0) mistakesCount++;
        if (playerGrid[i][j] === 0 && solution[i][j] === 1) mistakesCount++;
      }
    }

    mistakes = mistakesCount;
    updateStats();

    if (mistakes === 0) {
      showToast('nonogram_perfect');
    } else {
      showToast(tr('nonogram_errors_found') + ' ' + mistakes, true);
    }

    checkWin();
  }

  function clearGrid() {
    for (var i = 0; i < gridSize; i++) {
      for (var j = 0; j < gridSize; j++) {
        playerGrid[i][j] = 0;
      }
    }
    updateCells();
    showToast('nonogram_grid_cleared');
  }

  function checkWin() {
    var isComplete = true;

    for (var i = 0; i < gridSize; i++) {
      for (var j = 0; j < gridSize; j++) {
        var playerVal = playerGrid[i][j] === 1 ? 1 : 0;
        if (playerVal !== solution[i][j]) {
          isComplete = false;
          break;
        }
      }
      if (!isComplete) break;
    }

    if (isComplete) {
      gameActive = false;
      if (timerInterval) clearInterval(timerInterval);
      showWinner();
    }
  }

  function showWinner() {
    if (winnerIcon) winnerIcon.textContent = '\u{1F389}';
    if (winnerTitle) winnerTitle.textContent = tr('nonogram_solved');
    if (winnerMessage) {
      winnerMessage.textContent = tr('nonogram_win_message') + ' ' + timeEl.textContent + 
        ' (' + tr('nonogram_hints') + ': ' + hintsUsed + ')';
    }
    if (winnerModal) winnerModal.classList.add('visible');
  }

  window.initGame = initGame;
})();