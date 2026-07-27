// ============================================
// Tablo — Mancala
// ============================================

(function() {
  'use strict';

  console.log('[Mancala] game.js loaded');

  var board = [];
  var currentPlayer = 1;
  var gameActive = false;
  var p1Wins = 0;
  var p2Wins = 0;
  var vsComputer = false;
  var computerPlaying = false;
  var isAnimating = false;

  var p1StoreEl, p2StoreEl, p1ScoreEl, p2ScoreEl, turnEl;
  var newGameBtn, winnerModal, winnerIcon, winnerTitle, winnerMessage, playAgainBtn;
  var modeSelect;
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

  function initBoard() {
    board = [4, 4, 4, 4, 4, 4,
             4, 4, 4, 4, 4, 4,
             0, 0];
    currentPlayer = 1;
    gameActive = true;
    isAnimating = false;
    computerPlaying = false;
    renderBoard();
    updateStats();
    highlightActiveSide();
  }

  function getPitIndex(pitNum, player) {
    if (player === 1) return pitNum;
    return 6 + pitNum;
  }

  function getPlayerForPit(pitIndex) {
    if (pitIndex >= 0 && pitIndex <= 5) return 1;
    if (pitIndex >= 6 && pitIndex <= 11) return 2;
    return 0;
  }

  function distributeStones(startPitIndex) {
    if (isAnimating) return;
    isAnimating = true;
    disableNonPlayablePits();

    var stones = board[startPitIndex];
    board[startPitIndex] = 0;
    renderPitCount(startPitIndex, 0);

    var currentIndex = startPitIndex;
    var remaining = stones;

    function distributeOne() {
      if (remaining <= 0) {
        isAnimating = false;
        handleLastStone(currentIndex);
        return;
      }

      currentIndex++;

      if (currentPlayer === 1 && currentIndex === 13) currentIndex = 0;
      if (currentPlayer === 2 && currentIndex === 12) currentIndex = 6;
      if (currentIndex > 13) currentIndex = 0;

      board[currentIndex]++;
      remaining--;
      renderPitCount(currentIndex, board[currentIndex]);

      if (remaining === 0) {
        isAnimating = false;
        handleLastStone(currentIndex);
      } else {
        setTimeout(distributeOne, 150);
      }
    }

    distributeOne();
  }

  function handleLastStone(landedIndex) {
    var landedPlayer = getPlayerForPit(landedIndex);

    // Capture rule
    if (landedPlayer === currentPlayer && board[landedIndex] === 1) {
      var oppositeIndex;
      if (currentPlayer === 1 && landedIndex >= 0 && landedIndex <= 5) {
        oppositeIndex = 11 - landedIndex;
      } else if (currentPlayer === 2 && landedIndex >= 6 && landedIndex <= 11) {
        oppositeIndex = 17 - landedIndex;
      }

      if (oppositeIndex !== undefined && board[oppositeIndex] > 0) {
        var captured = board[oppositeIndex] + board[landedIndex];
        board[oppositeIndex] = 0;
        board[landedIndex] = 0;
        board[currentPlayer === 1 ? 12 : 13] += captured;
        renderPitCount(oppositeIndex, 0);
        renderPitCount(landedIndex, 0);
        renderStoreCount();
        showToast(tr('mancala_captured') + ' ' + captured);
      }
    }

    // Check game over
    var p1HasStones = board.slice(0, 6).some(function(c) { return c > 0; });
    var p2HasStones = board.slice(6, 12).some(function(c) { return c > 0; });

    if (!p1HasStones || !p2HasStones) {
      var p1Remaining = board.slice(0, 6).reduce(function(a, b) { return a + b; }, 0);
      var p2Remaining = board.slice(6, 12).reduce(function(a, b) { return a + b; }, 0);
      board[12] += p1Remaining;
      board[13] += p2Remaining;
      for (var i = 0; i < 12; i++) board[i] = 0;

      renderBoard();
      updateStats();

      setTimeout(function() {
        var winner = board[12] > board[13] ? 1 : (board[13] > board[12] ? 2 : 0);
        showWinner(winner);
      }, 500);
      return;
    }

    // Extra turn if landed in own store
    if (landedIndex === (currentPlayer === 1 ? 12 : 13)) {
      showToast(tr('mancala_extra_turn'));
      renderBoard();
      highlightActiveSide();
      return;
    }

    // Switch turn
    switchTurn();
  }

  function switchTurn() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    highlightActiveSide();
    updateStats();
    renderBoard();

    // Check if new player can move
    var canMove = false;
    for (var j = 0; j < 6; j++) {
      var pitIdx = getPitIndex(j, currentPlayer);
      if (board[pitIdx] > 0) { canMove = true; break; }
    }

    if (!canMove) {
      showToast(tr('mancala_no_moves'));
      var prevPlayer = currentPlayer === 1 ? 2 : 1;
      setTimeout(function() {
        currentPlayer = prevPlayer;
        highlightActiveSide();
        updateStats();
        renderBoard();
        if (vsComputer && currentPlayer === 2 && gameActive) {
          setTimeout(makeComputerMove, 600);
        }
      }, 1000);
      return;
    }

    if (vsComputer && currentPlayer === 2 && gameActive) {
      setTimeout(makeComputerMove, 600);
    }
  }

  function makeComputerMove() {
    if (!vsComputer || currentPlayer !== 2 || !gameActive) return;

    computerPlaying = true;
    highlightActiveSide();
    disableNonPlayablePits();

    var availablePits = [];
    for (var i = 6; i <= 11; i++) {
      if (board[i] > 0) availablePits.push(i);
    }

    if (availablePits.length === 0) {
      computerPlaying = false;
      return;
    }

    var chosenPit = availablePits[Math.floor(Math.random() * availablePits.length)];

    setTimeout(function() {
      computerPlaying = false;
      distributeStones(chosenPit);
    }, 800);
  }

  function handlePitClick(pitIndex) {
    if (!gameActive || isAnimating || computerPlaying) return;

    var pitPlayer = getPlayerForPit(pitIndex);
    if (pitPlayer !== currentPlayer) {
      showToast(tr('mancala_not_your_turn'));
      return;
    }

    if (board[pitIndex] === 0) {
      showToast(tr('mancala_empty_pit'));
      return;
    }

    distributeStones(pitIndex);
  }

  function renderPitCount(pitIndex, count) {
    if (pitIndex >= 0 && pitIndex <= 5) {
      var el = document.querySelector('.bottom-row .mancala-pit[data-pit="' + pitIndex + '"] .pit-count');
      if (el) el.textContent = count;
    } else if (pitIndex >= 6 && pitIndex <= 11) {
      var el2 = document.querySelector('.top-row .mancala-pit[data-pit="' + (pitIndex - 6) + '"] .pit-count');
      if (el2) el2.textContent = count;
    }
  }

  function renderStoreCount() {
    if (p1StoreEl) p1StoreEl.textContent = board[12];
    if (p2StoreEl) p2StoreEl.textContent = board[13];
  }

  function renderBoard() {
    for (var i = 0; i < 6; i++) {
      var p1Pit = document.querySelector('.bottom-row .mancala-pit[data-pit="' + i + '"] .pit-count');
      if (p1Pit) p1Pit.textContent = board[i];

      var p2Pit = document.querySelector('.top-row .mancala-pit[data-pit="' + i + '"] .pit-count');
      if (p2Pit) p2Pit.textContent = board[6 + i];
    }

    renderStoreCount();
    disableNonPlayablePits();
  }

  function disableNonPlayablePits() {
    var pits = document.querySelectorAll('.mancala-pit');
    pits.forEach(function(pit) {
      pit.classList.remove('selectable', 'disabled');
      var pitPlayer = parseInt(pit.dataset.player);
      var pitIdx = parseInt(pit.dataset.pit);
      
      // ΔΙΟΡΘΩΣΗ: ΑφαίρεσηPlayersForPit() - το actualIdx τώρα είναι σωστό board index
      var actualIdx = getPitIndex(pitIdx, pitPlayer);

      if (isAnimating || computerPlaying) {
        pit.classList.add('disabled');
      } else if (pitPlayer !== currentPlayer) {
        pit.classList.add('disabled');
      } else if (board[actualIdx] === 0) {
        pit.classList.add('disabled');
      } else {
        pit.classList.add('selectable');
      }
    });
  }

  function highlightActiveSide() {
    var bottomRow = document.getElementById('bottom-row');
    var topRow = document.getElementById('top-row');

    if (bottomRow) {
      bottomRow.classList.remove('active');
      if (currentPlayer === 1 && !isAnimating && !computerPlaying) {
        bottomRow.classList.add('active');
      }
    }
    if (topRow) {
      topRow.classList.remove('active');
      if (currentPlayer === 2 && !isAnimating && !computerPlaying) {
        topRow.classList.add('active');
      }
    }
  }

  function updateStats() {
    if (p1ScoreEl) p1ScoreEl.textContent = board[12];
    if (p2ScoreEl) p2ScoreEl.textContent = board[13];
    if (turnEl) turnEl.textContent = currentPlayer;
  }

  function showWinner(winner) {
    gameActive = false;

    if (winnerIcon) winnerIcon.textContent = '\u{1F389}';
    if (winnerTitle) {
      if (winner === 0) {
        winnerTitle.textContent = tr('mancala_draw');
      } else {
        winnerTitle.textContent = tr('mancala_player') + ' ' + winner + ' ' + tr('mancala_wins_excl');
      }
    }
    if (winnerMessage) {
      winnerMessage.textContent = tr('mancala_final_score') + ' ' + board[12] + ' - ' + board[13];
      if (winner === 1) {
        p1Wins++;
        localStorage.setItem('mancala-p1-wins', p1Wins.toString());
      } else if (winner === 2) {
        p2Wins++;
        localStorage.setItem('mancala-p2-wins', p2Wins.toString());
      }
    }

    if (playAgainBtn) {
      playAgainBtn.onclick = function() {
        if (winnerModal) {
          winnerModal.classList.remove('visible');
        }
        initBoard();
      };
    }

    if (winnerModal) {
      winnerModal.classList.add('visible');
    }
  }

  function setMode(mode) {
    vsComputer = (mode === 'ai');
    console.log('[Mancala] Mode set to:', vsComputer ? 'vs Computer' : '2 Players');
  }

  function initGame() {
    console.log('[Mancala] initGame() called');

    p1StoreEl = document.getElementById('p1-store');
    p2StoreEl = document.getElementById('p2-store');
    p1ScoreEl = document.getElementById('p1-score');
    p2ScoreEl = document.getElementById('p2-score');
    turnEl = document.getElementById('turn-display');

    newGameBtn = document.getElementById('btn-new-game');
    modeSelect = document.getElementById('mode-select');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    playAgainBtn = document.getElementById('btn-play-again');
    toast = document.getElementById('toast');

    document.querySelectorAll('.mancala-pit').forEach(function(pit) {
      pit.addEventListener('click', function() {
        var pitIdx = parseInt(this.dataset.player) === 1 ? parseInt(this.dataset.pit) : 6 + parseInt(this.dataset.pit);
        handlePitClick(pitIdx);
      });
    });

    if (newGameBtn) newGameBtn.addEventListener('click', initBoard);
    if (modeSelect) modeSelect.addEventListener('change', function(e) {
      setMode(e.target.value);
    });

    p1Wins = parseInt(localStorage.getItem('mancala-p1-wins') || '0');
    p2Wins = parseInt(localStorage.getItem('mancala-p2-wins') || '0');

    initBoard();
    console.log('[Mancala] Init complete');
  }

  window.initGame = initGame;
})();