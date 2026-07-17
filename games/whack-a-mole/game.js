// ============================================
// Tablo — Whack-a-Mole
// ============================================

(function() {
  'use strict';

  var MOLE_EMOJI = '\uD83D\uDC39';
  var HIT_EMOJI  = '\uD83D\uDCA5';

  var score = 0;
  var timeLeft = 30;
  var gameActive = false;
  var timerInterval = null;
  var moleInterval = null;
  var currentMoleHole = null;
  var moles = [];

  var scoreEl = document.getElementById('score');
  var bestEl  = document.getElementById('best-score');
  var timeEl  = document.getElementById('time-left');
  var startBtn = document.getElementById('btn-start');
  var retryBtn = document.getElementById('btn-retry');
  var gameOverModal = document.getElementById('game-over-modal');
  var finalScoreEl = document.getElementById('final-score');
  var finalBestEl  = document.getElementById('final-best');
  var toast = document.getElementById('toast');

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

  function hideAllMoles() {
    moles.forEach(function(mole) {
      if (mole) {
        mole.classList.remove('up');
        mole.classList.remove('hit');
        mole.textContent = '';
      }
    });
  }

  function showMole() {
    if (!gameActive) return;

    hideAllMoles();

    var newHole = Math.floor(Math.random() * moles.length);
    while (newHole === currentMoleHole && moles.length > 1) {
      newHole = Math.floor(Math.random() * moles.length);
    }
    currentMoleHole = newHole;

    if (moles[newHole]) {
      moles[newHole].textContent = MOLE_EMOJI;
      moles[newHole].classList.add('up');
    }
  }

  function whackMole(index) {
    if (!gameActive) return;
    if (index !== currentMoleHole) return;

    score++;
    if (scoreEl) scoreEl.textContent = score;

    if (moles[index]) {
      moles[index].classList.add('hit');
      moles[index].textContent = HIT_EMOJI;
    }

    currentMoleHole = null;

    setTimeout(function() {
      if (moles[index]) {
        moles[index].classList.remove('up');
        moles[index].classList.remove('hit');
        moles[index].textContent = '';
      }
    }, 300);
  }

  function startGame() {
    score = 0;
    timeLeft = 30;
    gameActive = true;

    if (scoreEl) scoreEl.textContent = '0';
    if (timeEl) timeEl.textContent = '30';
    if (startBtn) startBtn.disabled = true;
    if (gameOverModal) gameOverModal.classList.remove('visible');

    hideAllMoles();
    showMole();
    moleInterval = setInterval(showMole, 850);

    timerInterval = setInterval(function() {
      timeLeft--;
      if (timeEl) timeEl.textContent = timeLeft;
      if (timeLeft <= 0) endGame();
    }, 1000);
  }

  function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    clearInterval(moleInterval);
    hideAllMoles();

    var best = localStorage.getItem('tablo-wam-best');
    if (!best || score > parseInt(best)) {
      localStorage.setItem('tablo-wam-best', score.toString());
      if (bestEl) bestEl.textContent = score;
    }

    var savedBest = localStorage.getItem('tablo-wam-best') || '0';
    if (finalScoreEl) finalScoreEl.textContent = score;
    if (finalBestEl) finalBestEl.textContent = savedBest;

    if (gameOverModal) gameOverModal.classList.add('visible');
    if (startBtn) startBtn.disabled = false;
  }

  function initGame() {
    var grid = document.getElementById('mole-grid');
    if (grid) {
      var moleEls = grid.querySelectorAll('.mole');
      moles = Array.prototype.slice.call(moleEls);

      var holes = grid.querySelectorAll('.mole-hole');
      holes.forEach(function(hole, index) {
        hole.addEventListener('click', function() {
          whackMole(index);
        });
      });
    }

    var best = localStorage.getItem('tablo-wam-best') || '0';
    if (bestEl) bestEl.textContent = best;

    if (startBtn) {
      startBtn.addEventListener('click', startGame);
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', startGame);
    }
  }

  window.initGame = initGame;
})();