// ============================================
// Tablo — Snakes & Ladders
// ============================================

(function() {
  'use strict';

  console.log('[SnakesLadders] game.js loaded');

  var BOARD_SIZE = 100;
  var PLAYERS = 2;
  var MAX_WINS = 0;
  
  var SNAKES = {
    16: 6,
    47: 26,
    49: 11,
    56: 53,
    62: 19,
    64: 60,
    87: 24,
    93: 73,
    95: 75,
    98: 78
  };

  var LADDERS = {
    1: 38,
    4: 14,
    9: 31,
    21: 42,
    28: 84,
    36: 44,
    51: 67,
    71: 91,
    80: 100
  };

  var positions = [1, 1];
  var currentPlayer = 0;
  var isRolling = false;
  var wins = [0, 0];

  var boardEl, playersContainer, turnIndicator, diceValueEl, winsCountEl;
  var rollBtn, resetBtn, playAgainBtn;
  var winnerModal, winnerIcon, winnerTitle, winnerMessage;
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

  function renderBoard() {
    if (!boardEl) return;
    boardEl.innerHTML = '';

    // Board goes from 100 at top-left to 1 at bottom-left (zigzag)
    var cells = [];
    for (var row = 9; row >= 0; row--) {
      var rowData = [];
      for (var col = 0; col < 10; col++) {
        var num;
        if ((9 - row) % 2 === 0) {
          num = row * 10 + col + 1;
        } else {
          num = row * 10 + (9 - col) + 1;
        }
        rowData.push(num);
      }
      cells = cells.concat(rowData);
    }

    cells.forEach(function(num) {
      var cell = document.createElement('div');
      cell.className = 'sl-cell';
      cell.id = 'cell-' + num;
      cell.textContent = num;

      if (num === 1) cell.classList.add('start');
      if (num === 100) cell.classList.add('finish');
      if (SNAKES[num]) cell.classList.add('snake-head');
      if (Object.values(SNAKES).includes(num)) cell.classList.add('snake-tail');
      if (LADDERS[num]) cell.classList.add('ladder-bottom');
      if (Object.values(LADDERS).includes(num)) cell.classList.add('ladder-top');

      boardEl.appendChild(cell);
    });

    updateTokens();
  }

  function updateTokens() {
    // Remove old tokens
    document.querySelectorAll('.sl-token-on-board').forEach(function(t) {
      t.remove();
    });

    positions.forEach(function(pos, pIdx) {
      var cell = document.getElementById('cell-' + pos);
      if (!cell) return;

      var token = document.createElement('div');
      token.className = 'sl-token sl-token-on-board';
      token.style.position = 'absolute';
      token.style.width = '12px';
      token.style.height = '12px';
      token.style.borderRadius = '50%';
      token.style.backgroundColor = pIdx === 0 ? '#2dd4bf' : '#f97316';
      token.style.border = '2px solid white';
      token.style.zIndex = '10';
      token.style.left = (pIdx === 0 ? '20%' : '60%');
      token.style.top = '50%';
      token.style.transform = 'translate(-50%, -50%)';
      token.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      cell.appendChild(token);
    });
  }

  function rollDice() {
    if (isRolling) return;
    isRolling = true;
    rollBtn.disabled = true;

    var dieValue = Math.floor(Math.random() * 6) + 1;
    console.log('[SnakesLadders] Rolled:', dieValue);

    if (diceValueEl) diceValueEl.textContent = dieValue;

    animateDie(dieValue, function() {
      movePlayer(dieValue);
    });
  }

  function animateDie(value, callback) {
    var cycles = 0;
    var maxCycles = 10;
    var interval = setInterval(function() {
      if (diceValueEl) {
        diceValueEl.textContent = Math.floor(Math.random() * 6) + 1;
      }
      cycles++;
      if (cycles >= maxCycles) {
        clearInterval(interval);
        if (diceValueEl) diceValueEl.textContent = value;
        callback();
      }
    }, 80);
  }

  function movePlayer(steps) {
    var newPos = positions[currentPlayer] + steps;
    
    if (newPos > BOARD_SIZE) {
      newPos = BOARD_SIZE - (newPos - BOARD_SIZE);
    }

    positions[currentPlayer] = newPos;
    updateTokens();
    showToast(tr('sl_moved_to') + ' ' + newPos);

    // Check for snakes or ladders
    setTimeout(function() {
      checkSpecialCells(newPos);
    }, 300);
  }

  function checkSpecialCells(pos) {
    var moved = false;

    if (SNAKES[pos]) {
      var oldPos = pos;
      pos = SNAKES[pos];
      positions[currentPlayer] = pos;
      updateTokens();
      showToast(tr('sl_snake') + ' ' + oldPos + ' -> ' + pos);
      moved = true;
    } else if (LADDERS[pos]) {
      var oldPos = pos;
      pos = LADDERS[pos];
      positions[currentPlayer] = pos;
      updateTokens();
      showToast(tr('sl_ladder') + ' ' + oldPos + ' -> ' + pos);
      moved = true;
    }

    // Check win
    if (pos === BOARD_SIZE) {
      wins[currentPlayer]++;
      localStorage.setItem('sl-wins-' + currentPlayer, wins[currentPlayer].toString());
      isRolling = false;
      showWinner(currentPlayer);
      return;
    }

    // Switch turn
    if (!moved) {
      switchTurn();
    }
  }

  function switchTurn() {
    currentPlayer = (currentPlayer + 1) % PLAYERS;
    updateTurnIndicator();
    isRolling = false;
    rollBtn.disabled = false;
  }

  function updateTurnIndicator() {
    if (turnIndicator) turnIndicator.textContent = (currentPlayer + 1);

    var playerEls = document.querySelectorAll('.sl-player');
    playerEls.forEach(function(el, idx) {
      if (idx === currentPlayer) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  function showWinner(winnerIdx) {
    if (winnerIcon) winnerIcon.textContent = '\u{1F389}';
    if (winnerTitle) {
      winnerTitle.textContent = tr('sl_winner') + ' ' + (winnerIdx + 1);
    }
    if (winnerMessage) {
      winnerMessage.textContent = tr('sl_congrats') + '!';
    }

    if (playAgainBtn) {
      playAgainBtn.onclick = function() {
        if (winnerModal) {
          winnerModal.classList.remove('visible');
          winnerModal.style.display = 'none';
        }
        newGame();
      };
    }

    if (winnerModal) {
      winnerModal.classList.add('visible');
      winnerModal.style.display = 'flex';
    }
  }

  function newGame() {
    positions = [1, 1];
    currentPlayer = 0;
    isRolling = false;
    if (diceValueEl) diceValueEl.textContent = '-';
    if (rollBtn) rollBtn.disabled = false;
    
    renderBoard();
    updateTurnIndicator();
    updateWins();
    showToast('sl_new_game');
  }

  function updateWins() {
    if (winsCountEl) winsCountEl.textContent = wins[currentPlayer];
  }

  function initGame() {
    console.log('[SnakesLadders] initGame() called');

    boardEl = document.getElementById('sl-board');
    turnIndicator = document.getElementById('turn-indicator');
    diceValueEl = document.getElementById('dice-value');
    winsCountEl = document.getElementById('wins-count');
    rollBtn = document.getElementById('btn-roll');
    resetBtn = document.getElementById('btn-reset');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    playAgainBtn = document.getElementById('btn-play-again');
    toast = document.getElementById('toast');

    console.log('[SnakesLadders] Elements:', {
      boardEl: !!boardEl,
      rollBtn: !!rollBtn
    });

    // Load wins
    for (var i = 0; i < PLAYERS; i++) {
      var saved = localStorage.getItem('sl-wins-' + i);
      if (saved) wins[i] = parseInt(saved);
    }

    if (rollBtn) rollBtn.addEventListener('click', rollDice);
    if (resetBtn) resetBtn.addEventListener('click', newGame);

    newGame();
    console.log('[SnakesLadders] Init complete');
  }

  window.initGame = initGame;
})();