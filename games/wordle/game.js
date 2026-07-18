// ============================================
// Tablo — Wordle (English word list, all langs)
// ============================================

(function() {
  'use strict';

  var WORDS = [
    'apple','beach','chair','dance','eagle','flame','globe','horse','input','jolly',
    'knife','lemon','mango','night','ocean','piano','queen','river','sound','table',
    'uncle','voice','water','youth','zebra','brave','cloud','dream','earth','fruit',
    'ghost','happy','ivory','jewel','magic','peace','quest','royal','smart','trust',
    'unity','vivid','world','yacht','bloom','crisp','drive','grape','house','stone',
    'light','music','space','tiger','sweet','bread','cream','field','green','heart',
    'ideal','juice','knock','large','mouse','novel','opera','pride','quiet','range',
    'sharp','tower','urban','valor','wheat','xenon','yield','zesty','amber','black',
    'candy','depth','equal','flint','glory','hover','index','jumbo','karma','latch',
    'mirth','nurse','olive','plumb','quart','raven','scout','trail','union','vault'
  ];

  var currentLang = 'en';
  var targetWord = '';
  var guesses = [];
  var currentGuess = '';
  var gameOver = false;
  var won = false;

  var boardEl = document.getElementById('wordle-board');
  var keyboardEl = document.getElementById('wordle-keyboard');
  var streakEl = document.getElementById('streak');
  var bestEl = document.getElementById('best-streak');
  var newWordBtn = document.getElementById('btn-new-word');
  var guessCountEl = document.getElementById('guess-count');
  var winnerModal = document.getElementById('winner-modal');
  var winnerIcon = document.getElementById('winner-icon');
  var winnerTitle = document.getElementById('winner-title');
  var winnerMessage = document.getElementById('winner-message');
  var winnerAnswer = document.getElementById('winner-answer');
  var retryBtn = document.getElementById('btn-retry');
  var toast = document.getElementById('toast');

  var MAX_GUESSES = 6;
  var WORD_LENGTH = 5;

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

  function pickWord() {
    var idx = Math.floor(Math.random() * WORDS.length);
    return WORDS[idx].toLowerCase();
  }

  function newGame() {
    targetWord = pickWord();
    guesses = [];
    currentGuess = '';
    gameOver = false;
    won = false;
    if (winnerModal) winnerModal.classList.remove('visible');
    updateGuessCount();
    renderBoard();
    renderKeyboard();
  }

  function updateGuessCount() {
    if (guessCountEl) guessCountEl.textContent = guesses.length + '/' + MAX_GUESSES;
  }

  function renderBoard() {
    if (!boardEl) return;
    boardEl.innerHTML = '';
    for (var r = 0; r < MAX_GUESSES; r++) {
      var rowEl = document.createElement('div');
      rowEl.className = 'wordle-row';
      for (var c = 0; c < WORD_LENGTH; c++) {
        var cellEl = document.createElement('div');
        cellEl.className = 'wordle-cell';
        if (guesses[r]) {
          cellEl.textContent = (guesses[r][c] || '').toUpperCase();
          var evalR = evaluateGuess(guesses[r]);
          if (evalR[c] === 'correct') cellEl.classList.add('correct');
          else if (evalR[c] === 'present') cellEl.classList.add('present');
          else cellEl.classList.add('absent');
        } else if (r === guesses.length && c < currentGuess.length) {
          cellEl.textContent = currentGuess[c].toUpperCase();
        }
        rowEl.appendChild(cellEl);
      }
      boardEl.appendChild(rowEl);
    }
  }

  function evaluateGuess(guess) {
    var result = [];
    var targetChars = targetWord.split('');
    var guessChars = guess.split('');

    for (var i = 0; i < WORD_LENGTH; i++) {
      if (guessChars[i] === targetChars[i]) {
        result[i] = 'correct';
        targetChars[i] = null;
      }
    }
    for (var j = 0; j < WORD_LENGTH; j++) {
      if (result[j]) continue;
      var idx = targetChars.indexOf(guessChars[j]);
      if (idx !== -1) {
        result[j] = 'present';
        targetChars[idx] = null;
      } else {
        result[j] = 'absent';
      }
    }
    return result;
  }

  function renderKeyboard() {
    if (!keyboardEl) return;
    keyboardEl.innerHTML = '';

    var rows = [
      ['q','w','e','r','t','y','u','i','o','p'],
      ['a','s','d','f','g','h','j','k','l'],
      ['enter','z','x','c','v','b','n','m','back']
    ];

    var knownStates = {};
    for (var g = 0; g < guesses.length; g++) {
      var evalR = evaluateGuess(guesses[g]);
      for (var i = 0; i < guesses[g].length; i++) {
        var ch = guesses[g][i];
        if (evalR[i] === 'correct') knownStates[ch] = 'correct';
        else if (evalR[i] === 'present' && knownStates[ch] !== 'correct') knownStates[ch] = 'present';
        else if (!knownStates[ch]) knownStates[ch] = 'absent';
      }
    }

    rows.forEach(function(row) {
      var rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      row.forEach(function(key) {
        var btn = document.createElement('button');
        btn.className = 'kb-key';
        if (key === 'enter') {
          btn.textContent = '\u23CE';
          btn.classList.add('kb-wide');
        } else if (key === 'back') {
          btn.textContent = '\u232B';
          btn.classList.add('kb-wide');
        } else {
          btn.textContent = key.toUpperCase();
          if (knownStates[key]) btn.classList.add(knownStates[key]);
        }
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          handleKey(key);
        });
        rowEl.appendChild(btn);
      });
      keyboardEl.appendChild(rowEl);
    });
  }

  function handleKey(key) {
    if (gameOver) return;

    if (key === 'back') {
      currentGuess = currentGuess.slice(0, -1);
      renderBoard();
    } else if (key === 'enter') {
      if (currentGuess.length < WORD_LENGTH) {
        showToast('wordle_too_short');
        return;
      }
      submitGuess();
    } else if (/^[a-zA-Z]$/.test(key)) {
      if (currentGuess.length < WORD_LENGTH) {
        currentGuess += key.toLowerCase();
        renderBoard();
      }
    }
  }

  function submitGuess() {
    var lower = currentGuess.toLowerCase();

    var isInList = WORDS.some(function(w) {
      return w.toLowerCase() === lower;
    });

    if (!isInList) {
      showToast('wordle_not_in_list');
      return;
    }

    guesses.push(lower);
    currentGuess = '';
    renderBoard();
    renderKeyboard();
    updateGuessCount();

    var lastGuess = guesses[guesses.length - 1];
    if (lastGuess === targetWord) {
      gameOver = true;
      won = true;
      handleWin();
    } else if (guesses.length >= MAX_GUESSES) {
      gameOver = true;
      won = false;
      handleLoss();
    }
  }

  function handleWin() {
    var streak = parseInt(localStorage.getItem('tablo-wordle-streak') || '0') + 1;
    localStorage.setItem('tablo-wordle-streak', streak.toString());
    if (streakEl) streakEl.textContent = streak;

    var best = parseInt(localStorage.getItem('tablo-wordle-best-streak') || '0');
    if (streak > best) {
      localStorage.setItem('tablo-wordle-best-streak', streak.toString());
      if (bestEl) bestEl.textContent = streak;
    }

    if (winnerIcon) winnerIcon.textContent = '\uD83C\uDF89';
    if (winnerTitle) winnerTitle.textContent = tr('wordle_won');
    if (winnerMessage) winnerMessage.textContent = tr('wordle_guessed_in') + ' ' + guesses.length + ' ' + tr('wordle_tries');
    if (winnerAnswer) winnerAnswer.textContent = '';

    if (winnerModal) winnerModal.classList.add('visible');
  }

  function handleLoss() {
    localStorage.setItem('tablo-wordle-streak', '0');
    if (streakEl) streakEl.textContent = '0';

    if (winnerIcon) winnerIcon.textContent = '\uD83D\uDE22';
    if (winnerTitle) winnerTitle.textContent = tr('wordle_lost');
    if (winnerMessage) winnerMessage.textContent = '';
    if (winnerAnswer) winnerAnswer.textContent = tr('wordle_answer') + ': ' + targetWord.toUpperCase();

    if (winnerModal) winnerModal.classList.add('visible');
  }

  function handlePhysicalKey(e) {
    if (gameOver) return;
    var key = e.key;
    if (key === 'Enter') handleKey('enter');
    else if (key === 'Backspace') handleKey('back');
    else if (/^[a-zA-Z]$/.test(key)) handleKey(key.toLowerCase());
  }

  function initGame() {
    document.addEventListener('keydown', handlePhysicalKey);

    var best = localStorage.getItem('tablo-wordle-best-streak');
    if (bestEl) bestEl.textContent = best || '0';

    var streak = localStorage.getItem('tablo-wordle-streak');
    if (streakEl) streakEl.textContent = streak || '0';

    if (newWordBtn) {
      newWordBtn.addEventListener('click', function() {
        newGame();
        showToast('wordle_new_word_ready');
      });
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', newGame);
    }

    newGame();
  }

  window.initGame = initGame;
})();