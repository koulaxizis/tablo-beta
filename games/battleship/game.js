// ============================================
// Tablo — Battleship
// ============================================

(function() {
  'use strict';

  console.log('[Battleship] game.js loaded');

  var GRID_SIZE = 10;
  var TOTAL_SHIPS = 20;

  var SHIP_SIZES = [5, 4, 4, 3, 3, 3, 2, 2];

  var board = [];
  var shots = 0;
  var hits = 0;
  var gameActive = false;
  var wins = 0;
  var autoFire = false;
  var autoFireTimerId = null;

  var boardEl, statusEl, hitsEl, shotsEl, winsEl;
  var autoFireBtn, resetBtn, winnerModal, winnerIcon, winnerTitle, winnerMessage, playAgainBtn;
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

  function generateBoard() {
    board = [];
    for (var i = 0; i < GRID_SIZE; i++) {
      board[i] = [];
      for (var j = 0; j < GRID_SIZE; j++) {
        board[i][j] = { ship: false, hit: false, miss: false };
      }
    }
  }

  function placeShipsRandomly() {
    for (var s = 0; s < SHIP_SIZES.length; s++) {
      var shipSize = SHIP_SIZES[s];
      var placed = false;

      while (!placed) {
        var horizontal = Math.random() < 0.5;
        var row = Math.floor(Math.random() * GRID_SIZE);
        var col = Math.floor(Math.random() * GRID_SIZE);

        if (horizontal) {
          if (col + shipSize <= GRID_SIZE && canPlaceShip(row, col, shipSize, true)) {
            for (var c = 0; c < shipSize; c++) {
              board[row][col + c].ship = true;
            }
            placed = true;
          }
        } else {
          if (row + shipSize <= GRID_SIZE && canPlaceShip(row, col, shipSize, false)) {
            for (var r = 0; r < shipSize; r++) {
              board[row + r][col].ship = true;
            }
            placed = true;
          }
        }
      }
    }
  }

  function canPlaceShip(row, col, size, horizontal) {
    if (horizontal) {
      for (var c = 0; c < size; c++) {
        if (board[row][col + c].ship) return false;
      }
    } else {
      for (var r = 0; r < size; r++) {
        if (board[row + r][col].ship) return false;
      }
    }
    return true;
  }

  function buildBoardDOM() {
    if (!boardEl) return;
    boardEl.innerHTML = '';

    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        var cell = document.createElement('div');
        cell.className = 'bs-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.id = 'bs-cell-' + r + '-' + c;

        cell.addEventListener('click', function(row, col) {
          onCellClick(row, col);
        }.bind(null, r, c));

        boardEl.appendChild(cell);
      }
    }
  }

  function updateCellDOM(row, col) {
    var cell = document.getElementById('bs-cell-' + row + '-' + col);
    if (!cell) return;

    if (board[row][col].hit) {
      cell.classList.add('hit');
    } else if (board[row][col].miss) {
      cell.classList.add('miss');
    }
  }

  function updateStats() {
    if (hitsEl) hitsEl.textContent = hits + '/' + TOTAL_SHIPS;
    if (shotsEl) shotsEl.textContent = shots;
    if (winsEl) winsEl.textContent = wins;
  }

  function fireShot(row, col) {
    if (!gameActive) return;
    if (board[row][col].hit || board[row][col].miss) return;

    shots++;

    if (board[row][col].ship) {
      board[row][col].hit = true;
      hits++;
      if (statusEl) statusEl.innerHTML = '<span style="color:#ef4444">' + tr('battleship_hit') + '</span>';
    } else {
      board[row][col].miss = true;
      if (statusEl) statusEl.innerHTML = '<span style="color:#64748b">' + tr('battleship_miss') + '</span>';
    }

    // Only update the single cell that changed
    updateCellDOM(row, col);
    updateStats();
    checkWinCondition();
  }

  function onCellClick(row, col) {
    // Don't allow manual clicks while auto-firing
    if (autoFire) return;
    fireShot(row, col);
  }

  function autoFireLoop() {
    if (!gameActive || !autoFire) {
      stopAutoFire();
      return;
    }

    var available = [];
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        if (!board[r][c].hit && !board[r][c].miss) {
          available.push({ row: r, col: c });
        }
      }
    }

    if (available.length === 0) {
      stopAutoFire();
      return;
    }

    var shot = available[Math.floor(Math.random() * available.length)];
    fireShot(shot.row, shot.col);

    if (autoFire && gameActive) {
      autoFireTimerId = setTimeout(autoFireLoop, 300);
    }
  }

  function startAutoFire() {
    if (!gameActive || autoFire) return;
    autoFire = true;
    if (autoFireBtn) {
      autoFireBtn.textContent = tr('battleship_stop_fire');
      autoFireBtn.classList.add('active');
    }
    console.log('[Battleship] Auto fire STARTED');
    autoFireLoop();
  }

  function stopAutoFire() {
    autoFire = false;
    clearTimeout(autoFireTimerId);
    autoFireTimerId = null;
    if (autoFireBtn) {
      autoFireBtn.textContent = tr('battleship_auto_fire');
      autoFireBtn.classList.remove('active');
    }
    console.log('[Battleship] Auto fire STOPPED');
  }

  function checkWinCondition() {
    if (hits >= TOTAL_SHIPS) {
      gameActive = false;
      stopAutoFire();
      wins++;
      localStorage.setItem('battleship-wins', wins.toString());
      showWinner(true);
    }
  }

  function showWinner(won) {
    if (winnerIcon) winnerIcon.textContent = '\u{1F389}';
    if (winnerTitle) {
      winnerTitle.textContent = tr('battleship_victory');
    }
    if (winnerMessage) {
      winnerMessage.textContent = tr('battleship_all_sunk') + ' ' + tr('battleship_stats') + ': ' + shots + ' ' + tr('battleship_shots');
    }

    if (playAgainBtn) {
      playAgainBtn.onclick = function() {
        if (winnerModal) {
          winnerModal.classList.remove('visible');
          winnerModal.style.display = 'none';
        }
        startNewGame();
      };
    }

    if (winnerModal) {
      winnerModal.classList.add('visible');
      winnerModal.style.display = 'flex';
    }
  }

  function startNewGame() {
    generateBoard();
    placeShipsRandomly();
    shots = 0;
    hits = 0;
    gameActive = true;
    stopAutoFire();

    if (winnerModal) {
      winnerModal.classList.remove('visible');
      winnerModal.style.display = 'none';
    }

    if (statusEl) statusEl.innerHTML = '<span>' + tr('battleship_turn') + '</span>';

    buildBoardDOM();
    updateStats();
    showToast('battleship_new_game_started');
  }

  function resetBoard() {
    startNewGame();
  }

  function initGame() {
    console.log('[Battleship] initGame() called');

    boardEl = document.getElementById('bs-board');
    statusEl = document.getElementById('bs-status');
    hitsEl = document.getElementById('hits-count');
    shotsEl = document.getElementById('shots-count');
    winsEl = document.getElementById('wins-count');
    autoFireBtn = document.getElementById('btn-auto-fire');
    resetBtn = document.getElementById('btn-reset');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    playAgainBtn = document.getElementById('btn-play-again');
    toast = document.getElementById('toast');

    console.log('[Battleship] Elements:', {
      boardEl: !!boardEl,
      statusEl: !!statusEl
    });

    if (!boardEl || !statusEl) {
      console.error('[Battleship] CRITICAL: Missing core elements!');
      return;
    }

    var savedWins = localStorage.getItem('battleship-wins');
    if (savedWins) wins = parseInt(savedWins);

    if (autoFireBtn) autoFireBtn.addEventListener('click', function() {
      console.log('[Battleship] AutoFire button clicked, autoFire:', autoFire);
      if (autoFire) {
        stopAutoFire();
      } else {
        startAutoFire();
      }
    });

    if (resetBtn) resetBtn.addEventListener('click', function() {
      resetBoard();
      showToast('toast_restarted');
    });

    startNewGame();
    console.log('[Battleship] Init complete');
  }

  window.initGame = initGame;
})();