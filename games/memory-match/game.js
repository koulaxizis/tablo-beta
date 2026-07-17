// ============================================
// Tablo — Memory Match Game
// ============================================

(function() {
  'use strict';

  var CARD_SYMBOLS = [
    { char: '\u2605', color: '#ff6b6b' },
    { char: '\u25C6', color: '#4ecdc4' },
    { char: '\u25CF', color: '#ffe66d' },
    { char: '\u25B2', color: '#a8e6cf' },
    { char: '\u25A0', color: '#c9b1ff' },
    { char: '\u2665', color: '#ff8e8e' },
    { char: '\u2660', color: '#95e1d3' },
    { char: '\u2663', color: '#fce38a' }
  ];
  var GRID_SIZE = 4;
  var TOTAL_CARDS = GRID_SIZE * GRID_SIZE;

  var flippedCards = [];
  var matchedPairs = 0;
  var moves = 0;
  var timerInterval = null;
  var secondsElapsed = 0;
  var gameStarted = false;
  var isLocked = false;

  var gameBoard = document.getElementById('game-board');
  var movesDisplay = document.getElementById('moves');
  var timerDisplay = document.getElementById('timer');
  var bestScoreDisplay = document.getElementById('best-score');
  var restartBtn = document.getElementById('btn-restart');
  var congratsModal = document.getElementById('congrats-modal');
  var playAgainBtn = document.getElementById('btn-play-again');
  var finalMoves = document.getElementById('final-moves');
  var finalTime = document.getElementById('final-time');
  var toast = document.getElementById('toast');

  if (!gameBoard || !movesDisplay || !timerDisplay || 
      !bestScoreDisplay || !restartBtn || !congratsModal || 
      !playAgainBtn || !finalMoves || !finalTime || !toast) {
    console.error('[Memory Match] Required DOM elements not found!');
    return;
  }

  // =====================================================
  // CRITICAL: Move modal to HTML level (NOT BODY)
  // This ensures it CANNOT affect body's flex layout
  // We use appendChild (move, not clone) to preserve event listeners
  // =====================================================
  var portal = document.createElement('div');
  portal.id = 'modal-portal';
  portal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:20000;pointer-events:none;';
  document.documentElement.appendChild(portal);
  portal.appendChild(congratsModal);

  function tr(key) {
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
    if (t && t[key]) return t[key];
    return key;
  }

  function showToast(key) {
    if (!toast) return;
    toast.textContent = tr(key);
    toast.classList.add('visible');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function() {
      toast.classList.remove('visible');
    }, 3000);
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    secondsElapsed = 0;
    updateTimerDisplay();
    timerInterval = setInterval(function() {
      secondsElapsed++;
      updateTimerDisplay();
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateTimerDisplay() {
    var mins = Math.floor(secondsElapsed / 60);
    var secs = secondsElapsed % 60;
    timerDisplay.textContent =
      String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function formatTime(totalSeconds) {
    var mins = Math.floor(totalSeconds / 60);
    var secs = totalSeconds % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function shuffle(array) {
    var arr = array.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }

  function generateCards() {
    var symbols = shuffle(CARD_SYMBOLS.slice(0, TOTAL_CARDS / 2));
    var cardData = symbols.concat(symbols);
    return shuffle(cardData);
  }

  function createCard(data, index) {
    var card = document.createElement('div');
    card.className = 'memory-card';
    card.dataset.index = index;
    card.dataset.value = index;

    var front = document.createElement('div');
    front.className = 'card-front';
    front.textContent = data.char;
    front.style.color = data.color;

    var back = document.createElement('div');
    back.className = 'card-back';
    back.innerHTML = '<svg viewBox="0 0 24 24" width="48" height="48"><text x="12" y="18" text-anchor="middle" font-size="20" font-weight="bold" fill="#ffffff" font-family="Nunito, sans-serif">?</text></svg>';

    card.appendChild(front);
    card.appendChild(back);

    card.addEventListener('click', function() {
      handleCardClick(card);
    });

    return card;
  }

  function handleCardClick(card) {
    if (isLocked) return;
    if (card.classList.contains('flipped')) return;
    if (card.classList.contains('matched')) return;

    if (!gameStarted) {
      gameStarted = true;
      startTimer();
    }

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
      moves++;
      movesDisplay.textContent = moves;
      checkForMatch();
    }
  }

  function checkForMatch() {
    isLocked = true;
    var card1 = flippedCards[0];
    var card2 = flippedCards[1];

    var front1 = card1.querySelector('.card-front');
    var front2 = card2.querySelector('.card-front');

    if (front1.style.color === front2.style.color &&
        front1.textContent === front2.textContent) {
      card1.classList.add('matched');
      card2.classList.add('matched');
      matchedPairs++;
      flippedCards = [];
      isLocked = false;

      if (matchedPairs === TOTAL_CARDS / 2) {
        gameWon();
      }
    } else {
      setTimeout(function() {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        flippedCards = [];
        isLocked = false;
      }, 800);
    }
  }

  function gameWon() {
    stopTimer();

    finalMoves.textContent = moves;
    finalTime.textContent = formatTime(secondsElapsed);
    congratsModal.classList.add('visible');

    var bestKey = 'tablo-memory-best';
    var currentBest = localStorage.getItem(bestKey);
    if (!currentBest ||
        (secondsElapsed < parseInt(currentBest.split('/')[0]) ||
         (secondsElapsed === parseInt(currentBest.split('/')[0]) && moves < parseInt(currentBest.split('/')[1])))) {
      localStorage.setItem(bestKey, secondsElapsed + '/' + moves);
      updateBestScore();
    }
  }

  function updateBestScore() {
    var bestKey = 'tablo-memory-best';
    var currentBest = localStorage.getItem(bestKey);
    if (currentBest) {
      var parts = currentBest.split('/');
      bestScoreDisplay.textContent = formatTime(parseInt(parts[0])) + ' / ' + parts[1];
    }
  }

  function resetGame() {
    stopTimer();
    gameStarted = false;
    moves = 0;
    matchedPairs = 0;
    secondsElapsed = 0;
    flippedCards = [];
    isLocked = false;

    movesDisplay.textContent = '0';
    timerDisplay.textContent = '00:00';

    gameBoard.innerHTML = '';
    var cardData = generateCards();

    cardData.forEach(function(data, index) {
      var card = createCard(data, index);
      gameBoard.appendChild(card);
    });

    congratsModal.classList.remove('visible');
  }

  window.initGame = function() {
    updateBestScore();
    resetGame();
  };

  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      resetGame();
      showToast('toast_restarted');
    });
  }

  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', function() {
      resetGame();
    });
  }

})();