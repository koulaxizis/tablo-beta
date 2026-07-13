// ============================================
// Tablo — Whack-a-Mole
// ============================================

(function() {
  'use strict';

  var NUM_HOLES = 9;
  var GAME_DURATION = 30;
  var score = 0;
  var bestScore = 0;
  var timeLeft = GAME_DURATION;
  var gameRunning = false;
  var moleTimers = [];
  var countdownInterval = null;
  var spawnTimeout = null;
  var currentMoleHole = -1;

  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best-score');
  var timeEl = document.getElementById('time-left');
  var startBtn = document.getElementById('btn-start');
  var retryBtn = document.getElementById('btn-retry');
  var gameOverModal = document.getElementById('game-over-modal');
  var finalScoreEl = document.getElementById('final-score');
  var toast = document.getElementById('toast');
  var holes = document.querySelectorAll('.mole-hole');

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

  function showMole() {
    if (!gameRunning) return;
    // Hide current mole
    if (currentMoleHole >= 0) {
      var oldMole = document.getElementById('mole-' + currentMoleHole);
      if (oldMole) oldMole.classList.remove('up');
    }

    // Pick random hole
    var hole;
    do {
      hole = Math.floor(Math.random() * NUM_HOLES);
    } while (hole === currentMoleHole);
    currentMoleHole = hole;

    var mole = document.getElementById('mole-' + hole);
    if (mole) mole.classList.add('up');

    // Duration mole stays up decreases as game progresses
    var elapsed = GAME_DURATION - timeLeft;
    var duration = 1200 - (elapsed * 25);
    if (duration < 600) duration = 600;

    spawnTimeout = setTimeout(function() {
      if (currentMoleHole === hole) {
        if (mole) mole.classList.remove('up');
        currentMoleHole = -1;
      }
      showMole();
    }, duration);
  }

  function whackMole(holeIdx) {
    if (!gameRunning) return;
    if (holeIdx !== currentMoleHole) return;

    var mole = document.getElementById('mole-' + holeIdx);
    if (mole) {
      mole.classList.remove('up');
      mole.classList.add('hit');
      setTimeout(function() { mole.classList.remove('hit'); }, 300);
    }

    score++;
    scoreEl.textContent = score;
    currentMoleHole = -1;

    // Spawn next mole quickly
    clearTimeout(spawnTimeout);
    setTimeout(showMole, 300);
  }

  function startGame() {
    score = 0;
    timeLeft = GAME_DURATION;
    gameRunning = true;
    scoreEl.textContent = '0';
    timeEl.textContent = GAME_DURATION;
    startBtn.disabled = true;
    startBtn.style.opacity = '0.4';

    countdownInterval = setInterval(function() {
      timeLeft--;
      timeEl.textContent = timeLeft;
      if (timeLeft <= 5) {
        timeEl.style.color = '#f87171';
      } else {
        timeEl.style.color = '';
      }
      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);

    setTimeout(showMole, 500);
  }

  function endGame() {
    gameRunning = false;
    clearInterval(countdownInterval);
    clearTimeout(spawnTimeout);

    // Hide all moles
    for (var i = 0; i < NUM_HOLES; i++) {
      var m = document.getElementById('mole-' + i);
      if (m) m.classList.remove('up');
    }

    if (score > bestScore) {
      bestScore = score;
      bestEl.textContent = bestScore;
      localStorage.setItem('tablo-whack-best', bestScore.toString());
      showToast(tr('simon_you_scored') + ' ' + score + ' — ' + tr('simon_best') + '!');
    } else {
      showToast(tr('simon_you_scored') + ' ' + score);
    }

    finalScoreEl.textContent = tr('whack_score') + ': ' + score;
    gameOverModal.classList.add('visible');

    startBtn.disabled = false;
    startBtn.style.opacity = '1';
    timeEl.style.color = '';
  }

  function resetGame() {
    gameOverModal.classList.remove('visible');
    startGame();
  }

  function initGame() {
    var saved = localStorage.getItem('tablo-whack-best');
    if (saved) {
      bestScore = parseInt(saved) || 0;
      bestEl.textContent = bestScore;
    }

    holes.forEach(function(hole) {
      hole.addEventListener('click', function() {
        whackMole(parseInt(hole.dataset.hole));
      });
      hole.addEventListener('touchstart', function(e) {
        e.preventDefault();
        whackMole(parseInt(hole.dataset.hole));
      });
    });

    if (startBtn) {
      startBtn.addEventListener('click', startGame);
    }
    if (retryBtn) {
      retryBtn.addEventListener('click', resetGame);
    }
  }

  window.initGame = initGame;
})();