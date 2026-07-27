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

  var containerEl, timeEl, mistakesEl, sizeSelect;
  var newGameBtn, checkBtn, clearBtn;
  var winnerModal, winnerIcon, winnerTitle, winnerMessage, playAgainBtn, newDifficultyBtn;
  var toast;

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

  function generateSolution(size) {
    var sol = [];
    var density = 0.4;

    for (var i = 0; i < size; i++) {
      sol[i] = [];
      for (var j = 0; j < size; j++) {
        sol[i][j] = Math.random() < density ? 1 : 0;
      }
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

      if (currentRun > 0) {
        clueGroups.push(currentRun);
      }

      clues[i] = clueGroups.length > 0 ? clueGroups : [0];
    }

    return clues;
  }

  function initGame() {
    console.log('[Nonogram] initGame() called');

    containerEl = document.getElementById('nonogram-container');
    timeEl = document.getElementById('time');
    mistakesEl = document.getElementById('mistakes');
    sizeSelect = document.getElementById('size-select');
    newGameBtn = document.getElementById('btn-new-game');
    checkBtn = document.getElementById('btn-check');
    clearBtn = document.getElementById('btn-clear');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    playAgainBtn = document.getElementById('btn-play-again');
    newDifficultyBtn = document.getElementById('btn-new-difficulty');
    toast = document.getElementById('toast');

    startTimer();
    startNewGame();

    sizeSelect.addEventListener('change', function(e) {
      gridSize = parseInt(e.target.value);
      startNewGame();
    });

    if (newGameBtn) newGameBtn.addEventListener('click', startNewGame);
    if (checkBtn) checkBtn.addEventListener('click', checkPuzzle);
    if (clearBtn) clearBtn.addEventListener('click', clearGrid);
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
    generateSolution(gridSize);
    rowClues = calculateClues(solution, gridSize, true);
    colClues = calculateClues(solution, gridSize, false);
    
    playerGrid = [];
    for (var i = 0; i < gridSize; i++) {
      playerGrid[i] = [];
      for (var j = 0; j < gridSize; j++) {
        playerGrid[i][j] = 0; // 0 = empty, 1 = filled, 2 = marked X
      }
    }

    mistakes = 0;
    seconds = 0;
    gameActive = true;
    resetTimer();
    renderBoard();
    updateStats();
  }

  function closeWinnerAndNewGame() {
    if (winnerModal) {
      winnerModal.classList.remove('visible');
    }
    startNewGame();
  }

  function startTimer() {
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
  }

  function renderBoard() {
    if (!containerEl) return;

    containerEl.innerHTML = '';

    var wrapper = document.createElement('div');
    wrapper.className = 'nonogram-grid-wrapper';

    // Create corner
    var corner = document.createElement('div');
    corner.className = 'nonogram-corner';
    wrapper.appendChild(corner);

    // Create column clues
    var colCluesContainer = document.createElement('div');
    colCluesContainer.className = 'nonogram-col-clues';
    for (var j = 0; j < gridSize; j++) {
      var colClueEl = document.createElement('div');
      colClueEl.className = 'clue-cell col-clue';
      colClueEl.id = 'col-clue-' + j;
      
      for (var k = 0; k < colClues[j].length; k++) {
        var span = document.createElement('span');
        span.textContent = colClues[j][k];
        colClueEl.appendChild(span);
      }
      colCluesContainer.appendChild(colClueEl);
    }
    wrapper.appendChild(colCluesContainer);

    // Create row clues + grid
    var mainContainer = document.createElement('div');
    mainContainer.className = 'nonogram-main';

    for (var i = 0; i < gridSize; i++) {
      var rowClueEl = document.createElement('div');
      rowClueEl.className = 'clue-cell row-clue';
      rowClueEl.id = 'row-clue-' + i;
      
      for (var k = 0; k < rowClues[i].length; k++) {
        var span = document.createElement('span');
        span.textContent = rowClues[i][k];
        rowClueEl.appendChild(span);
      }
      mainContainer.appendChild(rowClueEl);
    }

    var gridContainer = document.createElement('div');
    gridContainer.className = 'nonogram-cell-grid';
    gridContainer.id = 'grid-container';

    for (var i = 0; i < gridSize; i++) {
      for (var j = 0; j < gridSize; j++) {
        var cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = i;
        cell.dataset.col = j;

        if (playerGrid[i][j] === 1) {
          cell.classList.add('filled');
        } else if (playerGrid[i][j] === 2) {
          cell.classList.add('marked');
        }

        cell.addEventListener('click', function(e) {
          handleCellLeftClick(e.target);
        });

        gridContainer.appendChild(cell);
      }
    }

    mainContainer.appendChild(gridContainer);
    wrapper.appendChild(mainContainer);
    containerEl.appendChild(wrapper);
  }

  function handleCellLeftClick(cellEl) {
    if (!gameActive) return;

    var row = parseInt(cellEl.dataset.row);
    var col = parseInt(cellEl.dataset.col);

    if (playerGrid[row][col] === 2) {
      playerGrid[row][col] = 0;
    } else if (playerGrid[row][col] === 1) {
      playerGrid[row][col] = 0;
    } else {
      playerGrid[row][col] = 1;
    }

    renderBoard();
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

    renderBoard();
  }

  function checkPuzzle() {
    var mistakesCount = 0;

    for (var i = 0; i < gridSize; i++) {
      for (var j = 0; j < gridSize; j++) {
        if (playerGrid[i][j] === 1 && solution[i][j] === 0) {
          mistakesCount++;
        }
        if (playerGrid[i][j] === 0 && solution[i][j] === 1) {
          mistakesCount++;
        }
      }
    }

    mistakes = mistakesCount;
    updateStats();

    if (mistakes === 0) {
      showToast(tr('nonogram_perfect'));
    } else {
      showToast(tr('nonogram_errors_found') + ' ' + mistakes);
    }

    checkWin();
  }

  function clearGrid() {
    for (var i = 0; i < gridSize; i++) {
      for (var j = 0; j < gridSize; j++) {
        playerGrid[i][j] = 0;
      }
    }
    renderBoard();
    showToast(tr('nonogram_grid_cleared'));
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
      clearInterval(timerInterval);
      showWinner();
    }
  }

  function showWinner() {
    if (winnerIcon) winnerIcon.textContent = '\u{1F389}';
    if (winnerTitle) {
      winnerTitle.textContent = tr('nonogram_solved');
    }
    if (winnerMessage) {
      winnerMessage.textContent = tr('nonogram_win_message') + ' ' + timeEl.textContent;
    }

    if (winnerModal) {
      winnerModal.classList.add('visible');
    }
  }

  window.initGame = initGame;
})();