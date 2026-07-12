// ============================================
// Tablo — Simon Says Game
// ============================================

(function() {
  'use strict';

  var colors = ['green', 'red', 'yellow', 'blue'];
  var sequence = [];
  var playerSequence = [];
  var round = 0;
  var score = 0;
  var bestScore = 0;
  var isPlaying = false;
  var isPlayerTurn = false;
  var speed = 600;

  var scoreEl = document.getElementById('score');
  var bestScoreEl = document.getElementById('best-score');
  var roundEl = document.getElementById('round');
  var startBtn = document.getElementById('btn-start');
  var retryBtn = document.getElementById('btn-retry');
  var gameOverModal = document.getElementById('game-over-modal');
  var finalScoreMsg = document.getElementById('final-score-msg');
  var toast = document.getElementById('toast');
  var buttons = [];

  function tr(key) {
    var lang = localStorage.getItem('tablo-language') || 'en';
    var t = window.TABLO_TRANSLATIONS && window.TABLO_TRANSLATIONS[lang];
    return t ? (t[key] || key) : key;
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function() {
      toast.classList.remove('visible');
    }, 3000);
  }

  function getAudioContext() {
    if (!window.AudioContext && !window.webkitAudioContext) return null;
    return window.AudioContext ? new AudioContext() : new webkitAudioContext();
  }

  var audioCtx = getAudioContext();

  function playTone(frequency, duration) {
    if (!audioCtx) return;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.frequency.value = frequency;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.value = 0.1;
    osc.start();
    setTimeout(function() {
      osc.stop();
    }, duration);
  }

  var colorFrequencies = {
    green: 329.63,
    red: 261.63,
    yellow: 293.66,
    blue: 392.00
  };

  function lightUp(color) {
    var btn = document.getElementById('btn-' + color);
    if (!btn) return;

    btn.classList.add('active');
    playTone(colorFrequencies[color], 200);

    setTimeout(function() {
      btn.classList.remove('active');
    }, speed);
  }

  function addToSequence() {
    var randomColor = colors[Math.floor(Math.random() * 4)];
    sequence.push(randomColor);
  }

  function playSequence() {
    isPlayerTurn = false;
    round++;
    roundEl.textContent = round;

    var i = 0;
    var interval = setInterval(function() {
      if (i >= sequence.length) {
        clearInterval(interval);
        isPlayerTurn = true;
        return;
      }
      lightUp(sequence[i]);
      i++;
    }, speed);
  }

  function handleButtonClick(e) {
    if (!isPlayerTurn || !isPlaying) return;

    var color = e.currentTarget.dataset.color;
    if (!color) return;

    lightUp(color);
    playerSequence.push(color);

    var idx = playerSequence.length - 1;
    if (playerSequence[idx] !== sequence[idx]) {
      endGame();
      return;
    }

    if (playerSequence.length === sequence.length) {
      isPlayerTurn = false;
      score = round;
      scoreEl.textContent = score;
      playerSequence = [];

      setTimeout(function() {
        addToSequence();
        playSequence();
      }, 1000);
    }
  }

  function endGame() {
    isPlaying = false;
    isPlayerTurn = false;

    if (score > bestScore) {
      bestScore = score;
      bestScoreEl.textContent = bestScore;
      localStorage.setItem('tablo-simon-best', bestScore.toString());
    }

    finalScoreMsg.textContent = tr('simon_you_scored') + ' ' + score;
    gameOverModal.classList.add('visible');
    showToast(tr('simon_game_over'));
  }

  function startGame() {
    sequence = [];
    playerSequence = [];
    round = 0;
    score = 0;
    speed = 600;
    scoreEl.textContent = '0';
    roundEl.textContent = '1';

    addToSequence();
    isPlaying = true;
    isPlayerTurn = false;

    setTimeout(playSequence, 1000);
    startBtn.style.opacity = '0.3';
    startBtn.style.pointerEvents = 'none';
  }

  function resetGame() {
    gameOverModal.classList.remove('visible');
    startGame();
  }

  function initGame() {
    var saved = localStorage.getItem('tablo-simon-best');
    if (saved) {
      bestScore = parseInt(saved) || 0;
      bestScoreEl.textContent = bestScore;
    }

    buttons = document.querySelectorAll('.simon-button');
    buttons.forEach(function(btn) {
      btn.addEventListener('click', handleButtonClick);
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