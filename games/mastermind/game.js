// ============================================
// Tablo — Mastermind
// ============================================

(function() {
  'use strict';

  var COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  var SLOT_COUNT = 4;
  var MAX_ATTEMPTS = 10;
  
  var difficulty = 'normal';
  var secretCode = [];
  var currentGuess = [];
  var currentAttempt = 1;
  var gameActive = false;
  var wins = 0;
  var bestAttempt = Infinity;

  var boardEl, colorPickerEl, attemptCounterEl, bestAttemptEl, winsCountEl;
  var submitBtn, clearBtn, newGameBtn, difficultySelect;
  var winnerModal, winnerIcon, winnerTitle, winnerMessage, winnerButtons, playAgainBtn;
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

  function generateSecretCode() {
    secretCode = [];
    var colorPool = getDifficultyColors();
    for (var i = 0; i < SLOT_COUNT; i++) {
      secretCode.push(colorPool[Math.floor(Math.random() * colorPool.length)]);
    }
    console.log('[Mastermind] Secret code:', secretCode); // DEBUG
  }

  function getDifficultyColors() {
    if (difficulty === 'easy') return COLORS.slice(0, 4); // 4 colors
    if (difficulty === 'hard') return COLORS.slice(0, 6); // 6 colors
    return COLORS.slice(0, 5); // Normal: 5 colors
  }

  function getColorHex(name) {
    var map = {
      'red': '#ef4444',
      'blue': '#3b82f6',
      'green': '#22c55e',
      'yellow': '#eab308',
      'purple': '#a855f7',
      'orange': '#f97316'
    };
    return map[name] || '#334155';
  }

  function renderBoard() {
    if (!boardEl) return;
    boardEl.innerHTML = '';

    for (var attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      var row = document.createElement('div');
      row.className = 'guess-row';
      
      if (attempt === currentAttempt - 1 && gameActive) {
        row.classList.add('current');
      }

      var isPast = attempt < currentAttempt - 1;

      // Slots
      var slotsDiv = document.createElement('div');
      slotsDiv.className = 'slots';
      for (var s = 0; s < SLOT_COUNT; s++) {
        var slot = document.createElement('div');
        slot.className = 'slot';
        
        if (isPast) {
          slot.classList.add('filled');
          slot.style.background = getColorHex(secretCode[s]); // Revealed after game ends
        } else if (attempt === currentAttempt - 1 && currentGuess[s]) {
          slot.classList.add('filled');
          slot.style.background = getColorHex(currentGuess[s]);
        }
        
        if (gameActive && attempt === currentAttempt - 1) {
          slot.addEventListener('click', function(idx) {
            selectSlot(idx);
          }.bind(this, s));
        }
        
        slotsDiv.appendChild(slot);
      }

      row.appendChild(slotsDiv);

      // Secret display (hidden unless game over)
      var secretDisplay = document.createElement('div');
      secretDisplay.className = 'secret-display' + (isPast ? ' revealed' : '');
      for (var sp = 0; sp < SLOT_COUNT; sp++) {
        var peg = document.createElement('div');
        peg.className = 'secret-peg';
        peg.style.background = getColorHex(secretCode[sp]);
        secretDisplay.appendChild(peg);
      }

      if (isPast) {
        row.appendChild(secretDisplay);
      }

      // Feedback dots (only for completed attempts)
      var feedbackDiv = document.createElement('div');
      feedbackDiv.className = 'feedback-dots';
      
      if (isPast || !gameActive) {
        var feedback = calculateFeedback(getGuessForAttempt(attempt + 1));
        for (var f = 0; f < SLOT_COUNT; f++) {
          var dot = document.createElement('div');
          dot.className = 'feedback-dot';
          
          if (f < feedback.exact) {
            dot.classList.add('correct');
          } else if (f < feedback.exact + feedback.partial) {
            dot.classList.add('partial');
          }
          
          feedbackDiv.appendChild(dot);
        }
      }
      
      row.appendChild(feedbackDiv);

      // Attempt number
      var attemptNum = document.createElement('span');
      attemptNum.style.fontSize = '12px';
      attemptNum.style.color = '#64748b';
      attemptNum.style.marginRight = '8px';
      attemptNum.textContent = '#' + (attempt + 1);
      row.insertBefore(attemptNum, row.firstChild);

      boardEl.appendChild(row);
    }
  }

  function getGuessForAttempt(num) {
    // Need to store guesses for feedback calculation
    // For simplicity, will recalculate from DOM or stored array
    if (num === currentAttempt) return currentGuess;
    // Past guesses would be stored here
    return [];
  }

  function calculateFeedback(guess) {
    var exact = 0;
    var partial = 0;
    var codeCopy = secretCode.slice();
    var guessCopy = guess.slice();

    // First pass: exact matches
    for (var i = 0; i < SLOT_COUNT; i++) {
      if (guess[i] === secretCode[i]) {
        exact++;
        codeCopy[i] = null;
        guessCopy[i] = null;
      }
    }

    // Second pass: partial matches
    for (var i = 0; i < SLOT_COUNT; i++) {
      if (guessCopy[i] === null) continue;
      var idx = codeCopy.indexOf(guessCopy[i]);
      if (idx !== -1) {
        partial++;
        codeCopy[idx] = null;
      }
    }

    return { exact: exact, partial: partial };
  }

  function selectSlot(index) {
    if (!gameActive || currentGuess.length === 0) return;
    
    currentGuess[index] = null;
    renderBoard();
  }

  function selectColor(colorName) {
    if (!gameActive) return;
    
    // Find empty slot
    var emptyIndex = currentGuess.indexOf(null);
    if (emptyIndex === -1) {
      showToast('mastermind_full');
      return;
    }
    
    currentGuess[emptyIndex] = colorName;
    renderBoard();

    if (currentGuess.every(function(c) { return c !== null; })) {
      submitBtn.disabled = false;
    }
  }

  function submitGuess() {
    if (!gameActive) return;
    if (currentGuess.some(function(c) { return c === null; })) {
      showToast('mastermind_incomplete');
      return;
    }

    var feedback = calculateFeedback(currentGuess);
    
    if (feedback.exact === SLOT_COUNT) {
      // WIN!
      gameActive = false;
      if (currentAttempt < bestAttempt) {
        bestAttempt = currentAttempt;
        localStorage.setItem('mastermind-best', bestAttempt.toString());
      }
      wins++;
      localStorage.setItem('mastermind-wins', wins.toString());
      showWinner(true, currentAttempt);
    } else {
      currentAttempt++;
      currentGuess = Array(SLOT_COUNT).fill(null);
      submitBtn.disabled = true;
      
      if (currentAttempt > MAX_ATTEMPTS) {
        gameActive = false;
        showWinner(false, MAX_ATTEMPTS);
      }
    }
    
    updateStats();
    renderBoard();
  }

  function showWinner(won, attempts) {
    if (winnerIcon) winnerIcon.textContent = won ? '\u{1F389}' : '\u{2696}';
    if (winnerTitle) {
      winnerTitle.textContent = won ? tr('mastermind_you_win') : tr('mastermind_ai_wins');
    }
    if (winnerMessage) {
      winnerMessage.textContent = won
        ? tr('mastermind_solved_in') + ' ' + attempts + ' ' + tr('mastermind_attempts') + '!'
        : tr('mastermind_secret_was') + ': ' + secretCode.join(', ');
    }

    if (playAgainBtn) {
      playAgainBtn.onclick = function() {
        if (winnerModal) {
          winnerModal.classList.remove('visible');
          winnerModal.style.display = 'none';
        }
        startNewGame();
      };
    }

    if (winnerModal) {
      winnerModal.classList.add('visible');
      winnerModal.style.display = 'flex';
    }
  }

  function updateStats() {
    if (attemptCounterEl) attemptCounterEl.textContent = currentAttempt + '/' + MAX_ATTEMPTS;
    if (bestAttemptEl) bestAttemptEl.textContent = bestAttempt === Infinity ? '-' : bestAttempt;
    if (winsCountEl) winsCountEl.textContent = wins;
  }

  function startNewGame() {
    generateSecretCode();
    currentGuess = Array(SLOT_COUNT).fill(null);
    currentAttempt = 1;
    gameActive = true;
    submitBtn.disabled = true;
    updateStats();
    renderBoard();
    showToast('mastermind_new_game_started');
  }

  function clearCurrent() {
    if (!gameActive) return;
    currentGuess = Array(SLOT_COUNT).fill(null);
    submitBtn.disabled = true;
    renderBoard();
  }

  function initGame() {
    boardEl = document.getElementById('mastermind-board');
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
    winnerMessage = document.getElementById('winner-message');
    winnerButtons = document.getElementById('winner-buttons');
    playAgainBtn = document.getElementById('btn-play-again');
    toast = document.getElementById('toast');

    // Load saved stats
    var savedBest = localStorage.getItem('mastermind-best');
    if (savedBest) bestAttempt = parseInt(savedBest);
    var savedWins = localStorage.getItem('mastermind-wins');
    if (savedWins) wins = parseInt(savedWins);

    // Color buttons
    var colorBtns = colorPickerEl.querySelectorAll('.color-btn');
    colorBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        selectColor(btn.dataset.color);
        // Deselect others
        colorBtns.forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
      });
    });

    submitBtn.addEventListener('click', submitGuess);
    clearBtn.addEventListener('click', clearCurrent);
    newGameBtn.addEventListener('click', function() {
      startNewGame();
      showToast('toast_restarted');
    });
    playAgainBtn.addEventListener('click', function() {
      if (winnerModal) {
        winnerModal.classList.remove('visible');
        winnerModal.style.display = 'none';
      }
      startNewGame();
    });

    difficultySelect.addEventListener('change', function() {
      difficulty = this.value;
      startNewGame();
      showToast('toast_difficulty_changed');
    });

    startNewGame();
  }

  window.initGame = initGame;
})();