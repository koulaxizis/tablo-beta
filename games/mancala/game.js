// ============================================
// Tablo — Mancala
// ============================================

(function() {
  'use strict';

  console.log('[Mancala] game.js loaded');

  // Game state
  // Pits 0-5: Player 1's pits (bottom row, left to right)
  // Pits 6-11: Player 2's pits (top row, right to left in display)
  // Store P1: index 12
  // Store P2: index 13

  var board = [];
  var currentPlayer = 1;
  var gameActive = false;
  var p1Wins = 0;
  var p2Wins = 0;

  var p1StoreEl, p2StoreEl, p1ScoreEl, p2ScoreEl, turnEl;
  var newGameBtn, passBtn, winnerModal, winnerIcon, winnerTitle, winnerMessage, playAgainBtn;
  var toast;
  var isAnimating = false;

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
    // 6 pits per player, each starts with 4 stones
    board = [4, 4, 4, 4, 4, 4,  // Player 1's pits
             4, 4, 4, 4, 4, 4,  // Player 2's pits
             0, 0];             // Stores (P1, P2)
    currentPlayer = 1;
    gameActive = true;
    isAnimating = false;
    renderBoard();
    updateStats();
    highlightActiveSide();
  }

  function getPitIndex(pitNum, player) {
    if (player === 1) return pitNum; // 0-5
    return 6 + pitNum; // 6-11
  }

  function getPlayerForPit(pitIndex) {
    if (pitIndex >= 0 && pitIndex <= 5) return 1;
    if (pitIndex >= 6 && pitIndex <= 11) return 2;
    return 0; // Store
  }

  function distributeStones(startPitIndex) {
    if (isAnimating) return;
    isAnimating = true;

    var stones = board[startPitIndex];
    board[startPitIndex] = 0;
    renderPitCount(startPitIndex, 0);

    var currentIndex = startPitIndex;
    var totalDistributed = 0;

    function distributeOne() {
      if (totalDistributed >= stones) {
        isAnimating = false;
        checkGameOver();
        return;
      }

      currentIndex++;

      // Skip opponent's store
      if (currentPlayer === 1 && currentIndex === 13) {
        currentIndex = 0;
      }
      if (currentPlayer === 2 && currentIndex === 12) {
        currentIndex = 6;
      }

      // Wrap around
      if (currentIndex > 13) currentIndex = 0;
      if (currentIndex < 0) currentIndex = 13;

      board[currentIndex]++;
      totalDistributed++;
      renderPitCount(currentIndex, board[currentIndex]);

      if (totalDistributed === stones) {
        // Last stone landed - check for capture or extra turn
        handleLastStone(currentIndex);
      } else {
        setTimeout(distributeOne, 150);
      }
    }

    distributeOne();
  }

  function handleLastStone(landedIndex) {
    var landedPlayer = getPlayerForPit(landedIndex);

    // Capture rule: land on own empty pit with opponent's stones on opposite
    if (landedPlayer === currentPlayer && board[landedIndex] === 1) {
      var oppositeIndex;
      if (currentPlayer === 1 && landedIndex >= 0 && landedIndex <= 5) {
        oppositeIndex = 11 - landedIndex; // Opposite pit for P1
      } else if (currentPlayer === 2 && landedIndex >= 6 && landedIndex <= 11) {
        oppositeIndex = 17 - landedIndex; // Opposite pit for P2 (6->5, 7->4, etc.)
      }

      if (oppositeIndex !== undefined && board[oppositeIndex] > 0) {
        // Capture!
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

    renderBoard();
    updateStats();

    // Extra turn if landed in own store
    if (landedIndex === (currentPlayer === 1 ? 12 : 13)) {
      showToast(tr('mancala_extra_turn'));
      isAnimating = false;
      return;
    }

    // Switch turn
    switchTurn();
  }

  function switchTurn() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    highlightActiveSide();
    updateStats();
  }

  function checkGameOver() {
    // Check if one player has no stones left
    var p1HasStones = board.slice(0, 6).some(function(count) { return count > 0; });
    var p2HasStones = board.slice(6, 12).some(function(count) { return count > 0; });

    if (!p1HasStones || !p2HasStones) {
      // Game over - collect remaining stones
      var p1Remaining = board.slice(0, 6).reduce(function(a, b) { return a + b; }, 0);
      var p2Remaining = board.slice(6, 12).reduce(function(a, b) { return a + b; }, 0);

      board[12] += p1Remaining;
      board[13] += p2Remaining;

      for (var i = 0; i < 12; i++) {
        board[i] = 0;
      }

      renderBoard();
      updateStats();

      // Determine winner
      setTimeout(function() {
        var winner = board[12] > board[13] ? 1 : (board[13] > board[12] ? 2 : 0);
        showWinner(winner);
      }, 500);
      return;
    }

    // No game over, check if current player can move
    var canMove = false;
    for (var j = 0; j < 6; j++) {
      var pitIdx = getPitIndex(j, currentPlayer);
      if (board[pitIdx] > 0) {
        canMove = true;
        break;
      }
    }

    if (!canMove) {
      // Current player has no moves, switch
      showToast(tr('mancala_no_moves'));
      switchTurn();
    }
  }

  function handlePitClick(pitIndex) {
    if (!gameActive || isAnimating) return;

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
    var el = document.querySelector('.mancala-pit[data-pit="' + (pitIndex % 6) + '"][data-player="' + getPlayerForPit(pitIndex) + '"] .pit-count');
    if (el) {
      el.textContent = count;
    }
  }

  function renderStoreCount() {
    if (p1StoreEl) p1StoreEl.textContent = board[12];
    if (p2StoreEl) p2StoreEl.textContent = board[13];
  }

  function renderBoard() {
    // Update all pit counts
    for (var i = 0; i < 6; i++) {
      // P1 pits (bottom row)
      var p1Pit = document.querySelector('.bottom-row .mancala-pit[data-pit="' + i + '"] .pit-count');
      if (p1Pit) p1Pit.textContent = board[i];

      // P2 pits (top row)
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
      var actualIdx = getPlayerForPit(getPitIndex(pitIdx, pitPlayer));

      if (pitPlayer !== currentPlayer) {
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

    if (bottomRow) bottomRow.classList.toggle('active', currentPlayer === 1);
    if (topRow) topRow.classList.toggle('active', currentPlayer === 2);
  }

  function updateStats() {
    if (p1ScoreEl) p1ScoreEl.textContent = board[12];
    if (p2ScoreEl) p2ScoreEl.textContent = board[13];
    if (turnEl) turnEl.textContent = currentPlayer;

    // Update pass button
    if (passBtn) {
      passBtn.disabled = gameActive; // Pass is mainly for debugging/forcing turn change
    }
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

      // Update wins
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
          winnerModal.style.display = 'none';
        }
        initBoard();
      };
    }

    if (winnerModal) {
      winnerModal.classList.add('visible');
      winnerModal.style.display = 'flex';
    }
  }

  function passTurn() {
    if (!gameActive || isAnimating) return;
    switchTurn();
    showToast(tr('mancala_turn_passed'));
  }

  function initGame() {
    console.log('[Mancala] initGame() called');

    p1StoreEl = document.getElementById('p1-store');
    p2StoreEl = document.getElementById('p2-store');
    p1ScoreEl = document.getElementById('p1-score');
    p2ScoreEl = document.getElementById('p2-score');
    turnEl = document.getElementById('turn-display');

    newGameBtn = document.getElementById('btn-new-game');
    passBtn = document.getElementById('btn-pass');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    playAgainBtn = document.getElementById('btn-play-again');
    toast = document.getElementById('toast');

    // Add click listeners to all pits
    document.querySelectorAll('.mancala-pit').forEach(function(pit) {
      pit.addEventListener('click', function() {
        var pitIdx = parseInt(this.dataset.player) === 1 ? parseInt(this.dataset.pit) : 6 + parseInt(this.dataset.pit);
        handlePitClick(pitIdx);
      });
    });

    if (newGameBtn) newGameBtn.addEventListener('click', initBoard);
    if (passBtn) passBtn.addEventListener('click', passTurn);

    // Load saved wins
    p1Wins = parseInt(localStorage.getItem('mancala-p1-wins') || '0');
    p2Wins = parseInt(localStorage.getItem('mancala-p2-wins') || '0');

    initBoard();
    console.log('[Mancala] Init complete');
  }

  window.initGame = initGame;
})();