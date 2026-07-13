// ============================================
// Tablo — Wordle Clone
// ============================================

(function() {
  'use strict';

  var MAX_GUESSES = 6;
  var WORD_LENGTH = 5;
  var currentGuess = '';
  var guesses = [];
  var currentRow = 0;
  var targetWord = '';
  var gameOver = false;
  var streak = 0;
  var bestStreak = 0;
  var keyboardState = {};

  // Common 5-letter English words (answer pool)
  var WORDS = [
    'about','above','abuse','actor','acute','admit','adopt','adult','after','again',
    'agent','agree','ahead','alarm','album','alert','alike','alive','allow','alone',
    'along','alter','among','anger','angle','angry','apart','apple','apply','arena',
    'argue','arise','array','aside','asset','avoid','award','aware','badly','baker',
    'bases','basic','basis','beach','began','begin','begun','being','below','bench',
    'billy','birth','black','blame','blind','block','blood','board','boost','booth',
    'bound','brain','brand','bread','break','breed','brief','bring','broad','broke',
    'brown','build','built','buyer','cable','calif','carry','catch','cause','chain',
    'chair','chart','chase','cheap','check','chest','chief','child','china','chose',
    'civil','claim','class','clean','clear','click','clock','close','coach','coast',
    'could','count','court','cover','craft','crash','cream','crime','cross','crowd',
    'crown','curve','cycle','daily','dance','dated','dealt','death','debut','delay',
    'depth','doing','doubt','dozen','draft','drama','drawn','dream','dress','drill',
    'drink','drive','drove','dying','eager','early','earth','eight','elite','empty',
    'enemy','enjoy','enter','entry','equal','error','event','every','exact','exist',
    'extra','faith','false','fault','fiber','field','fifth','fifty','fight','final',
    'first','fixed','flash','fleet','floor','fluid','focus','force','forth','forty',
    'forum','found','frame','frank','fraud','fresh','front','fruit','fully','funny',
    'giant','given','glass','globe','going','grace','grade','grand','grant','grass',
    'great','green','gross','group','grown','guard','guess','guest','guide','happy',
    'harry','heart','heavy','hence','henry','horse','hotel','house','human','ideal',
    'image','index','inner','input','issue','japan','jimmy','joint','jones','judge',
    'known','label','large','laser','later','laugh','layer','learn','lease','least',
    'leave','legal','level','lewis','light','limit','links','lives','local','logic',
    'loose','lower','lucky','lunch','lying','magic','major','maker','march','maria',
    'match','maybe','mayor','meant','media','metal','might','minor','minus','mixed',
    'model','money','month','moral','motor','mount','mouse','mouth','moved','movie',
    'music','needs','never','newly','night','noise','north','noted','novel','nurse',
    'occur','ocean','offer','often','order','other','ought','paint','panel','paper',
    'party','peace','peter','phase','phone','photo','piece','pilot','pitch','place',
    'plain','plane','plant','plate','point','pound','power','press','price','pride',
    'prime','print','prior','prize','proof','proud','prove','queen','quick','quiet',
    'quite','radio','raise','range','rapid','ratio','reach','ready','refer','right',
    'rival','river','robin','roger','roman','rough','round','route','royal','rural',
    'scale','scene','scope','score','sense','serve','seven','shall','shape','share',
    'sharp','sheet','shelf','shell','shift','shirt','shock','shoot','short','shown',
    'sight','since','sixth','sixty','sized','skill','sleep','slide','small','smart',
    'smile','smith','smoke','solid','solve','sorry','sound','south','space','spare',
    'speak','speed','spend','spent','split','spoke','sport','staff','stage','stake',
    'stand','start','state','steam','steel','stick','still','stock','stone','stood',
    'store','storm','story','strip','stuck','study','stuff','style','sugar','suite',
    'super','sweet','table','taken','taste','taxes','teach','teeth','terry','texas',
    'thank','theft','their','theme','there','these','thick','thing','think','third',
    'those','three','threw','throw','tight','times','tired','title','today','topic',
    'total','touch','tough','tower','track','trade','train','treat','trend','trial',
    'tried','tries','truck','truly','trust','truth','twice','under','undue','union',
    'unity','until','upper','upset','urban','usage','usual','valid','value','video',
    'virus','visit','vital','voice','waste','watch','water','wheel','where','which',
    'while','white','whole','whose','woman','women','world','worry','worse','worst',
    'worth','would','wound','write','wrong','wrote','yield','young','youth'
  ];

  var KEYBOARD_LAYOUT = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','BACK']
  ];

  var boardEl = document.getElementById('board');
  var keyboardEl = document.getElementById('keyboard');
  var guessCountEl = document.getElementById('guess-count');
  var streakEl = document.getElementById('streak');
  var bestStreakEl = document.getElementById('best-streak');
  var newGameBtn = document.getElementById('btn-new-game');
  var retryBtn = document.getElementById('btn-retry');
  var gameOverModal = document.getElementById('game-over-modal');
  var modalIcon = document.getElementById('modal-icon');
  var modalTitle = document.getElementById('modal-title');
  var modalMessage = document.getElementById('modal-message');
  var modalAnswer = document.getElementById('modal-answer');
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

  function pickWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)].toUpperCase();
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    for (var r = 0; r < MAX_GUESSES; r++) {
      var row = document.createElement('div');
      row.className = 'wordle-row';
      for (var c = 0; c < WORD_LENGTH; c++) {
        var cell = document.createElement('div');
        cell.className = 'wordle-cell';
        if (guesses[r]) {
          cell.textContent = guesses[r][c] || '';
          evaluateCell(cell, guesses[r], c);
        } else if (r === currentRow && currentGuess[c]) {
          cell.textContent = currentGuess[c];
        }
        row.appendChild(cell);
      }
      boardEl.appendChild(row);
    }
  }

  function evaluateCell(cell, guess, index) {
    var letter = guess[index];
    if (targetWord[index] === letter) {
      cell.classList.add('correct');
    } else if (targetWord.indexOf(letter) !== -1) {
      cell.classList.add('present');
    } else {
      cell.classList.add('absent');
    }
  }

  function renderKeyboard() {
    keyboardEl.innerHTML = '';
    KEYBOARD_LAYOUT.forEach(function(row) {
      var rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      row.forEach(function(key) {
        var btn = document.createElement('button');
        btn.className = 'kb-key';
        if (key === 'ENTER') {
          btn.classList.add('kb-enter');
          btn.textContent = 'Enter';
        } else if (key === 'BACK') {
          btn.classList.add('kb-back');
          btn.innerHTML = '&#9003;';
        } else {
          btn.textContent = key;
        }
        if (keyboardState[key]) {
          btn.classList.add(keyboardState[key]);
        }
        btn.addEventListener('click', function() {
          handleKeyInput(key);
        });
        rowEl.appendChild(btn);
      });
      keyboardEl.appendChild(rowEl);
    });
  }

  function updateKeyboardState(guess) {
    for (var i = 0; i < guess.length; i++) {
      var letter = guess[i];
      if (targetWord[i] === letter) {
        keyboardState[letter] = 'correct';
      } else if (targetWord.indexOf(letter) !== -1 && keyboardState[letter] !== 'correct') {
        keyboardState[letter] = 'present';
      } else if (!keyboardState[letter]) {
        keyboardState[letter] = 'absent';
      }
    }
    renderKeyboard();
  }

  function handleKeyInput(key) {
    if (gameOver) return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACK') {
      currentGuess = currentGuess.slice(0, -1);
      renderBoard();
    } else if (currentGuess.length < WORD_LENGTH && /^[A-Z]$/.test(key)) {
      currentGuess += key;
      renderBoard();
    }
  }

  function submitGuess() {
    if (currentGuess.length !== WORD_LENGTH) {
      showToast(tr('wordle_short'));
      shakeRow(currentRow);
      return;
    }

    var isValid = WORDS.some(function(w) { return w.toUpperCase() === currentGuess; });
    if (!isValid) {
      showToast(tr('wordle_invalid'));
      shakeRow(currentRow);
      return;
    }

    guesses[currentRow] = currentGuess;
    updateKeyboardState(currentGuess);
    guessCountEl.textContent = (currentRow + 1) + '/' + MAX_GUESSES;

    if (currentGuess === targetWord) {
      gameOver = true;
      streak++;
      if (streak > bestStreak) {
        bestStreak = streak;
        localStorage.setItem('tablo-wordle-best-streak', bestStreak.toString());
      }
      localStorage.setItem('tablo-wordle-streak', streak.toString());
      streakEl.textContent = streak;
      bestStreakEl.textContent = bestStreak;
      renderBoard();
      setTimeout(function() {
        modalIcon.textContent = '\uD83C\uDF89';
        modalTitle.textContent = tr('wordle_won');
        modalMessage.textContent = tr('wordle_guessed_in') + ' ' + (currentRow + 1) + ' ' + tr('wordle_tries');
        modalAnswer.textContent = '';
        gameOverModal.classList.add('visible');
      }, 300);
      return;
    }

    currentRow++;
    currentGuess = '';

    if (currentRow >= MAX_GUESSES) {
      gameOver = true;
      streak = 0;
      localStorage.setItem('tablo-wordle-streak', '0');
      streakEl.textContent = '0';
      renderBoard();
      setTimeout(function() {
        modalIcon.textContent = '\uD83D\uDE22';
        modalTitle.textContent = tr('wordle_lost');
        modalMessage.textContent = '';
        modalAnswer.textContent = tr('wordle_answer') + ': ' + targetWord;
        gameOverModal.classList.add('visible');
      }, 300);
    } else {
      guessCountEl.textContent = currentRow + '/' + MAX_GUESSES;
      renderBoard();
    }
  }

  function shakeRow(rowIndex) {
    var rows = boardEl.querySelectorAll('.wordle-row');
    if (rows[rowIndex]) {
      rows[rowIndex].classList.add('shake');
      setTimeout(function() { rows[rowIndex].classList.remove('shake'); }, 500);
    }
  }

  function handlePhysicalKey(e) {
    var key = e.key.toUpperCase();
    if (key === 'ENTER') {
      handleKeyInput('ENTER');
      e.preventDefault();
    } else if (key === 'BACKSPACE') {
      handleKeyInput('BACK');
      e.preventDefault();
    } else if (/^[A-Z]$/.test(key)) {
      handleKeyInput(key);
    }
  }

  function newGame() {
    currentGuess = '';
    guesses = [];
    currentRow = 0;
    gameOver = false;
    keyboardState = {};
    targetWord = pickWord();
    guessCountEl.textContent = '0/' + MAX_GUESSES;
    gameOverModal.classList.remove('visible');
    renderBoard();
    renderKeyboard();
  }

  function initGame() {
    var savedStreak = localStorage.getItem('tablo-wordle-streak');
    var savedBest = localStorage.getItem('tablo-wordle-best-streak');
    if (savedStreak) { streak = parseInt(savedStreak) || 0; streakEl.textContent = streak; }
    if (savedBest) { bestStreak = parseInt(savedBest) || 0; bestStreakEl.textContent = bestStreak; }

    document.addEventListener('keydown', handlePhysicalKey);

    if (newGameBtn) {
      newGameBtn.addEventListener('click', function() {
        newGame();
        showToast(tr('wordle_new_word_ready'));
      });
    }
    if (retryBtn) {
      retryBtn.addEventListener('click', newGame);
    }

    newGame();
  }

  window.initGame = initGame;
})();