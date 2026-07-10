// ============================================
// Tablo — Memory Match Game
// ============================================

(function() {
  'use strict';

  var CARD_EMOJIS = ['🎮', '🎲', '🃏', '🎯', '🎨', '🎭', '🎪', '⭐'];
  var GRID_SIZE = 4;
  var TOTAL_CARDS = GRID_SIZE * GRID_SIZE;
  
  var cards = [];
  var flippedCards = [];
  var matchedPairs = 0;
  var moves = 0;
  var timerInterval = null;
  var secondsElapsed = 0;
  var gameStarted = false;
  var isLocked = false;

  // DOM Elements
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

  // ========== TOAST ==========
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function() {
      toast.classList.remove('visible');
    }, 3000);
  }

  // ========== TIMER ==========
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

  // ========== GAME LOGIC ==========
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
    var emojis = shuffle(CARD_EMOJIS.slice(0, TOTAL_CARDS / 2));
    var cardValues = emojis.concat(emojis);
    return shuffle(cardValues);
  }

  function createCard(value, index) {
    var card = document.createElement('div');
    card.className = 'memory-card';
    card.dataset.index = index;
    card.dataset.value = value;
    
    var front = document.createElement('div');
    front.className = 'card-front';
    front.textContent = value;
    
    var back = document.createElement('div');
    back.className = 'card-back';
    back.innerHTML = '<i class="fa fa-question-circle"></i>';
    
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
    
    if (card1.dataset.value === card2.dataset.value) {
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
    
    // Show congrats modal
    finalMoves.textContent = moves;
    finalTime.textContent = formatTime(secondsElapsed);
    congratsModal.classList.add('visible');
    
    // Save best score
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
    var cardValues = generateCards();
    
    cardValues.forEach(function(value, index) {
      var card = createCard(value, index);
      gameBoard.appendChild(card);
    });
    
    // Hide congrats modal if visible
    congratsModal.classList.remove('visible');
  }

  // EXPOSE INIT GAME GLOBALLY
  window.initGame = function() {
    updateBestScore();
    resetGame();
  };

  // ========== EVENT LISTENERS ==========
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      resetGame();
      showToast('Game restarted');
    });
  }

  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', function() {
      congratsModal.classList.remove('visible');
      resetGame();
    });
  }

})();