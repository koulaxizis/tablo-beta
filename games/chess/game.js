// ============================================
// Tablo — Chess (Full Implementation + Drag & Drop + Timer)
// ============================================

(function() {
  'use strict';

  var board = [];
  var selected = null;
  var validMoves = [];
  var currentPlayer = 'white';
  var moveCount = 1;
  var gameMode = 'pvp';
  var history = [];
  var capturedByWhite = [];
  var capturedByBlack = [];
  var enPassantTarget = null;
  var castlingRights = { wk: true, wq: true, bk: true, bq: true };
  var aiThinking = false;
  var timerInterval = null;
  var secondsElapsed = 0;
  var dragStartCoords = null;

  var PIECES = {
    'wp': '\u2659', 'wr': '\u265C', 'wn': '\u265E', 'wb': '\u265D', 'wq': '\u265B', 'wk': '\u2654',
    'bp': '\u265F', 'br': '\u265C', 'bn': '\u265E', 'bb': '\u265D', 'bq': '\u265B', 'bk': '\u265A'
  };

  var boardEl = document.getElementById('board');
  var turnEl = document.getElementById('turn-display');
  var modeEl = document.getElementById('mode-display');
  var timerEl = document.getElementById('timer');
  var moveNumEl = document.getElementById('move-num');
  var modeSelect = document.getElementById('game-mode-select');
  var newGameBtn = document.getElementById('btn-new-game');
  var undoBtn = document.getElementById('btn-undo');
  var retryBtn = document.getElementById('btn-retry');
  var gameOverModal = document.getElementById('game-over-modal');
  var modalIcon = document.getElementById('modal-icon');
  var modalTitle = document.getElementById('modal-title');
  var modalMessage = document.getElementById('modal-message');
  var capWhiteEl = document.getElementById('cap-white');
  var capBlackEl = document.getElementById('cap-black');
  var promotionModal = document.getElementById('promotion-modal');
  var promoOptions = document.getElementById('promo-options');
  var toast = document.getElementById('toast');

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
    showToast._t = setTimeout(function() { toast.classList.remove('visible'); }, 2000);
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function startTimer() {
    stopTimer();
    secondsElapsed = 0;
    timerEl.textContent = '00:00';
    timerInterval = setInterval(function() {
      secondsElapsed++;
      timerEl.textContent = formatTime(secondsElapsed);
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function saveBestTime() {
    var key = 'tablo-chess-best-' + gameMode;
    var best = localStorage.getItem(key);
    if (!best || secondsElapsed < parseInt(best)) {
      localStorage.setItem(key, secondsElapsed.toString());
    }
  }

  function initBoard() {
    board = [];
    for (var r = 0; r < 8; r++) {
      board[r] = [];
      for (var c = 0; c < 8; c++) {
        board[r][c] = null;
      }
    }
    var backRank = ['r','n','b','q','k','b','n','r'];
    for (var c2 = 0; c2 < 8; c2++) {
      board[0][c2] = 'b' + backRank[c2];
      board[1][c2] = 'bp';
      board[6][c2] = 'wp';
      board[7][c2] = 'w' + backRank[c2];
    }
  }

  function pieceColor(piece) {
    if (!piece) return null;
    return piece[0] === 'w' ? 'white' : 'black';
  }

  function pieceType(piece) {
    if (!piece) return null;
    return piece[1];
  }

  function inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  function getValidMoves(r, c) {
    var piece = board[r][c];
    if (!piece) return [];
    var color = pieceColor(piece);
    var type = pieceType(piece);
    var moves = [];

    if (type === 'p') {
      var dir = color === 'white' ? -1 : 1;
      var startRow = color === 'white' ? 6 : 1;
      if (inBounds(r + dir, c) && !board[r + dir][c]) {
        moves.push([r + dir, c]);
        if (r === startRow && !board[r + 2 * dir][c]) {
          moves.push([r + 2 * dir, c]);
        }
      }
      for (var dc = -1; dc <= 1; dc += 2) {
        var nc = c + dc;
        if (inBounds(r + dir, nc)) {
          if (board[r + dir][nc] && pieceColor(board[r + dir][nc]) !== color) {
            moves.push([r + dir, nc]);
          }
          if (enPassantTarget && enPassantTarget[0] === r + dir && enPassantTarget[1] === nc) {
            moves.push([r + dir, nc]);
          }
        }
      }
    } else if (type === 'n') {
      var knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (var i = 0; i < knightMoves.length; i++) {
        var nr = r + knightMoves[i][0];
        var ncc = c + knightMoves[i][1];
        if (inBounds(nr, ncc) && (!board[nr][ncc] || pieceColor(board[nr][ncc]) !== color)) {
          moves.push([nr, ncc]);
        }
      }
    } else if (type === 'b' || type === 'r' || type === 'q') {
      var directions = [];
      if (type === 'r' || type === 'q') {
        directions.push([-1,0],[1,0],[0,-1],[0,1]);
      }
      if (type === 'b' || type === 'q') {
        directions.push([-1,-1],[-1,1],[1,-1],[1,1]);
      }
      for (var d = 0; d < directions.length; d++) {
        for (var step = 1; step < 8; step++) {
          var sr = r + directions[d][0] * step;
          var sc = c + directions[d][1] * step;
          if (!inBounds(sr, sc)) break;
          if (!board[sr][sc]) {
            moves.push([sr, sc]);
          } else {
            if (pieceColor(board[sr][sc]) !== color) moves.push([sr, sc]);
            break;
          }
        }
      }
    } else if (type === 'k') {
      for (var kr = -1; kr <= 1; kr++) {
        for (var kc = -1; kc <= 1; kc++) {
          if (kr === 0 && kc === 0) continue;
          var krr = r + kr, kcc = c + kc;
          if (inBounds(krr, kcc) && (!board[krr][kcc] || pieceColor(board[krr][kcc]) !== color)) {
            moves.push([krr, kcc]);
          }
        }
      }
      if (color === 'white' && r === 7 && c === 4) {
        if (castlingRights.wk && !board[7][5] && !board[7][6] && board[7][7] === 'wr') {
          if (!isSquareAttacked(7, 4, 'black') && !isSquareAttacked(7, 5, 'black') && !isSquareAttacked(7, 6, 'black')) {
            moves.push([7, 6]);
          }
        }
        if (castlingRights.wq && !board[7][3] && !board[7][2] && !board[7][1] && board[7][0] === 'wr') {
          if (!isSquareAttacked(7, 4, 'black') && !isSquareAttacked(7, 3, 'black') && !isSquareAttacked(7, 2, 'black')) {
            moves.push([7, 2]);
          }
        }
      }
      if (color === 'black' && r === 0 && c === 4) {
        if (castlingRights.bk && !board[0][5] && !board[0][6] && board[0][7] === 'br') {
          if (!isSquareAttacked(0, 4, 'white') && !isSquareAttacked(0, 5, 'white') && !isSquareAttacked(0, 6, 'white')) {
            moves.push([0, 6]);
          }
        }
        if (castlingRights.bq && !board[0][3] && !board[0][2] && !board[0][1] && board[0][0] === 'br') {
          if (!isSquareAttacked(0, 4, 'white') && !isSquareAttacked(0, 3, 'white') && !isSquareAttacked(0, 2, 'white')) {
            moves.push([0, 2]);
          }
        }
      }
    }

    var filtered = [];
    for (var f = 0; f < moves.length; f++) {
      if (!leavesKingInCheck(r, c, moves[f][0], moves[f][1], color)) {
        filtered.push(moves[f]);
      }
    }
    return filtered;
  }

  function leavesKingInCheck(fromR, fromC, toR, toC, color) {
    var savedFrom = board[fromR][fromC];
    var savedTo = board[toR][toC];
    var savedEP = enPassantTarget;

    if (pieceType(savedFrom) === 'p' && toC !== fromC && !savedTo) {
      board[fromR][toC] = null;
    }

    board[toR][toC] = savedFrom;
    board[fromR][fromC] = null;

    if (pieceType(savedFrom) === 'k' && Math.abs(toC - fromC) === 2) {
      if (toC > fromC) {
        board[toR][toC - 1] = board[toR][7];
        board[toR][7] = null;
      } else {
        board[toR][toC + 1] = board[toR][0];
        board[toR][0] = null;
      }
    }

    var inCheck = isInCheck(color);

    board[fromR][fromC] = savedFrom;
    board[toR][toC] = savedTo;
    enPassantTarget = savedEP;

    if (pieceType(savedFrom) === 'k' && Math.abs(toC - fromC) === 2) {
      if (toC > fromC) {
        board[toR][7] = board[toR][toC - 1];
        board[toR][toC - 1] = null;
      } else {
        board[toR][0] = board[toR][toC + 1];
        board[toR][toC + 1] = null;
      }
    }

    return inCheck;
  }

  function findKing(color) {
    var kingPiece = color === 'white' ? 'wk' : 'bk';
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        if (board[r][c] === kingPiece) return [r, c];
      }
    }
    return null;
  }

  function isSquareAttacked(r, c, byColor) {
    for (var fr = 0; fr < 8; fr++) {
      for (var fc = 0; fc < 8; fc++) {
        var piece = board[fr][fc];
        if (!piece || pieceColor(piece) !== byColor) continue;
        if (pieceType(piece) === 'p') {
          var dir = byColor === 'white' ? -1 : 1;
          if (fr + dir === r && Math.abs(fc - c) === 1) return true;
        } else if (pieceType(piece) === 'k') {
          if (Math.abs(fr - r) <= 1 && Math.abs(fc - c) <= 1 && !(fr === r && fc === c)) return true;
        } else {
          var attacks = getRawAttacks(fr, fc, byColor);
          for (var a = 0; a < attacks.length; a++) {
            if (attacks[a][0] === r && attacks[a][1] === c) return true;
          }
        }
      }
    }
    return false;
  }

  function getRawAttacks(r, c, color) {
    var piece = board[r][c];
    if (!piece) return [];
    var type = pieceType(piece);
    var attacks = [];

    if (type === 'n') {
      var km = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (var i = 0; i < km.length; i++) {
        var nr = r + km[i][0], nc = c + km[i][1];
        if (inBounds(nr, nc)) attacks.push([nr, nc]);
      }
    } else if (type === 'b' || type === 'r' || type === 'q') {
      var dirs = [];
      if (type === 'r' || type === 'q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
      if (type === 'b' || type === 'q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
      for (var d = 0; d < dirs.length; d++) {
        for (var s = 1; s < 8; s++) {
          var sr = r + dirs[d][0] * s, sc = c + dirs[d][1] * s;
          if (!inBounds(sr, sc)) break;
          attacks.push([sr, sc]);
          if (board[sr][sc]) break;
        }
      }
    }
    return attacks;
  }

  function isInCheck(color) {
    var king = findKing(color);
    if (!king) return false;
    return isSquareAttacked(king[0], king[1], color === 'white' ? 'black' : 'white');
  }

  function hasAnyLegalMove(color) {
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        if (board[r][c] && pieceColor(board[r][c]) === color) {
          if (getValidMoves(r, c).length > 0) return true;
        }
      }
    }
    return false;
  }

  function saveState() {
    var state = {
      board: board.map(function(row) { return row.slice(); }),
      currentPlayer: currentPlayer,
      moveCount: moveCount,
      enPassantTarget: enPassantTarget ? [enPassantTarget[0], enPassantTarget[1]] : null,
      castlingRights: Object.assign({}, castlingRights),
      capturedByWhite: capturedByWhite.slice(),
      capturedByBlack: capturedByBlack.slice()
    };
    history.push(state);
    if (history.length > 100) history.shift();
  }

  function undo() {
    if (history.length === 0) {
      showToast(tr('chess_no_undo'));
      return;
    }
    var state = history.pop();
    board = state.board;
    currentPlayer = state.currentPlayer;
    moveCount = state.moveCount;
    enPassantTarget = state.enPassantTarget;
    castlingRights = state.castlingRights;
    capturedByWhite = state.capturedByWhite;
    capturedByBlack = state.capturedByBlack;
    selected = null;
    validMoves = [];
    aiThinking = false;
    render();
    updateUI();
    renderCaptured();
  }

  function makeMove(fromR, fromC, toR, toC) {
    var piece = board[fromR][fromC];
    var captured = board[toR][toC];

    if (pieceType(piece) === 'p' && toC !== fromC && !captured) {
      captured = board[fromR][toC];
      board[fromR][toC] = null;
    }

    if (captured) {
      if (pieceColor(piece) === 'white') capturedByWhite.push(captured);
      else capturedByBlack.push(captured);
    }

    var isCastling = false;
    if (pieceType(piece) === 'k' && Math.abs(toC - fromC) === 2) {
      isCastling = true;
      if (toC > fromC) {
        board[toR][toC - 1] = board[toR][7];
        board[toR][7] = null;
      } else {
        board[toR][toC + 1] = board[toR][0];
        board[toR][0] = null;
      }
    }

    if (piece === 'wk') { castlingRights.wk = false; castlingRights.wq = false; }
    if (piece === 'bk') { castlingRights.bk = false; castlingRights.bq = false; }
    if (piece === 'wr' && fromR === 7 && fromC === 0) castlingRights.wq = false;
    if (piece === 'wr' && fromR === 7 && fromC === 7) castlingRights.wk = false;
    if (piece === 'br' && fromR === 0 && fromC === 0) castlingRights.bq = false;
    if (piece === 'br' && fromR === 0 && fromC === 7) castlingRights.bk = false;

    enPassantTarget = null;
    if (pieceType(piece) === 'p' && Math.abs(toR - fromR) === 2) {
      enPassantTarget = [(fromR + toR) / 2, fromC];
    }

    var isPromotion = false;
    if (pieceType(piece) === 'p') {
      if ((pieceColor(piece) === 'white' && toR === 0) || (pieceColor(piece) === 'black' && toR === 7)) {
        isPromotion = true;
      }
    }

    board[toR][toC] = piece;
    board[fromR][fromC] = null;

    if (isPromotion) {
      showPromotion(fromR, fromC, toR, toC, piece);
      return;
    }

    finalizeMove();
  }

  function showPromotion(fromR, fromC, toR, toC, piece) {
    var color = pieceColor(piece);
    promotionModal.classList.add('visible');
    promoOptions.innerHTML = '';

    var types = ['q', 'r', 'b', 'n'];
    types.forEach(function(t) {
      var btn = document.createElement('button');
      btn.className = 'promo-btn';
      btn.textContent = PIECES[(color === 'white' ? 'w' : 'b') + t];
      btn.style.color = color === 'white' ? '#e4e9ee' : '#2a2825';
      btn.addEventListener('click', function() {
        board[toR][toC] = (color === 'white' ? 'w' : 'b') + t;
        promotionModal.classList.remove('visible');
        finalizeMove();
      });
      promoOptions.appendChild(btn);
    });
  }

  function finalizeMove() {
    selected = null;
    validMoves = [];

    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    if (currentPlayer === 'white') moveCount++;

    render();
    updateUI();
    renderCaptured();

    if (!hasAnyLegalMove(currentPlayer)) {
      saveBestTime();
      stopTimer();
      if (isInCheck(currentPlayer)) {
        var winner = currentPlayer === 'white' ? 'black' : 'white';
        modalIcon.textContent = '\uD83C\uDFC6';
        modalTitle.textContent = tr('chess_checkmate');
        modalMessage.textContent = (winner === 'white' ? tr('chess_white') : tr('chess_black')) + ' ' + tr('chess_wins');
      } else {
        modalIcon.textContent = '\uD83E\uDD1D';
        modalTitle.textContent = tr('chess_stalemate');
        modalMessage.textContent = tr('chess_draw');
      }
      gameOverModal.classList.add('visible');
      gameOverModal.style.display = 'flex';
      return;
    }

    if (isInCheck(currentPlayer)) {
      showToast(tr('chess_check'));
    }

    if (gameMode === 'ai' && currentPlayer === 'black') {
      aiThinking = true;
      updateUI();
      setTimeout(aiMove, 600);
    }
  }

  function getAllMoves(color) {
    var allMoves = [];
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        if (board[r][c] && pieceColor(board[r][c]) === color) {
          var moves = getValidMoves(r, c);
          for (var i = 0; i < moves.length; i++) {
            allMoves.push({ from: [r, c], to: moves[i] });
          }
        }
      }
    }
    return allMoves;
  }

  function evaluateBoard() {
    var values = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
    var score = 0;
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        if (!board[r][c]) continue;
        var v = values[pieceType(board[r][c])] || 0;
        if (pieceColor(board[r][c]) === 'black') score += v;
        else score -= v;
      }
    }
    return score;
  }

  function aiMove() {
    aiThinking = false;
    var moves = getAllMoves('black');
    if (moves.length === 0) return;

    var bestScore = -Infinity;
    var bestMoves = [];

    for (var i = 0; i < moves.length; i++) {
      var m = moves[i];
      saveState();
      var piece = board[m.from[0]][m.from[1]];
      board[m.to[0]][m.to[1]] = piece;
      board[m.from[0]][m.from[1]] = null;

      var score = evaluateBoard();
      score += Math.random() * 0.5;

      var state = history.pop();
      board = state.board;
      currentPlayer = state.currentPlayer;
      moveCount = state.moveCount;
      enPassantTarget = state.enPassantTarget;
      castlingRights = state.castlingRights;
      capturedByWhite = state.capturedByWhite;
      capturedByBlack = state.capturedByBlack;

      if (score > bestScore) {
        bestScore = score;
        bestMoves = [m];
      } else if (score === bestScore) {
        bestMoves.push(m);
      }
    }

    var chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    saveState();
    makeMove(chosen.from[0], chosen.from[1], chosen.to[0], chosen.to[1]);
  }

  function handleSquareClick(r, c) {
    if (aiThinking) return;

    if (selected) {
      for (var i = 0; i < validMoves.length; i++) {
        if (validMoves[i][0] === r && validMoves[i][1] === c) {
          saveState();
          makeMove(selected[0], selected[1], r, c);
          return;
        }
      }
      if (board[r][c] && pieceColor(board[r][c]) === currentPlayer) {
        selected = [r, c];
        validMoves = getValidMoves(r, c);
        render();
      } else {
        selected = null;
        validMoves = [];
        render();
      }
    } else {
      if (board[r][c] && pieceColor(board[r][c]) === currentPlayer) {
        selected = [r, c];
        validMoves = getValidMoves(r, c);
        render();
      }
    }
  }

  function getCoordsFromPoint(clientX, clientY) {
    var rect = boardEl.getBoundingClientRect();
    var x = clientX - rect.left;
    var y = clientY - rect.top;
    var col = Math.floor((x / rect.width) * 8);
    var row = Math.floor((y / rect.height) * 8);
    if (col < 0) col = 0;
    if (col > 7) col = 7;
    if (row < 0) row = 0;
    if (row > 7) row = 7;
    return { r: row, c: col };
  }

  function isValidMoveTarget(r, c) {
    for (var i = 0; i < validMoves.length; i++) {
      if (validMoves[i][0] === r && validMoves[i][1] === c) return true;
    }
    return false;
  }

  function tryMove(fromR, fromC, toR, toC) {
    if (fromR === toR && fromC === toC) return false;
    if (!isValidMoveTarget(toR, toC)) return false;
    saveState();
    makeMove(fromR, fromC, toR, toC);
    return true;
  }

  function render() {
    boardEl.innerHTML = '';

    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var sq = document.createElement('div');
        sq.className = 'square ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
        sq.dataset.r = r;
        sq.dataset.c = c;

        if (selected && selected[0] === r && selected[1] === c) {
          sq.classList.add('selected');
        }

        for (var i = 0; i < validMoves.length; i++) {
          if (validMoves[i][0] === r && validMoves[i][1] === c) {
            sq.classList.add(board[r][c] ? 'capture-move' : 'valid-move');
          }
        }

        if (board[r][c]) {
          var pieceEl = document.createElement('span');
          pieceEl.className = 'piece';
          pieceEl.textContent = PIECES[board[r][c]];
          pieceEl.setAttribute('draggable', 'true');
          pieceEl.dataset.r = r;
          pieceEl.dataset.c = c;
          if (pieceColor(board[r][c]) === 'white') {
            pieceEl.classList.add('white-piece');
          } else {
            pieceEl.classList.add('black-piece');
          }
          sq.appendChild(pieceEl);
        }

        if (board[r][c] && pieceType(board[r][c]) === 'k' && isInCheck(pieceColor(board[r][c]))) {
          sq.classList.add('in-check');
        }

        sq.addEventListener('click', function(e) {
          if (dragStartCoords) { dragStartCoords = null; return; }
          var sr = parseInt(this.dataset.r);
          var sc = parseInt(this.dataset.c);
          handleSquareClick(sr, sc);
        });

        boardEl.appendChild(sq);
      }
    }
  }

  // --- Drag & Drop (mouse) ---
  boardEl.addEventListener('dragstart', function(e) {
    var target = e.target;
    if (!target.classList || !target.classList.contains('piece')) { e.preventDefault(); return; }
    if (aiThinking) { e.preventDefault(); return; }
    var r = parseInt(target.dataset.r);
    var c = parseInt(target.dataset.c);
    if (pieceColor(board[r][c]) !== currentPlayer) { e.preventDefault(); return; }
    dragStartCoords = { r: r, c: c };
    selected = [r, c];
    validMoves = getValidMoves(r, c);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', r + ',' + c);
    render();
    // Re-find the dragged element after re-render
    var pieces = boardEl.querySelectorAll('.piece');
    pieces.forEach(function(p) {
      if (parseInt(p.dataset.r) === r && parseInt(p.dataset.c) === c) {
        p.classList.add('dragging');
      }
    });
  });

  boardEl.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    var coords = getCoordsFromPoint(e.clientX, e.clientY);
    var squares = boardEl.querySelectorAll('.square');
    squares.forEach(function(sq) { sq.classList.remove('drag-over'); });
    var idx = coords.r * 8 + coords.c;
    if (squares[idx]) squares[idx].classList.add('drag-over');
  });

  boardEl.addEventListener('drop', function(e) {
    e.preventDefault();
    var squares = boardEl.querySelectorAll('.square');
    squares.forEach(function(sq) { sq.classList.remove('drag-over'); });
    if (!dragStartCoords) return;
    var coords = getCoordsFromPoint(e.clientX, e.clientY);
    var moved = tryMove(dragStartCoords.r, dragStartCoords.c, coords.r, coords.c);
    dragStartCoords = null;
    if (!moved) {
      selected = null;
      validMoves = [];
      render();
    }
  });

  boardEl.addEventListener('dragend', function(e) {
    var pieces = boardEl.querySelectorAll('.piece.dragging');
    pieces.forEach(function(p) { p.classList.remove('dragging'); });
    dragStartCoords = null;
  });

  // --- Touch support (tap to select, tap to move) ---
  boardEl.addEventListener('touchstart', function(e) {
    if (e.touches.length !== 1) return;
    var touch = e.touches[0];
    var coords = getCoordsFromPoint(touch.clientX, touch.clientY);
    var piece = board[coords.r][coords.c];
    if (selected && isValidMoveTarget(coords.r, coords.c)) {
      e.preventDefault();
      saveState();
      makeMove(selected[0], selected[1], coords.r, coords.c);
    } else if (piece && pieceColor(piece) === currentPlayer) {
      e.preventDefault();
      selected = [coords.r, coords.c];
      validMoves = getValidMoves(coords.r, coords.c);
      render();
    } else {
      selected = null;
      validMoves = [];
      render();
    }
  }, { passive: false });

  function renderCaptured() {
    capWhiteEl.textContent = capturedByWhite.map(function(p) { return PIECES[p]; }).join(' ');
    capBlackEl.textContent = capturedByBlack.map(function(p) { return PIECES[p]; }).join(' ');
  }

  function updateUI() {
    turnEl.textContent = currentPlayer === 'white' ? tr('chess_white') : tr('chess_black');
    modeEl.textContent = gameMode === 'pvp' ? tr('ttt_pvp') : tr('ttt_vs_ai');
    moveNumEl.textContent = moveCount;
    timerEl.textContent = formatTime(secondsElapsed);
  }

  function newGame() {
    initBoard();
    selected = null;
    validMoves = [];
    currentPlayer = 'white';
    moveCount = 1;
    history = [];
    capturedByWhite = [];
    capturedByBlack = [];
    enPassantTarget = null;
    castlingRights = { wk: true, wq: true, bk: true, bq: true };
    aiThinking = false;
    gameOverModal.classList.remove('visible');
    gameOverModal.style.display = 'none';
    promotionModal.classList.remove('visible');
    promotionModal.style.display = 'none';
    startTimer();
    render();
    updateUI();
    renderCaptured();
  }

  function initGame() {
    gameMode = 'pvp';

    if (modeSelect) {
      modeSelect.addEventListener('change', function() {
        gameMode = this.value;
        newGame();
      });
    }
    if (newGameBtn) {
      newGameBtn.addEventListener('click', function() {
        newGame();
        showToast(tr('toast_restarted'));
      });
    }
    if (undoBtn) {
      undoBtn.addEventListener('click', undo);
    }
    if (retryBtn) {
      retryBtn.addEventListener('click', newGame);
    }

    newGame();
  }

  window.initGame = initGame;
})();