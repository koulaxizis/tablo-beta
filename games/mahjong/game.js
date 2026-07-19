// ============================================
// Tablo — Mahjong Solitaire
// ============================================

(function() {
  'use strict';

  var TILE_SYMBOLS = [
    '\u2605', '\u25C6', '\u25CF', '\u25B2', '\u25A0',
    '\u2665', '\u2660', '\u2663', '\u2600', '\u2602',
    '\u263A', '\u263B', '\u2642', '\u2640', '\u2666',
    '\u2726', '\u2736', '\u2740', '\u2744', '\u2756'
  ];

  var COLS = 8;
  var ROWS = 5;
  var TOTAL_TILES = COLS * ROWS;
  var tiles = [];
  var selectedTile = null;
  var pairsMatched = 0;
  var tilesLeft = 0;

  var boardEl, tilesLeftEl, pairsEl, bestEl;
  var restartBtn, playAgainBtn, winModal, modalIcon, modalTitle, modalMessage, toast;

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
    }, 2000);
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function generateTiles() {
    var numPairs = TOTAL_TILES / 2;
    var symbols = shuffle(TILE_SYMBOLS).slice(0, numPairs);
    var pairs = symbols.concat(symbols);
    return shuffle(pairs);
  }

  function initTiles() {
    var data = generateTiles();
    tiles = [];
    for (var i = 0; i < data.length; i++) {
      tiles.push({
        symbol: data[i],
        index: i,
        removed: false,
        selected: false
      });
    }
    tilesLeft = TOTAL_TILES;
    pairsMatched = 0;
    selectedTile = null;
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    tiles.forEach(function(tile) {
      var el = document.createElement('div');
      el.className = 'mj-tile';
      if (tile.removed) {
        el.classList.add('removed');
      } else {
        el.textContent = tile.symbol;
        if (tile.selected) el.classList.add('selected');
        (function(t) {
          el.addEventListener('click', function() { handleTileClick(t); });
        })(tile);
      }
      boardEl.appendChild(el);
    });
    tilesLeftEl.textContent = tilesLeft;
    pairsEl.textContent = pairsMatched;
  }

  function handleTileClick(tile) {
    if (tile.removed) return;

    if (selectedTile === null) {
      selectedTile = tile;
      tile.selected = true;
      renderBoard();
      return;
    }

    if (selectedTile === tile) {
      tile.selected = false;
      selectedTile = null;
      renderBoard();
      return;
    }

    if (selectedTile.symbol === tile.symbol) {
      selectedTile.removed = true;
      tile.removed = true;
      selectedTile.selected = false;
      selectedTile = null;
      pairsMatched++;
      tilesLeft -= 2;
      renderBoard();

      if (tilesLeft === 0) {
        gameWon();
      }
    } else {
      selectedTile.selected = false;
      selectedTile = null;
      tile.selected = true;
      selectedTile = tile;
      renderBoard();
    }
  }

  function loadBest() {
    var best = parseInt(localStorage.getItem('tablo-mahjong-best') || '0');
    bestEl.textContent = best;
  }

  function gameWon() {
    var bestKey = 'tablo-mahjong-best';
    var best = parseInt(localStorage.getItem(bestKey) || '0');
    if (pairsMatched > best) {
      localStorage.setItem(bestKey, pairsMatched.toString());
      bestEl.textContent = pairsMatched;
    }
    modalIcon.innerHTML = '&#127881;';
    modalTitle.textContent = tr('mahjong_win');
    modalMessage.textContent = tr('mahjong_pairs') + ': ' + pairsMatched;
    winModal.classList.add('visible');
    winModal.style.display = 'flex';
  }

  function resetGame() {
    initTiles();
    loadBest();
    renderBoard();
    winModal.classList.remove('visible');
    winModal.style.display = 'none';
  }

  function initGame() {
    boardEl = document.getElementById('board');
    tilesLeftEl = document.getElementById('tiles-left');
    pairsEl = document.getElementById('pairs-count');
    bestEl = document.getElementById('best-score');
    restartBtn = document.getElementById('btn-restart');
    playAgainBtn = document.getElementById('btn-play-again');
    winModal = document.getElementById('win-modal');
    modalIcon = document.getElementById('modal-icon');
    modalTitle = document.getElementById('modal-title');
    modalMessage = document.getElementById('modal-message');
    toast = document.getElementById('toast');

    if (restartBtn) {
      restartBtn.addEventListener('click', function() {
        resetGame();
        showToast(tr('toast_restarted'));
      });
    }

    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', function() {
        resetGame();
      });
    }

    resetGame();
  }

  window.initGame = initGame;
})();