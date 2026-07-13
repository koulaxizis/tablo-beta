// ============================================
// Tablo — Simon Says (Fixed flash issue)
// ============================================

(function() {
  'use strict';

  var pattern = [];
  var userPattern = [];
  var round = 0;
  var score = 0;
  var gameActive = false;
  var waitingForUser = false;

  var tiles = [];
  var startBtn = document.getElementById('simon-start');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best-score');
  var roundEl = document.getElementById('round');
  var messageEl = document.getElementById('message');
  var restartBtn = document.getElementById('restart-btn');
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
    setTimeout(function() { toast.classList.remove('visible'); }, 2000);
  }

  function getColors() {
    return ['#e74c3c', '#2ecc71', '#f1c40f', '#3498db'];
  }

  function getSounds() {
    return [329.63, 392.00, 261.63, 293.66];
  }

  function flashTile(index, duration, playSound) {
    var tile = tiles[index];
    if (!tile) return;

    tile.classList.add('active');

    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var oscillator = audioCtx.createOscillator();
    var gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.frequency.value = getSounds()[index];
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start();

    setTimeout(function() {
      tile.classList.remove('active');
      oscillator.stop();
      audioCtx.close();
    }, duration);
  }

  function playPattern() {
    waitingForUser = false;
    userPattern = [];
    var speed = Math.max(200, 600 - round * 20);

    for (var i = 0; i < pattern.length; i++) {
      (function(i) {
        setTimeout(function() {
          flashTile(pattern[i], speed, true);
        }, i * speed);
      })(i);
    }

    setTimeout(function() {
      waitingForUser = true;
      if (messageEl) messageEl.textContent = tr('simon_instruction');
    }, pattern.length * speed + 200);
  }

  function handleTileClick(index) {
    if (!waitingForUser || !gameActive) return;

    flashTile(index, 200, true);
    userPattern.push(index);

    var currentStep = userPattern.length - 1;
    if (userPattern[currentStep] !== pattern[currentStep]) {
      gameOver();
      return;
    }

    if (userPattern.length === pattern.length) {
      round++;
      if (roundEl) roundEl.textContent = round;
      score = round;
      if (scoreEl) scoreEl.textContent = score;
      pattern.push(Math.floor(Math.random() * 4));
      waitingForUser = false;
      setTimeout(playPattern, 1000);
    }
  }

  function gameOver() {
    gameActive = false;
    waitingForUser = false;

    var best = localStorage.getItem('tablo-simon-best');
    if (!best || score > parseInt(best)) {
      localStorage.setItem('tablo-simon-best', score.toString());
      if (bestEl) bestEl.textContent = score;
    }

    if (messageEl) messageEl.textContent = tr('simon_game_over');
    showToast(tr('simon_you_scored') + ' ' + score);
  }

  function startGame() {
    pattern = [Math.floor(Math.random() * 4)];
    userPattern = [];
    round = 0;
    score = 0;
    gameActive = true;
    waitingForUser = false;

    if (roundEl) roundEl.textContent = round;
    if (scoreEl) scoreEl.textContent = score;
    if (messageEl) messageEl.textContent = tr('simon_instruction');
    if (startBtn) startBtn.disabled = true;

    setTimeout(playPattern, 500);
  }

  function initGame() {
    var grid = document.getElementById('simon-grid');
    if (grid) {
      tiles = grid.querySelectorAll('.simon-tile');
      tiles.forEach(function(tile, index) {
        tile.addEventListener('click', function() {
          handleTileClick(index);
        });
      });
    }

    if (startBtn) {
      startBtn.addEventListener('click', startGame);
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', function() {
        startGame();
        showToast(tr('toast_restarted'));
      });
    }

    var best = localStorage.getItem('tablo-simon-best');
    if (bestEl) bestEl.textContent = best || '0';
  }

  window.initGame = initGame;
})();