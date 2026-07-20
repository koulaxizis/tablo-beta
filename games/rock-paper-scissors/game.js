// ============================================
// Tablo — Rock Paper Scissors
// ============================================

(function() {
  'use strict';

  console.log('[RPS] game.js loaded');

  var CHOICES = ['rock', 'paper', 'scissors'];
  var ICON_IDS = {
    'rock': '#icon-rock',
    'paper': '#icon-paper',
    'scissors': '#icon-scissors'
  };

  var wins = 0;
  var losses = 0;
  var draws = 0;
  var playing = false;

  var playerHandEl, aiHandEl, resultEl;
  var winsEl, lossesEl, drawsEl;
  var choiceBtns, resetBtn;
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

  function setHand(handEl, choice) {
    var svg = handEl.querySelector('svg use');
    if (svg) {
      svg.setAttribute('href', ICON_IDS[choice]);
    }
  }

  function updateStats() {
    if (winsEl) winsEl.textContent = wins;
    if (lossesEl) lossesEl.textContent = losses;
    if (drawsEl) drawsEl.textContent = draws;
  }

  function disableChoices(disabled) {
    choiceBtns.forEach(function(btn) {
      btn.disabled = disabled;
    });
  }

  function determineWinner(player, ai) {
    if (player === ai) return 'draw';
    if (
      (player === 'rock' && ai === 'scissors') ||
      (player === 'paper' && ai === 'rock') ||
      (player === 'scissors' && ai === 'paper')
    ) {
      return 'win';
    }
    return 'lose';
  }

  function play(playerChoice) {
    if (playing) return;
    playing = true;
    disableChoices(true);

    // Reset classes
    playerHandEl.className = 'rps-hand';
    aiHandEl.className = 'rps-hand';
    resultEl.className = 'rps-vs';
    resultEl.textContent = 'VS';

    // Start shaking animation
    playerHandEl.classList.add('shaking');
    aiHandEl.classList.add('shaking');

    // Cycle AI hand during shake
    var cycleIdx = 0;
    var cycleInterval = setInterval(function() {
      setHand(aiHandEl, CHOICES[cycleIdx % 3]);
      cycleIdx++;
    }, 100);

    // After 1 second, reveal
    setTimeout(function() {
      clearInterval(cycleInterval);

      var aiChoice = CHOICES[Math.floor(Math.random() * 3)];

      setHand(playerHandEl, playerChoice);
      setHand(aiHandEl, aiChoice);

      playerHandEl.classList.remove('shaking');
      aiHandEl.classList.remove('shaking');

      var result = determineWinner(playerChoice, aiChoice);
      console.log('[RPS] Player:', playerChoice, 'AI:', aiChoice, 'Result:', result);

      if (result === 'win') {
        wins++;
        playerHandEl.classList.add('winner');
        aiHandEl.classList.add('loser');
        resultEl.className = 'rps-vs win';
        resultEl.textContent = tr('rps_you_win');
        showToast('rps_you_win');
      } else if (result === 'lose') {
        losses++;
        aiHandEl.classList.add('winner');
        playerHandEl.classList.add('loser');
        resultEl.className = 'rps-vs lose';
        resultEl.textContent = tr('rps_ai_wins');
        showToast('rps_ai_wins');
      } else {
        draws++;
        resultEl.className = 'rps-vs draw';
        resultEl.textContent = tr('rps_draw');
        showToast('rps_draw');
      }

      localStorage.setItem('rps-wins', wins.toString());
      localStorage.setItem('rps-losses', losses.toString());
      localStorage.setItem('rps-draws', draws.toString());

      updateStats();
      disableChoices(false);
      playing = false;
    }, 1000);
  }

  function resetScore() {
    wins = 0;
    losses = 0;
    draws = 0;
    localStorage.removeItem('rps-wins');
    localStorage.removeItem('rps-losses');
    localStorage.removeItem('rps-draws');
    updateStats();
    showToast('rps_score_reset');
    console.log('[RPS] Score reset');
  }

  function initGame() {
    console.log('[RPS] initGame() called');

    playerHandEl = document.getElementById('player-hand');
    aiHandEl = document.getElementById('ai-hand');
    resultEl = document.getElementById('rps-result');
    winsEl = document.getElementById('wins-count');
    lossesEl = document.getElementById('losses-count');
    drawsEl = document.getElementById('draws-count');
    resetBtn = document.getElementById('btn-reset');
    toast = document.getElementById('toast');

    choiceBtns = document.querySelectorAll('.rps-choice-btn');

    console.log('[RPS] Elements:', {
      playerHandEl: !!playerHandEl,
      aiHandEl: !!aiHandEl,
      choiceBtns: choiceBtns.length
    });

    // Load saved stats
    var savedWins = localStorage.getItem('rps-wins');
    if (savedWins) wins = parseInt(savedWins);
    var savedLosses = localStorage.getItem('rps-losses');
    if (savedLosses) losses = parseInt(savedLosses);
    var savedDraws = localStorage.getItem('rps-draws');
    if (savedDraws) draws = parseInt(savedDraws);

    // Choice buttons
    choiceBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        play(btn.dataset.choice);
      });
    });

    if (resetBtn) resetBtn.addEventListener('click', resetScore);

    updateStats();
    console.log('[RPS] Init complete');
  }

  window.initGame = initGame;
})();