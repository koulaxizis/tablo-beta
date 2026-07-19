// ============================================
// Tablo — Sudoku (Full Implementation)
// ============================================

(function() {
  'use strict';

  var solution = [];
  var puzzle = [];
  var given = [];
  var notes = [];
  var selectedR = -1;
  var selectedC = -1;
  var notesMode = false;
  var conflictsOn = false;
  var hintsLeft = 3;
  var difficulty = 'easy';
  var history = [];
  var timerInterval = null;
  var secondsElapsed = 0;
  var gameOver = false;

  var DIFF_MAP = {
    easy: { remove: 41 },
    medium: { remove: 49 },
    hard: { remove: 55 }
  };

  var boardEl = document.getElementById('sudoku-board');
  var timerEl = document.getElementById('timer');
  var bestEl = document.getElementById('best-time');
  var hintsDispEl = document.getElementById('hints-display');
  var diffSelect = document.getElementById('difficulty-select');
  var newGameBtn = document.getElementById('btn-new-game');
  var undoBtn = document.getElementById('btn-undo');
  var hintBtn = document.getElementById('btn-hint');
  var notesBtn = document.getElementById('btn-notes');
  var conflictsBtn = document.getElementById('btn-conflicts');
  var retryBtn = document.getElementById('btn-retry');
  var gameOverModal = document.getElementById('game-over-modal');
  var modalIcon = document.getElementById('modal-icon');
  var modalTitle = document.getElementById('modal-title');
  var modalMessage = document.getElementById('modal-message');
  var toast = document.getElementById('toast');
  var numPad = document.getElementById('num-pad');

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

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function startTimer() {
    stopTimer();
    secondsElapsed = 0;
    timerEl.textContent = '00:00';
    timerInterval = setInterval(function() {
      secondsElapsed++;
      timerEl.textContent = formatTime(secondsElapsed);
      checkCompletion();
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function saveBestTime() {
    var key = 'tablo-sudoku-best-' + difficulty;
    var best = localStorage.getItem(key);
    if (!best || secondsElapsed < parseInt(best)) {
      localStorage.setItem(key, secondsElapsed.toString());
      bestEl.textContent = formatTime(secondsElapsed);
    }
  }

  function loadBestTime() {
    var key = 'tablo-sudoku-best-' + difficulty;
    var best = localStorage.getItem(key);
    bestEl.textContent = best ? formatTime(parseInt(best)) : '--:--';
  }

  function cloneGrid(g) {
    return g.map(function(row) { return row.slice(); });
  }

  function isValid(grid, r, c, num) {
    for (var i = 0; i < 9; i++) {
      if (grid[r][i] === num && i !== c) return false;
      if (grid[i][c] === num && i !== r) return false;
    }
    var br = Math.floor(r / 3) * 3;
    var bc = Math.floor(c / 3) * 3;
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        if (grid[br+i][bc+j] === num && (br+i !== r || bc+j !== c)) return false;
      }
    }
    return true;
  }

  function fillGrid(grid) {
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          var nums = [1,2,3,4,5,6,7,8,9].sort(function() { return Math.random() - 0.5; });
          for (var i = 0; i < 9; i++) {
            if (isValid(grid, r, c, nums[i])) {
              grid[r][c] = nums[i];
              if (fillGrid(grid)) return true;
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
    solution = Array(9).fill(0).map(function() { return Array(9).fill(0); });
    fillGrid(solution);

    puzzle = cloneGrid(solution);
    given = Array(9).fill(0).map(function() { return Array(9).fill(false); });

    var remove = DIFF_MAP[diff].remove;
    var attempts = 0;
    while (remove > 0 && attempts < 1000) {
      var r = Math.floor(Math.random() * 9);
      var c = Math.floor(Math.random() * 9);
      if (puzzle[r][c] !== 0) {
        var backup = puzzle[r][c];
        puzzle[r][c] = 0;
        var gridCopy = cloneGrid(puzzle);
        var solutions = countSolutions(gridCopy, 0);
        if (solutions !== 1) {
          puzzle[r][c] = backup;
        } else {
          given[r][c] = false;
          remove--;
        }
      }
      attempts++;
    }

    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (puzzle[r][c] !== 0) {
          given[r][c] = true;
        }
      }
    }
  }

  function countSolutions(grid, count) {
    if (count > 1) return count;
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          for (var n = 1; n <= 9; n++) {
            if (isValid(grid, r, c, n)) {
              grid[r][c] = n;
              count = countSolutions(grid, count);
              grid[r][c] = 0;
              if (count > 1) return count;
            }
          }
          return count;
        }
      }
    }
    return count + 1;
  }

  function initNotes() {
    notes = Array(9).fill(0).map(function() {
      return Array(9).fill(0).map(function() { return {}; });
    });
  }

  function addNote(r, c, n) {
    if (!notesMode) return;
    if (puzzle[r][c] === 0) {
      notes[r][c][n] = notes[r][c][n] ? false : true;
    }
  }

  function clearNotes(r, c) {
    notes[r][c] = {};
  }

  function hasNote(r, c, n) {
    return notes[r][c][n] === true;
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;

        if (c === 2 || c === 5) cell.classList.add('box-sep-right');
        if (r === 2 || r === 5) cell.classList.add('box-sep-bottom');

        if (r === selectedR && c === selectedC) {
          cell.classList.add('selected');
        }

        // Highlights only when conflicts toggle is ON
        if (conflictsOn && selectedR >= 0) {
          var sr = selectedR, sc = selectedC;
          var sameBox = Math.floor(sr/3) === Math.floor(r/3) && Math.floor(sc/3) === Math.floor(c/3);
          if (sameBox || r === sr || c === sc) {
            cell.classList.add('highlight-region');
          }
          if (puzzle[sr][sc] !== 0 && puzzle[r][c] === puzzle[sr][sc] && !(r === sr && c === sc)) {
            cell.classList.add('highlight-same');
          }
        }

        // Conflict highlighting (only when toggle is ON)
        if (conflictsOn && !given[r][c] && puzzle[r][c] !== 0) {
          if (!isValidForCurrent(puzzle, r, c, puzzle[r][c], true)) {
            cell.classList.add('conflict');
          }
        }

        var valEl = document.createElement('div');
        valEl.className = 'cell-value';

        if (puzzle[r][c] !== 0) {
          valEl.textContent = puzzle[r][c];
          if (given[r][c]) {
            cell.classList.add('given');
          } else {
            cell.classList.add('user-input');
          }
        } else if (notesMode) {
          var noteGrid = document.createElement('div');
          noteGrid.className = 'cell-notes';
          for (var nr = 0; nr < 3; nr++) {
            for (var nc = 0; nc < 3; nc++) {
              var num = nr * 3 + nc + 1;
              var noteEl = document.createElement('div');
              noteEl.className = 'note';
              noteEl.textContent = hasNote(r, c, num) ? num : '';
              noteGrid.appendChild(noteEl);
            }
          }
          cell.appendChild(noteGrid);
        }

        cell.appendChild(valEl);

        cell.addEventListener('click', function(e) {
          var r2 = parseInt(this.dataset.r);
          var c2 = parseInt(this.dataset.c);
          selectCell(r2, c2);
        });

        boardEl.appendChild(cell);
      }
    }
  }

  function isValidForCurrent(grid, r, c, num, ignoreSelf) {
    for (var i = 0; i < 9; i++) {
      if (i !== c && grid[r][i] === num) return false;
      if (i !== r && grid[i][c] === num) return false;
    }
    var br = Math.floor(r / 3) * 3;
    var bc = Math.floor(c / 3) * 3;
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        var nr = br + i, nc = bc + j;
        if ((ignoreSelf && nr === r && nc === c) || (nr === r && nc === c)) continue;
        if (grid[nr][nc] === num) return false;
      }
    }
    return true;
  }

  function selectCell(r, c) {
    if (gameOver) return;
    selectedR = r;
    selectedC = c;
    renderBoard();
    highlightButtons();
  }

  function placeNumber(n) {
    if (gameOver || selectedR < 0) return;
    if (given[selectedR][selectedC]) {
      showToast(tr('sudoku_cannot_change'));
      return;
    }
    if (n === 0) {
      saveState();
      puzzle[selectedR][selectedC] = 0;
      clearNotes(selectedR, selectedC);
    } else {
      if (notesMode) {
        saveState();
        addNote(selectedR, selectedC, n);
      } else {
        saveState();
        puzzle[selectedR][selectedC] = n;
        clearNotes(selectedR, selectedC);
      }
    }
    renderBoard();
    checkCompletion();
  }

  function saveState() {
    var state = {
      puzzle: cloneGrid(puzzle),
      notes: JSON.parse(JSON.stringify(notes)),
      selectedR: selectedR,
      selectedC: selectedC
    };
    history.push(state);
    if (history.length > 50) history.shift();
  }

  function undo() {
    if (history.length === 0) {
      showToast(tr('sudoku_nothing_to_undo'));
      return;
    }
    var state = history.pop();
    puzzle = state.puzzle;
    notes = state.notes;
    selectedR = state.selectedR;
    selectedC = state.selectedC;
    renderBoard();
    highlightButtons();
  }

  function giveHint() {
    if (hintsLeft <= 0) {
      showToast(tr('sudoku_no_hints_left'));
      return;
    }
    var emptyCells = [];
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (!given[r][c] && puzzle[r][c] === 0) {
          emptyCells.push({ r: r, c: c });
        }
      }
    }
    if (emptyCells.length === 0) {
      showToast(tr('sudoku_board_full'));
      return;
    }
    var choice = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    saveState();
    puzzle[choice.r][choice.c] = solution[choice.r][choice.c];
    clearNotes(choice.r, choice.c);
    hintsLeft--;
    hintsDispEl.textContent = hintsLeft;
    renderBoard();
    selectCell(choice.r, choice.c);
    checkCompletion();
  }

  function toggleNotesMode() {
    notesMode = !notesMode;
    notesBtn.classList.toggle('active', notesMode);
    renderBoard();
  }

  function toggleConflicts() {
    conflictsOn = !conflictsOn;
    conflictsBtn.classList.toggle('active', conflictsOn);
    renderBoard();
  }

  function highlightButtons() {
    notesBtn.classList.toggle('active', notesMode);
    conflictsBtn.classList.toggle('active', conflictsOn);
  }

  function checkCompletion() {
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (puzzle[r][c] === 0) return;
        if (!isValidForCurrent(puzzle, r, c, puzzle[r][c], true)) return;
      }
    }
    gameOver = true;
    stopTimer();
    saveBestTime();
    modalIcon.textContent = '\uD83C\uDF81';
    modalTitle.textContent = tr('sudoku_completed');
    modalMessage.textContent = tr('sudoku_congrats') + ' (' + formatTime(secondsElapsed) + ')';
    gameOverModal.classList.add('visible');
    gameOverModal.style.display = 'flex';
  }

  function handleNumInput(n) {
    placeNumber(parseInt(n));
  }

  function setupKeyboard() {
    document.addEventListener('keydown', function(e) {
      if (gameOver) return;
      if (e.key >= '1' && e.key <= '9') {
        handleNumInput(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleNumInput('0');
      } else if (e.key === 'ArrowUp' && selectedR > 0) {
        selectCell(selectedR - 1, selectedC);
      } else if (e.key === 'ArrowDown' && selectedR < 8) {
        selectCell(selectedR + 1, selectedC);
      } else if (e.key === 'ArrowLeft' && selectedC > 0) {
        selectCell(selectedR, selectedC - 1);
      } else if (e.key === 'ArrowRight' && selectedC < 8) {
        selectCell(selectedR, selectedC + 1);
      } else if (e.key.toLowerCase() === 'n') {
        toggleNotesMode();
      } else if (e.key.toLowerCase() === 'h') {
        giveHint();
      } else if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
        undo();
      }
    });
  }

  function newGame() {
    difficulty = diffSelect.value;
    generatePuzzle(difficulty);
    initNotes();
    selectedR = -1;
    selectedC = -1;
    history = [];
    hintsLeft = 3;
    hintsDispEl.textContent = hintsLeft;
    gameOver = false;
    gameOverModal.classList.remove('visible');
    gameOverModal.style.display = 'none';
    startTimer();
    renderBoard();
    highlightButtons();
  }

  function initGame() {
    diffSelect.value = 'easy';

    diffSelect.addEventListener('change', function() {
      newGame();
      showToast(tr('toast_restarted'));
    });

    newGameBtn.addEventListener('click', function() {
      newGame();
      showToast(tr('toast_restarted'));
    });

    undoBtn.addEventListener('click', undo);

    hintBtn.addEventListener('click', giveHint);

    notesBtn.addEventListener('click', toggleNotesMode);

    conflictsBtn.addEventListener('click', toggleConflicts);

    retryBtn.addEventListener('click', newGame);

    numPad.addEventListener('click', function(e) {
      var btn = e.target.closest('.num-btn');
      if (btn) {
        handleNumInput(btn.dataset.n);
      }
    });

    setupKeyboard();
    newGame();
  }

  window.initGame = initGame;
})();