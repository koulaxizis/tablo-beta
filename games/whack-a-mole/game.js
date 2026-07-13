// ============================================
// Tablo — Whack-a-Mole (Fixed emoji)
// ============================================

(function() {
  'use strict';

  var score = 0;
  var timeLeft = 30;
  var gameActive = false;
  var timerInterval = null;
  var moleInterval = null;
  var currentMoleHole = null;

  var holes = [];
  var scoreEl = document.getElementById('whack-score');
  var bestEl = document.getElementById('whack-best');
  var timeEl = document.getElementById('whack-time');
  var startBtn = document.getElementById('whack-start');
  var gameOverModal = document.getElementById('game-over-modal');
  var finalScoreEl = document.getElementById('final-score');
  var retryBtn = document.getElementById('btn-retry');
  var toast = document.getElementById('toast');

  var MOLE_EMOJI = '\uD83D\uDC39';

  function tr(key) {
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
    return t ? (t[key] || key) : key;
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(function() { toast.classList.remove('visible'); }, 2000);
  }

  function showMole() {
    if (!gameActive) return;

    if (currentMoleHole !== null && holes[currentMoleHole]) {
      holes[currentMoleHole].textContent = '';
      holes[currentMoleHole].classList.remove('mole-visible');
    }

    var newHole = Math.floor(Math.random() * holes.length);
    while (newHole === currentMoleHole && holes.length > 1) {
      newHole = Math.floor(Math.random() * holes.length);
    }
    currentMoleHole = newHole;

    if (holes[newHole]) {
      holes[newHole].textContent = MOLE_EMOJI;
      holes[newHole].classList.add('mole-visible');
    }
  }

  function whackMole(index) {
    if (!gameActive) return;
    if (index === currentMoleHole) {
      score++;
      if (scoreEl) scoreEl.textContent = score;
      holes[index].classList.add('whacked');
      holes[index].textContent = '\uD83D\uDCA5';

      setTimeout(function() {
        holes[index].classList.remove('whacked');
        holes[index].classList.remove('mole-visible');
        holes[index].textContent = '';
      }, 300);

      currentMoleHole = null;
    }
  }

  function startGame() {
    score = 0;
    timeLeft = 30;
    gameActive = true;

    if (scoreEl) scoreEl.textContent = '0';
    if (timeEl) timeEl.textContent = '30';

    if (startBtn) startBtn.disabled = true;
    if (gameOverModal) gameOverModal.classList.remove('visible');

    showMole();
    moleInterval = setInterval(showMole, 800);

    timerInterval = setInterval(function() {
      timeLeft--;
      if (timeEl) timeEl.textContent = timeLeft;

      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }

  function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    clearInterval(moleInterval);

    if (currentMoleHole !== null && holes[currentMoleHole]) {
      holes[currentMoleHole].textContent = '';
      holes[currentMoleHole].classList.remove('mole-visible');
    }

    var best = localStorage.getItem('tablo-whack-best');
    if (!best || score > parseInt(best)) {
      localStorage.setItem('tablo-whack-best', score.toString());
      if (bestEl) bestEl.textContent = score;
    }

    if (finalScoreEl) finalScoreEl.textContent = score;
    if (gameOverModal) gameOverModal.classList.add('visible');
    if (startBtn) startBtn.disabled = false;
  }

  function initGame() {
    var grid = document.getElementById('whack-grid');
    if (grid) {
      var holeElements = grid.querySelectorAll('.mole-hole');
      holes = Array.prototype.slice.call(holeElements);
      holes.forEach(function(hole, index) {
        hole.addEventListener('click', function() {
          whackMole(index);
        });
      });
    }

    var best = localStorage.getItem('tablo-whack-best');
    if (bestEl) bestEl.textContent = best || '0';

    if (startBtn) {
      startBtn.addEventListener('click', startGame);
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', startGame);
    }
  }

  window.initGame = initGame;
})();