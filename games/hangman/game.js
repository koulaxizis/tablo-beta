// ============================================
// Tablo — Hangman
// ============================================

(function() {
  'use strict';

  console.log('[Hangman] game.js loaded');

  var WORDS = [
    { word: 'PYTHON', category: 'Programming' },
    { word: 'JAVASCRIPT', category: 'Programming' },
    { word: 'COMPUTER', category: 'Technology' },
    { word: 'KEYBOARD', category: 'Technology' },
    { word: 'MONITOR', category: 'Technology' },
    { word: 'MOUSE', category: 'Technology' },
    { word: 'GUITAR', category: 'Music' },
    { word: 'PIANO', category: 'Music' },
    { word: 'DRUMS', category: 'Music' },
    { word: 'VIOLIN', category: 'Music' },
    { word: 'MOUNTAIN', category: 'Nature' },
    { word: 'OCEAN', category: 'Nature' },
    { word: 'FOREST', category: 'Nature' },
    { word: 'DESERT', category: 'Nature' },
    { word: 'FOOTBALL', category: 'Sports' },
    { word: 'BASKETBALL', category: 'Sports' },
    { word: 'TENNIS', category: 'Sports' },
    { word: 'SWIMMING', category: 'Sports' },
    { word: 'APPLE', category: 'Food' },
    { word: 'BANANA', category: 'Food' },
    { word: 'ORANGE', category: 'Food' },
    { word: 'PASTA', category: 'Food' },
    { word: 'PIZZA', category: 'Food' },
    { word: 'ELEPHANT', category: 'Animals' },
    { word: 'GIRAFFE', category: 'Animals' },
    { word: 'TIGER', category: 'Animals' },
    { word: 'LEOPARD', category: 'Animals' },
    { word: 'TABLO', category: 'Games' },
    { word: 'PUZZLE', category: 'Games' },
    { word: 'MEMORY', category: 'Games' }
  ];

  var MAX_LIVES = 6;
  var currentWord = '';
  var currentCategory = '';
  var guessedLetters = [];
  var wrongGuesses = 0;
  var wordsWon = 0;
  var gameActive = false;

  var wordEl, categoryEl, livesEl, wordsEl;
  var keyboardEl, drawingParts;
  var newWordBtn, hintBtn, playAgainBtn;
  var winnerModal, winnerIcon, winnerTitle, winnerMessage, winnerButtons;
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

  function pickRandomWord() {
    var idx = Math.floor(Math.random() * WORDS.length);
    currentWord = WORDS[idx].word;
    currentCategory = WORDS[idx].category;
    console.log('[Hangman] New word:', currentWord, 'Category:', currentCategory);
  }

  function resetGame() {
    guessedLetters = [];
    wrongGuesses = 0;
    gameActive = true;
    pickRandomWord();

    // Reset drawing parts
    drawingParts.forEach(function(part) {
      part.classList.remove('drawn');
    });

    renderWord();
    renderKeyboard();
    updateStats();
    if (categoryEl) categoryEl.textContent = tr('hangman_category') + ': ' + currentCategory;
  }

  function renderWord() {
    if (!wordEl) return;
    wordEl.innerHTML = '';

    for (var i = 0; i < currentWord.length; i++) {
      var letter = currentWord[i];
      var letterEl = document.createElement('div');
      letterEl.className = 'hm-letter';

      if (guessedLetters.includes(letter)) {
        letterEl.textContent = letter;
        letterEl.classList.add('revealed');
      } else {
        letterEl.classList.add('empty');
      }

      wordEl.appendChild(letterEl);
    }
  }

  function renderKeyboard() {
    if (!keyboardEl) return;
    keyboardEl.innerHTML = '';

    var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    alphabet.forEach(function(char) {
      var btn = document.createElement('button');
      btn.className = 'hm-key-btn';
      btn.textContent = char;
      btn.dataset.letter = char;

      if (guessedLetters.includes(char)) {
        if (currentWord.includes(char)) {
          btn.classList.add('guessed-correct');
        } else {
          btn.classList.add('guessed-wrong');
        }
        btn.disabled = true;
      }

      btn.addEventListener('click', function() {
        guessLetter(char);
      });

      keyboardEl.appendChild(btn);
    });
  }

  function guessLetter(letter) {
    if (!gameActive || guessedLetters.includes(letter)) return;

    guessedLetters.push(letter);

    if (currentWord.includes(letter)) {
      console.log('[Hangman] Correct guess:', letter);
      renderWord();
      renderKeyboard();
      checkWin();
    } else {
      console.log('[Hangman] Wrong guess:', letter);
      wrongGuesses++;
      drawPart(wrongGuesses);
      renderKeyboard();
      updateStats();
      checkLoss();
    }
  }

  function drawPart(partNum) {
    if (partNum >= 1 && partNum <= drawingParts.length) {
      var part = drawingParts[partNum - 1];
      if (part) {
        setTimeout(function() {
          part.classList.add('drawn');
        }, 50);
      }
    }
  }

  function checkWin() {
    var allGuessed = true;
    for (var i = 0; i < currentWord.length; i++) {
      if (!guessedLetters.includes(currentWord[i])) {
        allGuessed = false;
        break;
      }
    }

    if (allGuessed) {
      gameActive = false;
      wordsWon++;
      localStorage.setItem('hangman-words', wordsWon.toString());
      showWinner(true);
    }
  }

  function checkLoss() {
    if (wrongGuesses >= MAX_LIVES) {
      gameActive = false;
      revealWord();
      showWinner(false);
    }
  }

  function revealWord() {
    // Reveal all letters in word display
    var letters = document.querySelectorAll('.hm-letter');
    letters.forEach(function(el, idx) {
      el.textContent = currentWord[idx];
      el.classList.add('revealed');
    });
  }

  function useHint() {
    if (!gameActive) return;

    // Find unguessed letter in word
    var unguessed = [];
    for (var i = 0; i < currentWord.length; i++) {
      if (!guessedLetters.includes(currentWord[i])) {
        unguessed.push(currentWord[i]);
      }
    }

    if (unguessed.length === 0) return;

    var hintLetter = unguessed[Math.floor(Math.random() * unguessed.length)];
    wrongGuesses--; // Pay 1 life cost
    guessedLetters.push(hintLetter);

    drawPart(wrongGuesses); // Remove one drawing part
    renderWord();
    renderKeyboard();
    updateStats();
    showToast('hangman_hint_used');
  }

  function updateStats() {
    if (livesEl) livesEl.textContent = (MAX_LIVES - wrongGuesses);
    if (wordsEl) wordsEl.textContent = wordsWon;
  }

  function showWinner(won) {
    if (winnerIcon) winnerIcon.textContent = won ? '\u{1F389}' : '\u{1F4AD}';
    if (winnerTitle) {
      winnerTitle.textContent = won ? tr('hangman_victory') : tr('hangman_defeat');
    }
    if (winnerMessage) {
      winnerMessage.textContent = won
        ? tr('hangman_you_guessed') + ' "' + currentWord + '"!'
        : tr('hangman_the_word_was') + ' "' + currentWord + '"';
    }

    if (playAgainBtn) {
      playAgainBtn.onclick = function() {
        if (winnerModal) {
          winnerModal.classList.remove('visible');
          winnerModal.style.display = 'none';
        }
        resetGame();
      };
    }

    if (winnerModal) {
      winnerModal.classList.add('visible');
      winnerModal.style.display = 'flex';
    }
  }

  function initGame() {
    console.log('[Hangman] initGame() called');

    wordEl = document.getElementById('hm-word');
    categoryEl = document.getElementById('hm-category');
    livesEl = document.getElementById('lives-count');
    wordsEl = document.getElementById('words-count');
    keyboardEl = document.getElementById('hm-keyboard');
    newWordBtn = document.getElementById('btn-new-word');
    hintBtn = document.getElementById('btn-hint');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    winnerButtons = document.getElementById('winner-buttons');
    playAgainBtn = document.getElementById('btn-play-again');
    toast = document.getElementById('toast');

    drawingParts = document.querySelectorAll('#hm-drawing line, #hm-drawing circle');

    console.log('[Hangman] Elements:', {
      wordEl: !!wordEl,
      keyboardEl: !!keyboardEl,
      drawingParts: drawingParts.length
    });

    var savedWords = localStorage.getItem('hangman-words');
    if (savedWords) wordsWon = parseInt(savedWords);

    if (newWordBtn) newWordBtn.addEventListener('click', resetGame);
    if (hintBtn) hintBtn.addEventListener('click', useHint);

    resetGame();
    console.log('[Hangman] Init complete');
  }

  window.initGame = initGame;
})();