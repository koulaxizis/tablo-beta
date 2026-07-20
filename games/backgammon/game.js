// ============================================
// Tablo — Backgammon
// ============================================

(function() {
  'use strict';

  console.log('[Backgammon] game.js loaded');

  // Point indices: 1-24
  // Player 1 (White) moves 24 -> 1
  // Player 2 (Black) moves 1 -> 24
  // Bar: player1 bar = 25, player2 bar = 0
  // Off: player1 off = 0, player2 off = 25

  var MAX_CHECKERS = 15;

  var points = [];   // index 0-24, each = { player: 0|1|2, count: n }
  var bar = [0, 0, 0];      // [unused, p1, p2]
  var off = [0, 0, 0];      // [unused, p1, p2]
  var currentPlayer = 1;
  var dice = [0, 0];
  var movesLeft = [];       // remaining dice values
  var selectedPoint = null; // -1 = bar, 1-24 = point
  var validMoves = [];
  var gameActive = false;
  var history = [];

  var boardEl, diceAreaEl, turnEl, offEl, winsEl;
  var rollBtn, undoBtn, passBtn, resetBtn, playAgainBtn;
  var winnerModal, winnerIcon, winnerTitle, winnerMessage;
  var toast;

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
    showToast._t = setTimeout(function() {
      toast.classList.remove('visible');
    }, 2200);
  }

  function initBoard() {
    // Standard starting position
    points = [];
    for (var i = 0; i <= 24; i++) {
      points[i] = { player: 0, count: 0 };
    }

    // Player 1 (White) - moves from 24 towards 1
    points[24] = { player: 1, count: 2 };
    points[13] = { player: 1, count: 5 };
    points[8]  = { player: 1, count: 3 };
    points[6]  = { player: 1, count: 5 };

    // Player 2 (Black) - moves from 1 towards 24
    points[1]  = { player: 2, count: 2 };
    points[12] = { player: 2, count: 5 };
    points[17] = { player: 2, count: 3 };
    points[19] = { player: 2, count: 5 };

    bar = [0, 0, 0];
    off = [0, 0, 0];
    currentPlayer = 1;
    dice = [0, 0];
    movesLeft = [];
    selectedPoint = null;
    validMoves = [];
    history = [];
    gameActive = true;
  }

  function getDestination(from, dieValue, player) {
    if (player === 1) {
      // Moves from high to low
      if (from === -1) return 25 - dieValue; // Entering from bar
      var dest = from - dieValue;
      if (dest < 1) {
        // Bearing off
        if (canBearOff(player)) {
          if (dest === 0) return 0; // exact bear off
          // Over-roll: only if no higher checker
          if (isHighestChecker(from, player)) return 0;
          return -1; // Invalid
        }
        return -1;
      }
      return dest;
    } else {
      // Player 2 moves from low to high
      if (from === -1) return dieValue; // Entering from bar
      var dest2 = from + dieValue;
      if (dest2 > 24) {
        if (canBearOff(player)) {
          if (dest2 === 25) return 25;
          if (isHighestChecker(from, player)) return 25;
          return -1;
        }
        return -1;
      }
      return dest2;
    }
  }

  function canBearOff(player) {
    // All checkers must be in home board
    if (bar[player] > 0) return false;
    if (player === 1) {
      // Home: points 1-6
      for (var i = 7; i <= 24; i++) {
        if (points[i].player === 1 && points[i].count > 0) return false;
      }
    } else {
      // Home: points 19-24
      for (var j = 1; j <= 18; j++) {
        if (points[j].player === 2 && points[j].count > 0) return false;
      }
    }
    return true;
  }

  function isHighestChecker(point, player) {
    // Is this the highest checker in the home board?
    if (player === 1) {
      for (var i = point + 1; i <= 6; i++) {
        if (points[i].player === 1 && points[i].count > 0) return false;
      }
    } else {
      for (var j = point - 1; j >= 19; j--) {
        if (points[j].player === 2 && points[j].count > 0) return false;
      }
    }
    return true;
  }

  function isValidMove(from, dieValue) {
    var player = currentPlayer;

    // Must enter from bar first
    if (bar[player] > 0 && from !== -1) return false;
    if (bar[player] === 0 && from === -1) return false;

    // Must have a checker to move
    if (from !== -1) {
      if (points[from].player !== player || points[from].count === 0) return false;
    }

    var dest = getDestination(from, dieValue, player);
    if (dest === -1) return false;

    // Bearing off
    if (dest === 0 || dest === 25) return true;

    // Normal move
    if (dest < 1 || dest > 24) return false;

    // Can move to empty or own point or blot (1 opponent checker)
    if (points[dest].player === 0) return true;
    if (points[dest].player === player) return true;
    if (points[dest].count === 1) return true; // Hit

    return false;
  }

  function executeMove(from, dieValue) {
    var player = currentPlayer;
    var dest = getDestination(from, dieValue, player);

    // Save history
    saveHistoryState();

    // Remove from source
    if (from === -1) {
      bar[player]--;
    } else {
      points[from].count--;
      if (points[from].count === 0) points[from].player = 0;
    }

    // Place at destination
    if (dest === 0 || dest === 25) {
      // Bear off
      off[player]++;
      showToast(tr('bg_borne_off'));
    } else {
      // Check for hit
      if (points[dest].player !== 0 && points[dest].player !== player) {
        var hitPlayer = points[dest].player;
        bar[hitPlayer]++;
        points[dest].count = 0;
        points[dest].player = 0;
        showToast(tr('bg_hit'));
      }
      points[dest].player = player;
      points[dest].count++;
    }

    // Remove used die
    var idx = movesLeft.indexOf(dieValue);
    if (idx !== -1) movesLeft.splice(idx, 1);
    else {
      // Could be from doubles, find any matching
      for (var i = 0; i < movesLeft.length; i++) {
        if (movesLeft[i] === dieValue) {
          movesLeft.splice(i, 1);
          break;
        }
      }
    }

    selectedPoint = null;
    validMoves = [];

    // Check win
    if (off[player] >= MAX_CHECKERS) {
      gameActive = false;
      var wins = parseInt(localStorage.getItem('bg-wins') || '0');
      wins++;
      localStorage.setItem('bg-wins', wins.toString());
      showWinner(player);
      return;
    }

    // Check if any moves remain
    if (movesLeft.length === 0 || !hasAnyValidMove()) {
      switchTurn();
    }

    renderBoard();
    updateStats();
    updateControls();
  }

  function hasAnyValidMove() {
    if (movesLeft.length === 0) return false;
    var player = currentPlayer;

    if (bar[player] > 0) {
      for (var d = 0; d < movesLeft.length; d++) {
        if (isValidMove(-1, movesLeft[d])) return true;
      }
      return false;
    }

    for (var pt = 1; pt <= 24; pt++) {
      if (points[pt].player === player && points[pt].count > 0) {
        for (var j = 0; j < movesLeft.length; j++) {
          if (isValidMove(pt, movesLeft[j])) return true;
        }
      }
    }
    return false;
  }

  function calculateValidMoves(from) {
    var moves = [];
    var seen = {};
    for (var i = 0; i < movesLeft.length; i++) {
      var die = movesLeft[i];
      if (seen[die]) continue;
      seen[die] = true;
      if (isValidMove(from, die)) {
        var dest = getDestination(from, die, currentPlayer);
        moves.push({ die: die, dest: dest });
      }
    }
    return moves;
  }

  function saveHistoryState() {
    var snapshot = {
      points: JSON.parse(JSON.stringify(points)),
      bar: bar.slice(),
      off: off.slice(),
      currentPlayer: currentPlayer,
      movesLeft: movesLeft.slice(),
      dice: dice.slice()
    };
    history.push(snapshot);
    if (history.length > 10) history.shift();
  }

  function undo() {
    if (history.length === 0) return;
    var snap = history.pop();
    points = snap.points;
    bar = snap.bar;
    off = snap.off;
    currentPlayer = snap.currentPlayer;
    movesLeft = snap.movesLeft;
    dice = snap.dice;
    selectedPoint = null;
    validMoves = [];
    renderBoard();
    updateStats();
    updateControls();
    showToast(tr('bg_undone'));
  }

  function switchTurn() {
    currentPlayer = (currentPlayer === 1) ? 2 : 1;
    movesLeft = [];
    dice = [0, 0];
    selectedPoint = null;
    validMoves = [];
    showToast(tr('bg_player') + ' ' + currentPlayer + ' ' + tr('bg_turn'));
    renderBoard();
    updateStats();
    updateControls();
  }

  function rollDice() {
    if (!gameActive) return;
    if (movesLeft.length > 0) return;

    dice[0] = Math.floor(Math.random() * 6) + 1;
    dice[1] = Math.floor(Math.random() * 6) + 1;

    console.log('[Backgammon] Rolled:', dice);

    if (dice[0] === dice[1]) {
      movesLeft = [dice[0], dice[0], dice[0], dice[0]];
      showToast(tr('bg_doubles') + '! ' + dice[0] + 's');
    } else {
      movesLeft = [dice[0], dice[1]];
    }

    renderDice(true);
    updateControls();

    // Check if player has any valid moves
    if (!hasAnyValidMove()) {
      showToast(tr('bg_no_moves'));
      setTimeout(function() {
        switchTurn();
      }, 1200);
    }
  }

  function renderDice(animate) {
    if (!diceAreaEl) return;
    diceAreaEl.innerHTML = '';

    if (dice[0] === 0) return;

    var numDice = (dice[0] === dice[1]) ? 4 : 2;
    var values = (dice[0] === dice[1]) ? [dice[0], dice[0], dice[0], dice[0]] : dice;

    values.forEach(function(v, i) {
      var die = document.createElement('div');
      die.className = 'bg-die';
      if (animate) die.classList.add('rolling');
      die.textContent = v;

      // Mark used dice
      var usedCount = (dice[0] === dice[1]) ? 4 - movesLeft.length : 0;
      for (var j = 0; j < (2 - movesLeft.length); j++) {
        if (i < j) {
          die.classList.add('used');
        }
      }

      // Simpler: mark used based on movesLeft count
      if (dice[0] === dice[1]) {
        if (i >= movesLeft.length) die.classList.add('used');
      } else {
        if (!movesLeft.includes(v)) die.classList.add('used');
      }

      diceAreaEl.appendChild(die);
    });
  }

  // Board rendering
  // Points layout:
  // Top row (left to right): 13, 14, 15, 16, 17, 18 | 19, 20, 21, 22, 23, 24
  // Bottom row (left to right): 12, 11, 10, 9, 8, 7 | 6, 5, 4, 3, 2, 1

  function renderBoard() {
    renderQuadrant('quadrant-tl', [13, 14, 15, 16, 17, 18], 'triangle-down');
    renderQuadrant('quadrant-tr', [19, 20, 21, 22, 23, 24], 'triangle-down');
    renderQuadrant('quadrant-bl', [12, 11, 10, 9, 8, 7], 'triangle-up');
    renderQuadrant('quadrant-br', [6, 5, 4, 3, 2, 1], 'triangle-up');
    renderBar();
  }

  function renderQuadrant(elId, pointNums, triangleClass) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = '';

    pointNums.forEach(function(ptNum) {
      var ptEl = document.createElement('div');
      ptEl.className = 'bg-point ' + triangleClass;
      ptEl.dataset.point = ptNum;

      // Alternate dark/light
      var isDark = (ptNum % 2 === 0);
      ptEl.classList.add(isDark ? 'dark-pt' : 'light-pt');

      // Selection state
      if (selectedPoint === ptNum) {
        ptEl.classList.add('selected');
      } else if (validMoves.some(function(m) { return m.dest === ptNum; })) {
        ptEl.classList.add('valid-move');
      } else if (canSelectPoint(ptNum)) {
        ptEl.classList.add('selectable');
      }

      // Render checkers
      var pt = points[ptNum];
      if (pt.count > 0) {
        var maxVisible = 5;
        var displayCount = Math.min(pt.count, maxVisible);
        for (var c = 0; c < displayCount; c++) {
          var checker = document.createElement('div');
          checker.className = 'bg-checker player' + pt.player;
          ptEl.appendChild(checker);
        }
        if (pt.count > maxVisible) {
          var label = document.createElement('div');
          label.className = 'bg-checker count-label';
          label.textContent = pt.count;
          ptEl.appendChild(label);
        }
      }

      ptEl.addEventListener('click', function() {
        handlePointClick(ptNum);
      });

      el.appendChild(ptEl);
    });
  }

  function renderBar() {
    var barTop = document.getElementById('bar-slots-top');
    var barBottom = document.getElementById('bar-slots-bottom');
    if (barTop) barTop.innerHTML = '';
    if (barBottom) barBottom.innerHTML = '';

    // Bar for player 2 (black) shows on top
    if (bar[2] > 0 && barTop) {
      for (var i = 0; i < bar[2]; i++) {
        var bc = document.createElement('div');
        bc.className = 'bg-bar-checker player2';
        if (currentPlayer === 2) {
          bc.classList.add('selectable');
          if (selectedPoint === -1) bc.classList.add('selected');
        }
        bc.addEventListener('click', function() {
          handleBarClick();
        });
        barTop.appendChild(bc);
      }
    }

    // Bar for player 1 (white) shows on bottom
    if (bar[1] > 0 && barBottom) {
      for (var j = 0; j < bar[1]; j++) {
        var bc2 = document.createElement('div');
        bc2.className = 'bg-bar-checker player1';
        if (currentPlayer === 1) {
          bc2.classList.add('selectable');
          if (selectedPoint === -1) bc2.classList.add('selected');
        }
        bc2.addEventListener('click', function() {
          handleBarClick();
        });
        barBottom.appendChild(bc2);
      }
    }
  }

  function canSelectPoint(ptNum) {
    if (!gameActive || movesLeft.length === 0) return false;
    if (bar[currentPlayer] > 0) return false; // Must enter from bar
    if (points[ptNum].player !== currentPlayer || points[ptNum].count === 0) return false;
    return calculateValidMoves(ptNum).length > 0;
  }

  function handleBarClick() {
    if (!gameActive || movesLeft.length === 0) return;
    if (bar[currentPlayer] === 0) return;

    if (selectedPoint === -1) {
      selectedPoint = null;
      validMoves = [];
    } else {
      selectedPoint = -1;
      validMoves = calculateValidMoves(-1);
      if (validMoves.length === 0) {
        selectedPoint = null;
        showToast(tr('bg_no_entry'));
      }
    }
    renderBoard();
  }

  function handlePointClick(ptNum) {
    if (!gameActive || movesLeft.length === 0) return;

    // If must enter from bar
    if (bar[currentPlayer] > 0 && selectedPoint !== -1) {
      showToast(tr('bg_must_enter'));
      return;
    }

    // If a point is already selected, try to move there
    if (selectedPoint !== null) {
      var move = validMoves.find(function(m) { return m.dest === ptNum; });
      if (move) {
        executeMove(selectedPoint, move.die);
        return;
      }
    }

    // Try to select this point
    if (canSelectPoint(ptNum)) {
      selectedPoint = ptNum;
      validMoves = calculateValidMoves(ptNum);
      if (validMoves.length === 0) {
        selectedPoint = null;
        showToast(tr('bg_no_valid_moves'));
      }
    } else {
      selectedPoint = null;
      validMoves = [];
    }

    renderBoard();
  }

  function updateStats() {
    if (turnEl) turnEl.textContent = currentPlayer;
    if (offEl) offEl.textContent = off[1] + ' / ' + off[2];

    var wins = parseInt(localStorage.getItem('bg-wins') || '0');
    if (winsEl) winsEl.textContent = wins;
  }

  function updateControls() {
    if (rollBtn) {
      rollBtn.disabled = !gameActive || movesLeft.length > 0;
    }
    if (undoBtn) {
      undoBtn.disabled = history.length === 0;
    }
    if (passBtn) {
      passBtn.disabled = gameActive && movesLeft.length > 0 && hasAnyValidMove();
    }
  }

  function showWinner(winner) {
    if (winnerIcon) winnerIcon.textContent = '\u{1F389}';
    if (winnerTitle) {
      winnerTitle.textContent = tr('bg_player') + ' ' + winner + ' ' + tr('bg_wins_excl');
    }
    if (winnerMessage) {
      winnerMessage.textContent = tr('bg_congrats') + '!';
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
    initBoard();
    renderBoard();
    renderDice(false);
    updateStats();
    updateControls();
    showToast(tr('bg_new_game'));
    console.log('[Backgammon] New game started');
  }

  function initGame() {
    console.log('[Backgammon] initGame() called');

    diceAreaEl = document.getElementById('bg-dice-area');
    turnEl = document.getElementById('turn-value');
    offEl = document.getElementById('off-display');
    winsEl = document.getElementById('wins-count');
    rollBtn = document.getElementById('btn-roll');
    undoBtn = document.getElementById('btn-undo');
    passBtn = document.getElementById('btn-pass');
    resetBtn = document.getElementById('btn-reset');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    playAgainBtn = document.getElementById('btn-play-again');
    toast = document.getElementById('toast');

    console.log('[Backgammon] Elements:', {
      diceAreaEl: !!diceAreaEl,
      turnEl: !!turnEl
    });

    if (rollBtn) rollBtn.addEventListener('click', rollDice);
    if (undoBtn) undoBtn.addEventListener('click', undo);
    if (passBtn) passBtn.addEventListener('click', switchTurn);
    if (resetBtn) resetBtn.addEventListener('click', newGame);

    newGame();
    console.log('[Backgammon] Init complete');
  }

  window.initGame = initGame;
})();