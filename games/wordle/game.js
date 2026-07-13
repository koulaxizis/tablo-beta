// ============================================
// Tablo — Wordle (Multilingual word lists)
// ============================================

(function() {
  'use strict';

  var WORDS = {
    en: ['apple','beach','chair','dance','eagle','flame','globe','horse','input','jolly','knife','lemon','mango','night','ocean','piano','queen','river','sound','table','uncle','voice','water','youth','zebra','brave','cloud','dream','earth','fruit','ghost','happy','ivory','jewel','magic','noble','ocean','peace','quest','royal','smart','trust','unity','vivid','world','yacht','bloom','crisp','drive'],
    el: ['σπίτι','ζωή','νύχτα','γάλα','καλη','έρωτα','ηλία','τραγού','φωτιά','θάλασ','άνθρωπ','σχολει','βιβλίο','κόκκινο','φίλος','κάμερα','πόλη','πόρε','νερό','ουρανό','δέντρο','τούτα','σπόρο','ψυχή','φως','συννεφ','γιώργο','ωραίο','σπίτου','μύλο'],
    es: ['playa','gatos','libro','mesas','cantar','verde','agua','solis','lunas','rojas','blanc','negro','fuego','tierr','cielo','mares','flores','panes','villa','reloj','norte','sur','este','oeste','arbol','piedra','arroz','leche','tortuga','manos'],
    it: ['rosso','gatto','casa','libro','mare','sole','luna','stella','fiori','montagna','amore','pane','acqua','fuoco','bacio','sogno','notte','giorno','vita','donna','uomini','cuore','mente','voce','senza','vento','pioggia','tempi','lucci','scala'],
    fr: ['rouge','chatte','maison','livre','mer','soleil','lune','etoile','fleur','montagne','amour','pain','eau','feu','baiser','reve','nuit','jour','vie','femme','homme','coeur','esprit','voix','sans','vent','pluie','temps','lumiere','ecran'],
    de: ['haus','wasser','blume','berge','nacht','tag','liebe','brot','feuer','kuss','traum','herz','geist','stimme','ohne','wind','regen','zeit','licht','hund','katze','tisch','stuhl','buch','welt','kind','sonne','mond','stern','himmel']
  };

  var currentLang = 'en';
  var targetWord = '';
  var guesses = [];
  var currentGuess = '';
  var gameOver = false;
  var won = false;

  var boardEl = document.getElementById('wordle-board');
  var keyboardEl = document.getElementById('wordle-keyboard');
  var streakEl = document.getElementById('wordle-streak');
  var bestEl = document.getElementById('wordle-best-streak');
  var newWordBtn = document.getElementById('btn-new-word');
  var hintEl = document.getElementById('wordle-hint');
  var winnerModal = document.getElementById('winner-modal');
  var winnerTitle = document.getElementById('winner-title');
  var winnerStats = document.getElementById('winner-stats');
  var nextBtn = document.getElementById('btn-next');
  var toast = document.getElementById('toast');

  var MAX_GUESSES = 6;
  var WORD_LENGTH = 5;

  function tr(key) {
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[currentLang];
    return t ? (t[key] || key) : key;
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(function() { toast.classList.remove('visible'); }, 2000);
  }

  function getWords() {
    var lang = localStorage.getItem('tablo-language') || 'en';
    currentLang = lang;
    if (WORDS[lang] && WORDS[lang].length > 0) {
      var list = WORDS[lang].filter(function(w) { return w.length === WORD_LENGTH; });
      if (list.length > 0) return list;
    }
    return WORDS['en'];
  }

  function pickWord() {
    var wordList = getWords();
    var idx = Math.floor(Math.random() * wordList.length);
    return wordList[idx].toLowerCase();
  }

  function newGame() {
    targetWord = pickWord();
    guesses = [];
    currentGuess = '';
    gameOver = false;
    won = false;
    winnerModal.classList.remove('visible');
    renderBoard();
    renderKeyboard();
    if (hintEl) hintEl.textContent = tr('wordle_guesses') + ': 0/' + MAX_GUESSES;
  }

  function renderBoard() {
    if (!boardEl) return;
    boardEl.innerHTML = '';
    for (var r = 0; r < MAX_GUESSES; r++) {
      var row = document.createElement('div');
      row.className = 'wordle-row';
      for (var c = 0; c < WORD_LENGTH; c++) {
        var cell = document.createElement('div');
        cell.className = 'wordle-cell';
        if (guesses[r]) {
          cell.textContent = guesses[r][c] || '';
          var evalResult = evaluateGuess(guesses[r]);
          if (evalResult[c] === 'correct') cell.classList.add('correct');
          else if (evalResult[c] === 'present') cell.classList.add('present');
          else cell.classList.add('absent');
        } else if (r === guesses.length && currentGuess[c]) {
          cell.textContent = currentGuess[c];
        }
      }
      row.appendChild(cell);
    }
    // Fix: append rows properly
    var existingRows = boardEl.querySelectorAll('.wordle-row');
    if (existingRows.length === 0) {
      for (var r2 = 0; r2 < MAX_GUESSES; r2++) {
        boardEl.appendChild(document.createElement('div'));
      }
    }
    // Clear and rebuild
    boardEl.innerHTML = '';
    for (var r3 = 0; r3 < MAX_GUESSES; r3++) {
      var rowEl = document.createElement('div');
      rowEl.className = 'wordle-row';
      for (var c3 = 0; c3 < WORD_LENGTH; c3++) {
        var cellEl = document.createElement('div');
        cellEl.className = 'wordle-cell';
        if (guesses[r3]) {
          cellEl.textContent = (guesses[r3][c3] || '').toUpperCase();
          var evalR = evaluateGuess(guesses[r3]);
          if (evalR[c3] === 'correct') cellEl.classList.add('correct');
          else if (evalR[c3] === 'present') cellEl.classList.add('present');
          else cellEl.classList.add('absent');
          cellEl.classList.add('revealed');
        } else if (r3 === guesses.length && c3 < currentGuess.length) {
          cellEl.textContent = currentGuess[c3].toUpperCase();
          cellEl.classList.add('filled');
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
        btn.addEventListener('click', function() {
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
        showToast(tr('wordle_short'));
        return;
      }
      submitGuess();
    } else if (/^[a-z\u03B1-\u03C9]$/i.test(key)) {
      if (currentGuess.length < WORD_LENGTH) {
        currentGuess += key.toLowerCase();
        renderBoard();
      }
    }
  }

  function submitGuess() {
    var wordList = getWords();
    var isInList = wordList.some(function(w) { return w === currentGuess; });
    
    // Allow if in list OR if it matches target (for safety)
    if (!isInList && currentGuess !== targetWord) {
      showToast(tr('wordle_invalid'));
      return;
    }

    guesses.push(currentGuess);
    currentGuess = '';
    renderBoard();
    renderKeyboard();
    if (hintEl) hintEl.textContent = tr('wordle_guesses') + ': ' + guesses.length + '/' + MAX_GUESSES;

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

    winnerTitle.textContent = tr('wordle_won');
    winnerStats.textContent = tr('wordle_guessed_in') + ' ' + guesses.length + ' ' + tr('wordle_tries');
    winnerModal.classList.add('visible');
  }

  function handleLoss() {
    var streak = 0;
    localStorage.setItem('tablo-wordle-streak', '0');
    if (streakEl) streakEl.textContent = '0';

    winnerTitle.textContent = tr('wordle_lost');
    winnerStats.textContent = tr('wordle_answer') + ': ' + targetWord.toUpperCase();
    winnerModal.classList.add('visible');
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
        showToast(tr('wordle_new_word_ready'));
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', newGame);
    }

    newGame();
  }

  window.initGame = initGame;
})();