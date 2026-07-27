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

  var selectedCard = null;
  var selectedFrom = null;
  var score = 0;
  var moves = 0;
  var gameActive = false;
  var timerInterval = null;
  var seconds = 0;

  var scoreEl, movesEl, timeEl;
  var stockEl, wasteEl, newGameBtn, undoBtn;
  var winnerModal, winnerIcon, winnerTitle, winnerMessage, playAgainBtn;
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
    shuffleDeck();
  }

  function shuffleDeck() {
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

    // Deal tableau columns
    for (var col = 0; col < 7; col++) {
      for (var row = 0; row <= col; row++) {
        var card = deck.pop();
        if (row === col) card.faceUp = true;
        tableau[col].push(card);
      }
    }

    // Remaining cards go to stock
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
    undoBtn = document.getElementById('btn-undo');
    winnerModal = document.getElementById('winner-modal');
    winnerIcon = document.getElementById('winner-icon');
    winnerTitle = document.getElementById('winner-title');
    winnerMessage = document.getElementById('winner-message');
    playAgainBtn = document.getElementById('btn-play-again');
    toast = document.getElementById('toast');

    startTimer();
    startNewGame();

    stockEl.addEventListener('click', drawFromStock);

    document.querySelectorAll('.foundation').forEach(function(el) {
      el.addEventListener('click', handleFoundationClick);
    });

    document.querySelectorAll('.column').forEach(function(colEl) {
      colEl.addEventListener('click', function(e) {
        handleTableauClick(parseInt(this.dataset.col), e);
      });
    });

    wasteEl.addEventListener('click', function(e) {
      if (waste.length > 0) {
        selectCard('waste', waste.length - 1);
      }
    });

    if (newGameBtn) newGameBtn.addEventListener('click', startNewGame);
    if (playAgainBtn) playAgainBtn.addEventListener('click', closeWinnerAndNewGame);

    console.log('[Solitaire] Init complete');
  }

  function startNewGame() {
    createDeck();
    dealCards();
    score = 0;
    moves = 0;
    seconds = 0;
    selectedCard = null;
    selectedFrom = null;
    gameActive = true;
    resetTimer();
    renderAll();
  }

  function closeWinnerAndNewGame() {
    if (winnerModal) {
      winnerModal.classList.remove('visible');
    }
    startNewGame();
  }

  function startTimer() {
    timerInterval = setInterval(function() {
      if (gameActive) {
        seconds++;
        updateTimerDisplay();
      }
    }, 1000);
  }

  function resetTimer() {
    seconds = 0;
    updateTimerDisplay();
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
    if (stockEl) {
      stockEl.innerHTML = '';
      if (stock.length > 0) {
        var backDiv = document.createElement('div');
        backDiv.className = 'card-back';
        backDiv.title = stock.length + ' cards';
        stockEl.appendChild(backDiv);
      } else {
        stockEl.className = 'pile stock empty';
      }
    }
  }

  function drawFromStock() {
    if (!gameActive) return;

    if (stock.length === 0) {
      // Recycle waste to stock
      stock = waste.reverse().map(function(c) { c.faceUp = false; return c; });
      waste = [];
    } else {
      var card = stock.pop();
      card.faceUp = true;
      waste.push(card);
    }
    moves++;
    selectedCard = null;
    selectedFrom = null;
    renderAll();
  }

  function renderWaste() {
    if (wasteEl) {
      wasteEl.innerHTML = '';
      if (waste.length > 0) {
        var topCard = waste[waste.length - 1];
        var cardEl = createCardElement(topCard);
        wasteEl.appendChild(cardEl);
      }
    }
  }

  function renderFoundations() {
    for (var i = 0; i < suits.length; i++) {
      var suit = suits[i];
      var el = document.getElementById('foundation-' + suit);
      if (el) {
        el.innerHTML = '';
        if (foundations[suit].length > 0) {
          var card = foundations[suit][foundations[suit].length - 1];
          var cardEl = createCardElement(card);
          el.appendChild(cardEl);
        } else {
          el.className = 'foundation empty-slot';
          var placeholder = document.createElement('div');
          placeholder.className = 'foundation-placeholder';
          placeholder.textContent = suitNames[suit];
          el.appendChild(placeholder);
        }
      }
    }
  }

  function renderTableau() {
    for (var col = 0; col < 7; col++) {
      var colEl = document.querySelector('.column[data-col="' + col + '"]');
      if (colEl) {
        colEl.innerHTML = '';
        for (var i = 0; i < tableau[col].length; i++) {
          var card = tableau[col][i];
          var cardEl = createCardElement(card);
          cardEl.style.marginTop = (i * 25) + 'px';
          colEl.appendChild(cardEl);
        }
      }
    }
  }

  function createCardElement(card) {
    var div = document.createElement('div');
    div.className = 'card';
    div.style.borderColor = card.color;

    if (!card.faceUp) {
      div.classList.add('face-down');
    } else {
      div.classList.add('face-up');
      var inner = document.createElement('div');
      inner.className = 'card-inner';
      inner.style.color = card.color;
      inner.innerHTML = '<span class="rank">' + card.rank + '</span><span class="suit">' + card.symbol + '</span>';
      div.appendChild(inner);
    }

    return div;
  }

  function updateStats() {
    if (scoreEl) scoreEl.textContent = score;
    if (movesEl) movesEl.textContent = moves;
  }

  function selectCard(location, index) {
    if (!gameActive) return;

    if (selectedCard && selectedFrom) {
      tryMoveCard();
    } else {
      selectedCard = { location: location, index: index };
      selectedFrom = location === 'tableau' ? getSelectedColumn() : location;
      showToast(tr('solitaire_card_selected'));
    }
  }

  function getSelectedColumn() {
    if (selectedFrom === 'tableau') {
      var colEl = document.querySelector('.column[data-col="' + selectedCard.index + '"]');
      if (colEl) {
        var cards = colEl.querySelectorAll('.card');
        for (var i = 0; i < cards.length; i++) {
          var cardObj = tableau[selectedCard.index][i];
          if (cardObj === selectedCard.card) return selectedCard.index;
        }
      }
    }
    return 0;
  }

  function handleTableauClick(col, e) {
    if (!gameActive) return;
    e.stopPropagation();

    if (selectedCard && selectedFrom) {
      // Try to move to this column
      tryMoveToTableau(col);
    } else {
      // Select a card from this column
      if (tableau[col].length > 0) {
        var topCard = tableau[col][tableau[col].length - 1];
        if (topCard.faceUp) {
          selectedCard = { location: 'tableau', col: col, cardIndex: tableau[col].length - 1 };
          selectedFrom = 'tableau';
          showToast(tr('solitaire_card_selected'));
        }
      }
    }
  }

  function handleFoundationClick(e) {
    if (!gameActive) return;
    e.stopPropagation();

    if (selectedCard && selectedFrom) {
      tryMoveToFoundation(e.currentTarget.id);
    }
  }

  function tryMoveCard() {
    if (!selectedCard) return;

    // Auto-move to foundation if possible
    if (selectedFrom === 'tableau') {
      var col = selectedCard.col;
      var card = tableau[col][selectedCard.cardIndex];
      var restOfStack = tableau[col].slice(selectedCard.cardIndex + 1);

      // Can we move the top card of the stack to a foundation?
      if (restOfStack.length === 0 && canMoveToFoundation(card)) {
        moveToFoundation(card);
        return;
      }
    }

    deselect();
    showToast(tr('solitaire_no_valid_move'));
  }

  function canMoveToFoundation(card) {
    var foundation = foundations[card.suit];
    if (foundation.length === 0) {
      return card.value === 1; // Ace goes first
    }
    return foundation[foundation.length - 1].value === card.value - 1;
  }

  function moveToFoundation(card) {
    var suit = card.suit;
    var sourceCol = selectedCard.col;
    var cardIndex = selectedCard.cardIndex;

    // Remove from tableau
    var removed = tableau[sourceCol].splice(cardIndex, 1)[0];
    foundations[suit].push(removed);

    // Reveal next card in column if any
    if (tableau[sourceCol].length > 0) {
      tableau[sourceCol][tableau[sourceCol].length - 1].faceUp = true;
      score += 5;
    } else {
      score += 10; // Bonus for emptying a column
    }

    moves++;
    selectedCard = null;
    selectedFrom = null;

    renderAll();
    checkWin();
  }

  function tryMoveToTableau(destCol) {
    var sourceCol = selectedCard.col;
    var cardIndex = selectedCard.cardIndex;
    var card = tableau[sourceCol][cardIndex];

    // Check if valid move
    var destColCards = tableau[destCol];
    if (destColCards.length === 0) {
      // Can only place King on empty column
      if (card.value === 13) {
        moveCardToTableau(destCol, sourceCol, cardIndex);
      } else {
        deselect();
        showToast(tr('solitaire_only_king_on_empty'));
      }
    } else {
      var topDestCard = destColCards[destColCards.length - 1];
      // Alternating colors, descending rank
      if (card.color !== topDestCard.color && card.value === topDestCard.value - 1) {
        moveCardToTableau(destCol, sourceCol, cardIndex);
      } else {
        deselect();
        showToast(tr('solitaire_invalid_move'));
      }
    }
  }

  function moveCardToTableau(destCol, sourceCol, cardIndex) {
    // Get the stack of cards to move
    var cardsToMove = tableau[sourceCol].splice(cardIndex);

    // Add to destination
    tableau[destCol] = tableau[destCol].concat(cardsToMove);

    moves++;
    score += 5;

    selectedCard = null;
    selectedFrom = null;

    renderAll();
    checkWin();
  }

  function tryMoveToFoundation(foundationId) {
    var suit = foundationId.replace('foundation-', '');
    var sourceCol = selectedCard.col;
    var card = tableau[sourceCol][selectedCard.cardIndex];

    if (card.suit === suit && canMoveToFoundation(card)) {
      moveToFoundation(card);
    } else {
      deselect();
      showToast(tr('solitaire_wrong_suit_or_rank'));
    }
  }

  function deselect() {
    selectedCard = null;
    selectedFrom = null;
  }

  function checkWin() {
    var totalInFoundations = 0;
    for (var i = 0; i < suits.length; i++) {
      totalInFoundations += foundations[suits[i]].length;
    }

    if (totalInFoundations === 52) {
      gameActive = false;
      clearInterval(timerInterval);
      showWinner();
    }
  }

  function showWinner() {
    if (winnerIcon) winnerIcon.textContent = '\u{1F389}';
    if (winnerTitle) {
      winnerTitle.textContent = tr('solitaire_you_win');
    }
    if (winnerMessage) {
      winnerMessage.textContent = tr('solitaire_win_message') + ' ' + score + ' ' + tr('solitaire_points') + ', ' + moves + ' ' + tr('solitaire_moves_word') + ', ' + timeEl.textContent;
    }

    if (winnerModal) {
      winnerModal.classList.add('visible');
    }
  }

  window.initGame = initGame;
})();