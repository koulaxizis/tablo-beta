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
  var solutionVisible = false;

  var containerEl, timeEl, mistakesEl, hintsEl, sizeSelect;
  var newGameBtn, checkBtn, clearBtn, hintBtn, solutionBtn;
  var winnerModal, winnerIcon, winnerTitle, winnerMessage, playAgainBtn, newDifficultyBtn;
  var toast;

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

  function generateSolution(size) {
    var sol = [];
    var density = 0.45;

    // Initialize empty grid
    for (var i = 0; i < size; i++) {
      sol[i] = [];
      for (var j = 0; j < size; j++) {
        sol[i][j] = 0;
      }
    }

    // Generate filled cells randomly
    var numCells = Math.floor(size * size * density);
    var placed = 0;
    while (placed < numCells) {
      var r = Math.floor(Math.random() * size);
      var c = Math.floor(Math.random() * size);
      if (sol[r][c] === 0) {
        sol[r][c] = 1;
        placed++;
      }
    }

    return sol;
  }

  // Fixed: Calculate clues from ACTUAL filled cells in solution
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
      if (currentRun > 0) {
        clueGroups.push(currentRun);
      }
      clues[i] = clueGroups.length > 0 ? clueGroups : [0];
    }
    return clues;
  }

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
    solutionBtn = document.getElementById('btn-solution');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    playAgainBtn = document.getElementById('btn-play-again');
    newDifficultyBtn = document.getElementById('btn-new-difficulty');
    toast = document.getElementById('toast');

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
    
    // Fixed: Added Solution button handler
    if (solutionBtn) solutionBtn.addEventListener('click', toggleSolution);
    
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
    solutionVisible = false;
    seconds = 0;
    gameActive = true;
    resetTimer();
    updateSolutionButton();
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
    if (!gameActive || solutionVisible) return;

    // Find first cell where player is wrong or empty but should be filled
    for (var i = 0; i < gridSize; i++) {
      for (var j = 0; j < gridSize; j++) {
        if (playerGrid[i][j] !== solution[i][j]) {
          playerGrid[i][j] = solution[i][j];
          hintsUsed++;
          updateStats();
          updateCells();
          showToast('nonogram_hint_used', false);
          return;
        }
      }
    }
    showToast('nonogram_no_hint_available');
  }

  // New: Toggle solution visibility
  function toggleSolution() {
    solutionVisible = !solutionVisible;
    updateSolutionButton();
    renderBoard();
    showToast(solutionVisible ? 'nonogram_solution_shown' : 'nonogram_solution_hidden');
  }

  function updateSolutionButton() {
    if (solutionBtn) {
      solutionBtn.textContent = solutionVisible ? tr('nonogram_hide_solution') : tr('nonogram_show_solution');
      solutionBtn.style.opacity = solutionVisible ? '0.7' : '1';
    }
  }

  function renderBoard() {
    if (!containerEl) return;

    containerEl.innerHTML = '';

    var cellSize = getCellSize();
    var clueColHeight = window.innerWidth <= 600 ? 40 : 50;
    var clueRowWidth = window.innerWidth <= 600 ? 45 : 60;

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

        // Fixed: Show solution if solutionVisible is true
        if (solutionVisible) {
          if (solution[i][j] === 1) {
            cell.classList.add('filled');
            cell.classList.add('solution-preview');
          }
        } else {
          if (playerGrid[i][j] === 1) {
            cell.classList.add('filled');
          } else if (playerGrid[i][j] === 2) {
            cell.classList.add('marked');
          }
        }

        if (!solutionVisible) {
          (function(r, c) {
            cell.addEventListener('click', function(e) {
              handleCellLeftClick(r, c);
            });
          })(i, j);
        }

        gridContainer.appendChild(cell);
      }
    }

    bottomRow.appendChild(gridContainer);
    wrapper.appendChild(bottomRow);
    containerEl.appendChild(wrapper);
  }

  function handleCellLeftClick(row, col) {
    if (!gameActive || solutionVisible) return;

    if (playerGrid[row][col] === 1) {
      playerGrid[row][col] = 0;
    } else {
      playerGrid[row][col] = 1;
    }

    updateCells();
    checkWin();
  }

  function handleCellRightClick(cellEl) {
    if (!gameActive || solutionVisible) return;

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
      cell.classList.remove('filled', 'marked', 'solution-preview');
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