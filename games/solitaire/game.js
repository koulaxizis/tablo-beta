// ============================================
// Tablo — Solitaire (Klondike)
// ============================================

(function() {
  'use strict';

  console.log('[Solitaire] game.js loaded');

  var suits = ['h', 'd', 'c', 's'];
  var suitNames = { h: '♥', d: '♦', c: '♣', s: '♠' };
  var suitColors = { h: '#ef4444', d: '#ef4444', c: '#1e293b', s: '#1e293b' };
  var ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  var deck = [];
  var stock = [];
  var waste = [];
  var foundations = { h: [], d: [], c: [], s: [] };
  var tableau = [[], [], [], [], [], [], []];

  var selected = null;
  var score = 0;
  var moves = 0;
  var gameActive = false;
  var timerInterval = null;
  var seconds = 0;

  var scoreEl, movesEl, timeEl;
  var stockEl, wasteEl, newGameBtn;
  var winnerModal, winnerIcon, winnerTitle, winnerMessage, playAgainBtn;
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
    }, 2000);
  }

  function createDeck() {
    deck = [];
    for (var i = 0; i < suits.length; i++) {
      for (var j = 0; j < ranks.length; j++) {
        deck.push({
          suit: suits[i],
          rank: ranks[j],
          value: j + 1,
          color: suitColors[suits[i]],
          symbol: suitNames[suits[i]],
          faceUp: false
        });
      }
    }
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = deck[i];
      deck[i] = deck[j];
      deck[j] = temp;
    }
  }

  function dealCards() {
    stock = [];
    waste = [];
    foundations = { h: [], d: [], c: [], s: [] };
    tableau = [[], [], [], [], [], [], []];

    for (var col = 0; col < 7; col++) {
      for (var row = 0; row <= col; row++) {
        var card = deck.pop();
        if (row === col) card.faceUp = true;
        tableau[col].push(card);
      }
    }
    stock = deck;
    deck = [];
  }

  function initGame() {
    console.log('[Solitaire] initGame() called');

    scoreEl = document.getElementById('score');
    movesEl = document.getElementById('moves');
    timeEl = document.getElementById('time');
    stockEl = document.getElementById('stock');
    wasteEl = document.getElementById('waste');
    newGameBtn = document.getElementById('btn-new-game');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    playAgainBtn = document.getElementById('btn-play-again');
    toast = document.getElementById('toast');

    startTimer();
    startNewGame();

    if (stockEl) stockEl.addEventListener('click', drawFromStock);

    document.querySelectorAll('.foundation').forEach(function(el) {
      el.addEventListener('click', function() {
        handleFoundationClick(this.id);
      });
    });

    document.querySelectorAll('.column').forEach(function(colEl) {
      colEl.addEventListener('click', function() {
        handleTableauClick(parseInt(this.dataset.col));
      });
    });

    if (wasteEl) {
      wasteEl.addEventListener('click', function() {
        if (waste.length > 0) {
          handleCardClick('waste', 0, waste[waste.length - 1]);
        }
      });
    }

    if (newGameBtn) newGameBtn.addEventListener('click', startNewGame);
    if (playAgainBtn) playAgainBtn.addEventListener('click', function() {
      if (winnerModal) winnerModal.classList.remove('visible');
      startNewGame();
    });

    console.log('[Solitaire] Init complete');
  }

  function startNewGame() {
    createDeck();
    dealCards();
    score = 0;
    moves = 0;
    seconds = 0;
    selected = null;
    gameActive = true;
    renderAll();
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(function() {
      if (gameActive) {
        seconds++;
        updateTimerDisplay();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    if (timeEl) {
      timeEl.textContent = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    }
  }

  function renderAll() {
    renderStock();
    renderWaste();
    renderFoundations();
    renderTableau();
    updateStats();
  }

  function renderStock() {
    if (!stockEl) return;
    stockEl.innerHTML = '';
    if (stock.length > 0) {
      var back = document.createElement('div');
      back.className = 'card-back';
      stockEl.appendChild(back);
      stockEl.classList.remove('empty');
    } else {
      stockEl.classList.add('empty');
    }
  }

  function drawFromStock() {
    if (!gameActive) return;

    if (stock.length === 0) {
      stock = waste.reverse().map(function(c) { c.faceUp = false; return c; });
      waste = [];
    } else {
      var card = stock.pop();
      card.faceUp = true;
      waste.push(card);
    }
    moves++;
    selected = null;
    renderAll();
  }

  function renderWaste() {
    if (!wasteEl) return;
    wasteEl.innerHTML = '';
    if (waste.length > 0) {
      var card = waste[waste.length - 1];
      var cardEl = createCardElement(card);
      if (selected && selected.source === 'waste') {
        cardEl.classList.add('selected');
      }
      wasteEl.appendChild(cardEl);
    }
  }

  function renderFoundations() {
    for (var i = 0; i < suits.length; i++) {
      var suit = suits[i];
      var el = document.getElementById('foundation-' + suit);
      if (!el) continue;
      el.innerHTML = '';
      if (foundations[suit].length > 0) {
        var card = foundations[suit][foundations[suit].length - 1];
        var cardEl = createCardElement(card);
        el.appendChild(cardEl);
        el.classList.remove('empty');
      } else {
        el.classList.add('empty');
        var ph = document.createElement('div');
        ph.className = 'foundation-placeholder';
        ph.textContent = suitNames[suit];
        el.appendChild(ph);
      }
    }
  }

  function renderTableau() {
    for (var col = 0; col < 7; col++) {
      var colEl = document.querySelector('.column[data-col="' + col + '"]');
      if (!colEl) continue;
      colEl.innerHTML = '';

      for (var i = 0; i < tableau[col].length; i++) {
        var card = tableau[col][i];
        var cardEl = createCardElement(card);
        cardEl.style.top = (i * 25) + 'px';

        if (selected && selected.source === 'tableau' && selected.col === col && i >= selected.cardIndex) {
          cardEl.classList.add('selected');
        }

        (function(colNum, cardIdx, cardObj) {
          cardEl.addEventListener('click', function(e) {
            e.stopPropagation();
            handleCardClick('tableau', colNum, cardObj, cardIdx);
          });
        })(col, i, card);

        colEl.appendChild(cardEl);
      }
    }
  }

  function createCardElement(card) {
    var div = document.createElement('div');
    div.className = 'card';

    if (!card.faceUp) {
      div.classList.add('face-down');
    } else {
      div.classList.add('face-up');
      var inner = document.createElement('div');
      inner.className = 'card-inner';
      inner.style.color = card.color;
      inner.innerHTML =
        '<span class="rank">' + card.rank + '</span>' +
        '<span class="suit">' + card.symbol + '</span>';
      div.appendChild(inner);
    }
    return div;
  }

  function updateStats() {
    if (scoreEl) scoreEl.textContent = score;
    if (movesEl) movesEl.textContent = moves;
  }

  function handleCardClick(source, col, card, cardIndex) {
    if (!gameActive) return;
    if (!card.faceUp) return;

    if (selected) {
      if (selected.source === source && selected.col === col && selected.cardIndex === cardIndex) {
        selected = null;
        renderAll();
        return;
      }
      tryAutoMove(selected, source, col);
    } else {
      if (source === 'waste') {
        selected = { source: 'waste', card: card, cardIndex: 0 };
      } else {
        selected = { source: 'tableau', col: col, card: card, cardIndex: cardIndex };
      }
      renderAll();
    }
  }

  function handleTableauClick(col) {
    if (!gameActive) return;

    if (selected) {
      tryMoveToTableau(col);
    } else {
      if (tableau[col].length === 0) {
        showToast(tr('solitaire_only_king_on_empty'));
      }
    }
  }

  function handleFoundationClick(foundationId) {
    if (!gameActive) return;
    if (!selected) return;

    var suit = foundationId.replace('foundation-', '');
    var card = selected.card;

    if (card.suit === suit && canMoveToFoundation(card)) {
      moveToFoundation(selected);
    } else {
      showToast(tr('solitaire_wrong_suit_or_rank'));
    }
  }

  function canMoveToFoundation(card) {
    var f = foundations[card.suit];
    if (f.length === 0) return card.value === 1;
    return f[f.length - 1].value === card.value - 1;
  }

  function tryAutoMove(sel, destSource, destCol) {
    if (destSource === 'tableau') {
      tryMoveToTableau(destCol);
    } else {
      selected = null;
      renderAll();
    }
  }

  function tryMoveToTableau(destCol) {
    var source = selected.source;
    var card = selected.card;
    var sourceCol = selected.col;
    var cardIndex = selected.cardIndex;

    var dest = tableau[destCol];

    if (dest.length === 0) {
      if (card.value !== 13) {
        showToast(tr('solitaire_only_king_on_empty'));
        selected = null;
        renderAll();
        return;
      }
    } else {
      var topDest = dest[dest.length - 1];
      if (card.color === topDest.color || card.value !== topDest.value - 1) {
        showToast(tr('solitaire_invalid_move'));
        selected = null;
        renderAll();
        return;
      }
    }

    if (source === 'waste') {
      var moved = waste.pop();
      tableau[destCol].push(moved);
    } else {
      var cardsToMove = tableau[sourceCol].splice(cardIndex);
      tableau[destCol] = tableau[destCol].concat(cardsToMove);

      if (tableau[sourceCol].length > 0) {
        tableau[sourceCol][tableau[sourceCol].length - 1].faceUp = true;
        score += 5;
      }
    }

    moves++;
    score += 5;
    selected = null;
    renderAll();
    checkWin();
  }

  function moveToFoundation(sel) {
    var suit = sel.card.suit;

    if (sel.source === 'waste') {
      var card = waste.pop();
      foundations[suit].push(card);
    } else {
      var card = tableau[sel.col].pop();
      foundations[suit].push(card);

      if (tableau[sel.col].length > 0) {
        tableau[sel.col][tableau[sel.col].length - 1].faceUp = true;
        score += 5;
      }
    }

    moves++;
    score += 10;
    selected = null;
    renderAll();
    checkWin();
  }

  function checkWin() {
    var total = 0;
    for (var i = 0; i < suits.length; i++) {
      total += foundations[suits[i]].length;
    }
    if (total === 52) {
      gameActive = false;
      clearInterval(timerInterval);
      showWinner();
    }
  }

  function showWinner() {
    if (winnerIcon) winnerIcon.textContent = '\u{1F389}';
    if (winnerTitle) winnerTitle.textContent = tr('solitaire_you_win');
    if (winnerMessage) {
      winnerMessage.textContent = tr('solitaire_win_message') + ' ' + score + ' ' + tr('solitaire_points') + ', ' + moves + ' ' + tr('solitaire_moves_word') + ', ' + timeEl.textContent;
    }
    if (winnerModal) winnerModal.classList.add('visible');
  }

  window.initGame = initGame;
})();