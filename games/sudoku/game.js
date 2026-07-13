// ============================================
// Tablo — Sudoku (Fixed puzzle generation)
// ============================================

(function() {
  'use strict';

  var BOARD_SIZE = 9;
  var SUBGRID_SIZE = 3;

  var board = [];
  var solution = [];
  var initialBoard = [];
  var notes = [];
  var difficulty = 'medium';
  var errors = 0;
  var maxErrors = 3;
  var timerInterval = null;
  var secondsElapsed = 0;
  var gameActive = false;
  var useNotes = false;
  var selectedCell = null;

  var boardEl = document.getElementById('board');
  var diffEl = document.getElementById('diff-display');
  var errorsEl = document.getElementById('errors');
  var timerEl = document.getElementById('timer');
  var diffSelect = document.getElementById('difficulty-select');
  var newGameBtn = document.getElementById('btn-new-game');
  var hintBtn = document.getElementById('btn-hint');
  var eraseBtn = document.getElementById('btn-erase');
  var notesBtn = document.getElementById('btn-notes');
  var nextBtn = document.getElementById('btn-next');
  var retryBtn = document.getElementById('btn-retry');
  var winnerModal = document.getElementById('winner-modal');
  var gameOverModal = document.getElementById('game-over-modal');
  var winnerStats = document.getElementById('winner-stats');
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
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function() { toast.classList.remove('visible'); }, 2000);
  }

  function initBoard() {
    board = [];
    initialBoard = [];
    notes = [];
    for (var r = 0; r < BOARD_SIZE; r++) {
      board[r] = [];
      initialBoard[r] = [];
      notes[r] = [];
      for (var c = 0; c < BOARD_SIZE; c++) {
        board[r][c] = 0;
        initialBoard[r][c] = 0;
        notes[r][c] = [];
      }
    }
  }

  function isValidPlacement(grid, row, col, num) {
    for (var x = 0; x < BOARD_SIZE; x++) {
      if (grid[row][x] === num) return false;
      if (grid[x][col] === num) return false;
    }
    var startRow = Math.floor(row / SUBGRID_SIZE) * SUBGRID_SIZE;
    var startCol = Math.floor(col / SUBGRID_SIZE) * SUBGRID_SIZE;
    for (var i = 0; i < SUBGRID_SIZE; i++) {
      for (var j = 0; j < SUBGRID_SIZE; j++) {
        if (grid[startRow + i][startCol + j] === num) return false;
      }
    }
    return true;
  }

  function solveSudoku(grid) {
    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        if (grid[r][c] === 0) {
          var nums = [1,2,3,4,5,6,7,8,9].sort(function() { return Math.random() - 0.5; });
          for (var i = 0; i < nums.length; i++) {
            var num = nums[i];
            if (isValidPlacement(grid, r, c, num)) {
              grid[r][c] = num;
              if (solveSudoku(grid)) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  function generatePuzzle(diff) {
    initBoard();
    solveSudoku(board);
    solution = board.map(function(row) { return row.slice(); });
    initialBoard = board.map(function(row) { return row.slice(); });

    var cellsToRemove = diff === 'easy' ? 30 : diff === 'medium' ? 45 : 55;
    var removed = 0;
    var attempts = 0;
    var maxAttempts = 200;

    while (removed < cellsToRemove && attempts < maxAttempts) {
      var r = Math.floor(Math.random() * BOARD_SIZE);
      var c = Math.floor(Math.random() * BOARD_SIZE);
      if (initialBoard[r][c] !== 0) {
        initialBoard[r][c] = 0;
        removed++;
      }
      attempts++;
    }

    // FIX #14: Reset board to match the unsolved puzzle
    board = initialBoard.map(function(row) { return row.slice(); });
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        var cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        if ((r + 1) % 3 === 0 && r !== 8) cell.classList.add('border-bottom');
        if ((c + 1) % 3 === 0 && c !== 8) cell.classList.add('border-right');
        if (selectedCell && selectedCell[0] === r && selectedCell[1] === c) {
          cell.classList.add('selected');
        }
        cell.dataset.r = r;
        cell.dataset.c = c;

        if (initialBoard[r][c] !== 0) {
          cell.textContent = initialBoard[r][c];
          cell.classList.add('initial');
        } else if (board[r][c] !== 0) {
          cell.textContent = board[r][c];
          cell.classList.add('user-input');
        } else if (notes[r][c].length > 0) {
          cell.classList.add('has-notes');
          var noteText = '';
          for (var n = 1; n <= 9; n++) {
            if (notes[r][c].indexOf(n) !== -1) {
              noteText += '<span class="note-' + n + '">' + n + '</span>';
            }
          }
          cell.innerHTML = '<div class="notes-grid">' + noteText + '</div>';
        }

        cell.addEventListener('click', function(e) {
          var cr = parseInt(e.currentTarget.dataset.r);
          var cc = parseInt(e.currentTarget.dataset.c);
          selectCell(cr, cc);
        });

        boardEl.appendChild(cell);
      }
    }
  }

  function selectCell(r, c) {
    selectedCell = [r, c];
    renderBoard();
  }

  function placeNumber(num) {
    if (!selectedCell || !gameActive) return;
    var r = selectedCell[0], c = selectedCell[1];
    if (initialBoard[r][c] !== 0) return;

    if (board[r][c] === num) {
      board[r][c] = 0;
    } else {
      board[r][c] = num;
      if (num !== solution[r][c]) {
        errors++;
        errorsEl.textContent = errors + '/' + maxErrors;
        showToast(tr('sudoku_error'));
        if (errors >= maxErrors) {
          endGame(false);
        }
      }
    }
    renderBoard();
    checkWin();
  }

  function eraseCell() {
    if (!selectedCell) return;
    var r = selectedCell[0], c = selectedCell[1];
    if (initialBoard[r][c] !== 0) return;
    board[r][c] = 0;
    notes[r][c] = [];
    renderBoard();
  }

  function addNote(num) {
    if (!selectedCell) return;
    var r = selectedCell[0], c = selectedCell[1];
    if (initialBoard[r][c] !== 0 || board[r][c] !== 0) return;

    var idx = notes[r][c].indexOf(num);
    if (idx !== -1) {
      notes[r][c].splice(idx, 1);
    } else {
      notes[r][c].push(num);
      notes[r][c].sort(function(a,b) { return a - b; });
    }
    renderBoard();
  }

  function showHint() {
    if (!selectedCell || !gameActive) return;
    var r = selectedCell[0], c = selectedCell[1];
    if (board[r][c] !== 0 || initialBoard[r][c] !== 0) return;

    board[r][c] = solution[r][c];
    renderBoard();
    checkWin();
  }

  function checkWin() {
    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] !== solution[r][c]) return;
      }
    }
    endGame(true);
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    secondsElapsed = 0;
    updateTimer();
    timerInterval = setInterval(function() {
      secondsElapsed++;
      updateTimer();
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateTimer() {
    var mins = Math.floor(secondsElapsed / 60);
    var secs = secondsElapsed % 60;
    timerEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function endGame(won) {
    stopTimer();
    gameActive = false;
    if (won) {
      winnerStats.textContent = tr('slider_time') + ': ' + timerEl.textContent;
      var key = 'tablo-sudoku-best-' + difficulty;
      var savedBest = localStorage.getItem(key);
      if (!savedBest || secondsElapsed < parseInt(savedBest)) {
        localStorage.setItem(key, secondsElapsed.toString());
      }
      winnerModal.classList.add('visible');
    } else {
      gameOverModal.classList.add('visible');
    }
  }

  function renderNumberPad() {
    var pad = document.getElementById('number-pad');
    pad.innerHTML = '';
    for (var n = 1; n <= 9; n++) {
      var btn = document.createElement('button');
      btn.className = 'num-btn';
      btn.textContent = n;
      btn.addEventListener('click', function(e) {
        if (useNotes) {
          addNote(parseInt(e.currentTarget.textContent));
        } else {
          placeNumber(parseInt(e.currentTarget.textContent));
        }
      });
      pad.appendChild(btn);
    }
  }

  function newGame() {
    difficulty = diffSelect.value || 'medium';
    generatePuzzle(difficulty);
    errors = 0;
    errorsEl.textContent = errors + '/' + maxErrors;
    diffEl.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    selectedCell = null;
    gameActive = true;
    winnerModal.classList.remove('visible');
    gameOverModal.classList.remove('visible');
    renderBoard();
    renderNumberPad();
    startTimer();
  }

  function toggleNotes() {
    useNotes = !useNotes;
    notesBtn.classList.toggle('active', useNotes);
    showToast(useNotes ? tr('sudoku_notes_on') : tr('sudoku_notes_off'));
  }

  function handlePhysicalKey(e) {
    if (!gameActive) return;
    var key = e.key;
    if (/^[1-9]$/.test(key)) {
      if (useNotes) addNote(parseInt(key));
      else placeNumber(parseInt(key));
    } else if (key === 'Backspace' || key === 'Delete') {
      eraseCell();
    } else if (key === 'h' || key === 'H') {
      showHint();
    } else if (key === 'n' || key === 'N') {
      toggleNotes();
    } else if (key.startsWith('Arrow')) {
      if (!selectedCell) { selectCell(0, 0); return; }
      var r = selectedCell[0], c = selectedCell[1];
      if (key === 'ArrowUp') r = Math.max(0, r - 1);
      else if (key === 'ArrowDown') r = Math.min(8, r + 1);
      else if (key === 'ArrowLeft') c = Math.max(0, c - 1);
      else if (key === 'ArrowRight') c = Math.min(8, c + 1);
      selectCell(r, c);
    }
  }

  function initGame() {
    document.addEventListener('keydown', handlePhysicalKey);

    window.addEventListener('tablo:languageChanged', function(e) {
      diffEl.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    });

    renderNumberPad();
    if (diffSelect) {
      diffSelect.addEventListener('change', function() {
        newGame();
        showToast(tr('sudoku_difficulty_changed'));
      });
    }
    if (newGameBtn) {
      newGameBtn.addEventListener('click', function() {
        newGame();
        showToast(tr('toast_restarted'));
      });
    }
    if (hintBtn) {
      hintBtn.addEventListener('click', showHint);
    }
    if (eraseBtn) {
      eraseBtn.addEventListener('click', eraseCell);
    }
    if (notesBtn) {
      notesBtn.addEventListener('click', toggleNotes);
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', newGame);
    }
    if (retryBtn) {
      retryBtn.addEventListener('click', newGame);
    }
    newGame();
  }

  window.initGame = initGame;
})();