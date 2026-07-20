// ============================================
// Tablo — Mastermind
// ============================================

(function() {
  'use strict';

  console.log('[Mastermind] game.js loaded');

  var COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  var SLOT_COUNT = 4;
  var MAX_ATTEMPTS = 10;

  var COLOR_HEX = {
    'red': '#ef4444',
    'blue': '#3b82f6',
    'green': '#22c55e',
    'yellow': '#eab308',
    'purple': '#a855f7',
    'orange': '#f97316'
  };

  var difficulty = 'normal';
  var activeColors = [];
  var secretCode = [];
  var currentGuess = [];
  var guessHistory = [];
  var currentAttempt = 1;
  var gameActive = false;
  var wins = 0;
  var bestAttempt = Infinity;

  var boardEl, currentRowEl, colorPickerEl;
  var attemptCounterEl, bestAttemptEl, winsCountEl;
  var submitBtn, clearBtn, newGameBtn, difficultySelect;
  var winnerModal, winnerIcon, winnerTitle, winnerSecret, winnerMessage, playAgainBtn;
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

  function getDifficultyColors() {
    if (difficulty === 'easy') return COLORS.slice(0, 4);
    if (difficulty === 'hard') return COLORS.slice(0, 6);
    return COLORS.slice(0, 5);
  }

  function generateSecretCode() {
    secretCode = [];
    for (var i = 0; i < SLOT_COUNT; i++) {
      secretCode.push(activeColors[Math.floor(Math.random() * activeColors.length)]);
    }
    console.log('[Mastermind] Secret code:', secretCode);
  }

  function calculateFeedback(guess) {
    var exact = 0;
    var partial = 0;
    var codeCopy = secretCode.slice();
    var guessCopy = guess.slice();

    for (var i = 0; i < SLOT_COUNT; i++) {
      if (guess[i] === secretCode[i]) {
        exact++;
        codeCopy[i] = null;
        guessCopy[i] = null;
      }
    }

    for (var j = 0; j < SLOT_COUNT; j++) {
      if (guessCopy[j] === null) continue;
      var idx = codeCopy.indexOf(guessCopy[j]);
      if (idx !== -1) {
        partial++;
        codeCopy[idx] = null;
      }
    }

    return { exact: exact, partial: partial };
  }

  function updateColorPicker() {
    if (!colorPickerEl) return;
    var btns = colorPickerEl.querySelectorAll('.color-btn');
    console.log('[Mastermind] Updating color picker, active colors:', activeColors.length);
    btns.forEach(function(btn) {
      var color = btn.dataset.color;
      if (activeColors.indexOf(color) !== -1) {
        btn.style.display = '';
      } else {
        btn.style.display = 'none';
      }
    });
  }

  function renderHistory() {
    if (!boardEl) return;
    boardEl.innerHTML = '';

    for (var i = 0; i < guessHistory.length; i++) {
      var h = guessHistory[i];
      var row = document.createElement('div');
      row.className = 'mm-past-row';

      var num = document.createElement('span');
      num.className = 'mm-row-num';
      num.textContent = '#' + (i + 1);
      row.appendChild(num);

      var slots = document.createElement('div');
      slots.className = 'mm-slots';
      for (var s = 0; s < SLOT_COUNT; s++) {
        var slot = document.createElement('div');
        slot.className = 'mm-slot filled';
        slot.style.background = COLOR_HEX[h.guess[s]] || '#334155';
        slots.appendChild(slot);
      }
      row.appendChild(slots);

      var feedback = document.createElement('div');
      feedback.className = 'mm-feedback';
      for (var f = 0; f < SLOT_COUNT; f++) {
        var dot = document.createElement('div');
        dot.className = 'mm-dot';
        if (f < h.feedback.exact) {
          dot.classList.add('green');
        } else if (f < h.feedback.exact + h.feedback.partial) {
          dot.classList.add('yellow');
        }
        feedback.appendChild(dot);
      }
      row.appendChild(feedback);

      boardEl.appendChild(row);
    }

    // Auto-scroll to bottom
    boardEl.scrollTop = boardEl.scrollHeight;
  }

  function renderCurrentRow() {
    if (!currentRowEl) return;

    if (!gameActive) {
      currentRowEl.classList.add('hidden');
      return;
    }

    currentRowEl.classList.remove('hidden');
    currentRowEl.innerHTML = '';

    var num = document.createElement('span');
    num.className = 'mm-current-num';
    num.textContent = '#' + currentAttempt;
    currentRowEl.appendChild(num);

    var slots = document.createElement('div');
    slots.className = 'mm-current-slots';

    var nextEmpty = -1;
    for (var i = 0; i < SLOT_COUNT; i++) {
      if (!currentGuess[i] && nextEmpty === -1) {
        nextEmpty = i;
      }
    }

    for (var s = 0; s < SLOT_COUNT; s++) {
      var slot = document.createElement('div');
      slot.className = 'mm-input-slot';
      slot.dataset.index = s;

      if (currentGuess[s]) {
        slot.classList.add('filled');
        slot.style.background = COLOR_HEX[currentGuess[s]];
      } else if (s === nextEmpty) {
        slot.classList.add('next');
      }

      // Click on filled slot to clear it
      slot.addEventListener('click', function(idx) {
        console.log('[Mastermind] Slot click:', idx, 'current value:', currentGuess[idx]);
        if (currentGuess[idx]) {
          currentGuess[idx] = null;
          renderCurrentRow();
          updateSubmitState();
        }
      }.bind(null, s));

      slots.appendChild(slot);
    }

    currentRowEl.appendChild(slots);
  }

  function updateSubmitState() {
    var allFilled = true;
    for (var i = 0; i < SLOT_COUNT; i++) {
      if (!currentGuess[i]) { allFilled = false; break; }
    }
    if (submitBtn) submitBtn.disabled = !allFilled || !gameActive;
    console.log('[Mastermind] Submit state:', allFilled && gameActive);
  }

  function updateStats() {
    if (attemptCounterEl) attemptCounterEl.textContent = currentAttempt + '/' + MAX_ATTEMPTS;
    if (bestAttemptEl) bestAttemptEl.textContent = bestAttempt === Infinity ? '-' : bestAttempt;
    if (winsCountEl) winsCountEl.textContent = wins;
  }

  function selectColor(colorName) {
    if (!gameActive) {
      console.log('[Mastermind] Color ignored: game not active');
      return;
    }

    var emptyIdx = -1;
    for (var i = 0; i < SLOT_COUNT; i++) {
      if (!currentGuess[i]) { emptyIdx = i; break; }
    }

    if (emptyIdx === -1) {
      console.log('[Mastermind] All slots filled');
      showToast('mastermind_full');
      return;
    }

    currentGuess[emptyIdx] = colorName;
    console.log('[Mastermind] Color placed:', colorName, 'at slot', emptyIdx, 'guess now:', currentGuess);
    renderCurrentRow();
    updateSubmitState();
  }

  function submitGuess() {
    if (!gameActive) return;

    var incomplete = false;
    for (var i = 0; i < SLOT_COUNT; i++) {
      if (!currentGuess[i]) { incomplete = true; break; }
    }
    if (incomplete) {
      showToast('mastermind_incomplete');
      return;
    }

    var feedback = calculateFeedback(currentGuess);
    console.log('[Mastermind] Feedback: exact=' + feedback.exact + ' partial=' + feedback.partial);

    guessHistory.push({
      guess: currentGuess.slice(),
      feedback: feedback
    });

    if (feedback.exact === SLOT_COUNT) {
      console.log('[Mastermind] WIN!');
      gameActive = false;
      if (currentAttempt < bestAttempt) {
        bestAttempt = currentAttempt;
        localStorage.setItem('mastermind-best', bestAttempt.toString());
      }
      wins++;
      localStorage.setItem('mastermind-wins', wins.toString());
      renderHistory();
      renderCurrentRow();
      updateStats();
      showWinner(true, currentAttempt);
      return;
    }

    currentAttempt++;
    currentGuess = [null, null, null, null];

    if (currentAttempt > MAX_ATTEMPTS) {
      console.log('[Mastermind] LOSS - out of attempts');
      gameActive = false;
      renderHistory();
      renderCurrentRow();
      updateStats();
      showWinner(false, MAX_ATTEMPTS);
      return;
    }

    renderHistory();
    renderCurrentRow();
    updateSubmitState();
    updateStats();
    console.log('[Mastermind] Next attempt:', currentAttempt);
  }

  function showWinner(won, attempts) {
    if (winnerIcon) winnerIcon.textContent = won ? '\u{1F389}' : '\u{1F4AD}';
    if (winnerTitle) {
      winnerTitle.textContent = won ? tr('mastermind_you_win') : tr('mastermind_ai_wins');
    }
    if (winnerMessage) {
      winnerMessage.textContent = won
        ? tr('mastermind_solved_in') + ' ' + attempts + ' ' + tr('mastermind_attempts') + '!'
        : tr('mastermind_out_of_guesses');
    }

    if (winnerSecret) {
      winnerSecret.innerHTML = '';
      for (var i = 0; i < SLOT_COUNT; i++) {
        var peg = document.createElement('div');
        peg.className = 'mm-slot filled';
        peg.style.background = COLOR_HEX[secretCode[i]];
        winnerSecret.appendChild(peg);
      }
    }

    if (winnerModal) {
      winnerModal.classList.add('visible');
      winnerModal.style.display = 'flex';
    }
  }

  function clearCurrent() {
    if (!gameActive) return;
    currentGuess = [null, null, null, null];
    renderCurrentRow();
    updateSubmitState();
    console.log('[Mastermind] Cleared current guess');
  }

  function startNewGame() {
    console.log('[Mastermind] Starting new game, difficulty:', difficulty);
    activeColors = getDifficultyColors();
    generateSecretCode();
    currentGuess = [null, null, null, null];
    guessHistory = [];
    currentAttempt = 1;
    gameActive = true;

    if (winnerModal) {
      winnerModal.classList.remove('visible');
      winnerModal.style.display = 'none';
    }

    updateColorPicker();
    renderHistory();
    renderCurrentRow();
    updateSubmitState();
    updateStats();
  }

  function initGame() {
    console.log('[Mastermind] initGame() called');

    boardEl = document.getElementById('mm-board');
    currentRowEl = document.getElementById('mm-current-row');
    colorPickerEl = document.getElementById('color-picker');
    attemptCounterEl = document.getElementById('attempt-counter');
    bestAttemptEl = document.getElementById('best-attempt');
    winsCountEl = document.getElementById('wins-count');
    submitBtn = document.getElementById('btn-submit');
    clearBtn = document.getElementById('btn-clear');
    newGameBtn = document.getElementById('btn-new-game');
    difficultySelect = document.getElementById('difficulty-select');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerSecret = document.getElementById('winner-secret');
    winnerMessage = document.getElementById('winner-message');
    playAgainBtn = document.getElementById('btn-play-again');
    toast = document.getElementById('toast');

    console.log('[Mastermind] Elements:', {
      boardEl: !!boardEl,
      currentRowEl: !!currentRowEl,
      colorPickerEl: !!colorPickerEl,
      submitBtn: !!submitBtn,
      winnerModal: !!winnerModal,
      toast: !!toast
    });

    if (!boardEl || !currentRowEl || !colorPickerEl) {
      console.error('[Mastermind] CRITICAL: Missing core elements!');
      return;
    }

    var savedBest = localStorage.getItem('mastermind-best');
    if (savedBest) bestAttempt = parseInt(savedBest);
    var savedWins = localStorage.getItem('mastermind-wins');
    if (savedWins) wins = parseInt(savedWins);

    var colorBtns = colorPickerEl.querySelectorAll('.color-btn');
    console.log('[Mastermind] Color buttons found:', colorBtns.length);
    colorBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        console.log('[Mastermind] Color button clicked:', btn.dataset.color);
        selectColor(btn.dataset.color);
      });
    });

    if (submitBtn) submitBtn.addEventListener('click', function() {
      console.log('[Mastermind] Submit clicked');
      submitGuess();
    });

    if (clearBtn) clearBtn.addEventListener('click', function() {
      console.log('[Mastermind] Clear clicked');
      clearCurrent();
    });

    if (newGameBtn) newGameBtn.addEventListener('click', function() {
      startNewGame();
      showToast('toast_restarted');
    });

    if (playAgainBtn) playAgainBtn.addEventListener('click', function() {
      if (winnerModal) {
        winnerModal.classList.remove('visible');
        winnerModal.style.display = 'none';
      }
      startNewGame();
    });

    if (difficultySelect) difficultySelect.addEventListener('change', function() {
      difficulty = this.value;
      console.log('[Mastermind] Difficulty changed:', difficulty);
      startNewGame();
      showToast('toast_difficulty_changed');
    });

    startNewGame();
    console.log('[Mastermind] Init complete');
  }

  window.initGame = initGame;
})();