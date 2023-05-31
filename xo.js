let currentPlayer = "O";
let boardSize = 3;
let winLength = 3;
let board = Array(boardSize)
  .fill([])
  .map(() => [...Array(boardSize).fill("")]);
let vsAi = true;
let gameActive = true;
let timePerMove = 10;
let timer;

const squareClasses = {
  lose: "bg-red-500",
  win: "bg-green-300",
  draw: "bg-gray-500",
};
const activeClasses = "bg-green-500 text-white shadow-xl";

$(() => {
  $("#boardSize").on("input", updateSliders);
  $("#winLength").on("input", updateSliders);
  reset();
});

function getBoardWidth() {
  return getComputedStyle($(":root")[0])
    .getPropertyValue("--boardWidth")
    .slice(0, -2);
}

function reset() {
  board = Array(boardSize)
    .fill([])
    .map(() => [...Array(boardSize).fill("")]);
  currentPlayer = "O";
  vsAi = $("#humanRadio:checked").val() === undefined;
  gameActive = true;

  $(".square").text("").removeClass(Object.values(squareClasses).join(" "));

  updatePlayer(currentPlayer);
  createBoard(board, getBoardWidth(), boardSize);

  $("#result").hide();
  $('#gameStatus').show();

  if ($("#aiFirstCheckbox:checked").val() && vsAi) {
    currentPlayer = "X";
    updatePlayer(currentPlayer);
    doAiMove();
  }
}

function tick() {
  clearTimeout(timer);
  $("#timer").text("Time: " + timeRemaining);

  timer = setTimeout(() => {
    timeRemaining = timeRemaining - 1;
    $("#timer").text("Time: " + timeRemaining);

    if (timeRemaining > 0) {
      tick();
    } else {
      gameActive = false;
      announceDraw();
    }
  }, 1000);
}

function updateSliders() {
  boardSize = parseInt($("#boardSize").val());
  winLength = parseInt($("#winLength").val());

  $("#boardSizes option").removeClass("text-green-700 font-bold");
  $(`#boardSizes option[value='${boardSize}']`).addClass(
    "text-green-700 font-bold"
  );
  $("#winLengths option").removeClass("text-green-700 font-bold");
  $(`#winLengths option[value='${winLength}']`).addClass(
    "text-green-700 font-bold"
  );

  if (boardSize == 3) {
    $("#winLength").hide();
    $("#winLengths").hide();
    $("#winLengthLabel").text("Win Length: 3");
  } else {
    $("#winLength").show();
    $("#winLength").attr("max", boardSize);
    $("#winLengths option").hide();
    $("#winLengths option")
      .filter(function () {
        return parseInt($(this).attr("value")) <= boardSize;
      })
      .show();
    $("#winLengths").show();
    $("#winLengthLabel").text("Win Length:");
  }

  if (boardSize > 5) {
    vsAi = false;
    $("#aiRadio").attr("checked", vsAi).attr("disabled", !vsAi);
    $("#aiFirstCheckbox").attr("disabled", true);
    $("#aiFirstCheckbox").prop("checked", false);
    $("#humanRadio").attr("checked", !vsAi);
  } else {
    $("#aiRadio").attr("checked", vsAi).attr("disabled", false);
    $("#humanRadio").attr("checked", !vsAi);
    $("#aiFirstCheckbox").attr("disabled", false);
  }

  reset();
}

function createBoard(board, boardWidthPx, boardSize) {
  const createSquare = (x, y) =>
    `<div tabindex="0" aria-roledescription=" position row:${x}, column:${y}" id="square${x}${y}" class="square" onkeypress="squareClick(${x}, ${y})" onclick="squareClick(${x}, ${y})"></div>`;
  const createRow = (y, row) =>
    '<div class="row">' +
    row.map((_, index) => createSquare(y, index)).join(" ") +
    "</div>";
  $("#board").html(board.map((row, index) => createRow(index, row)).join(""));
  $(":root").css({ "--squareLength": boardWidthPx / boardSize });
}

function squareClick(x, y, isAiTurn) {
  if (board[x][y] || !gameActive) return;

  $(`#square${x}${y}`).text(currentPlayer);
  board[x][y] = currentPlayer;

  const win = checkWin(board, currentPlayer, winLength);

  if (win) {
    announceWin(win, isAiTurn);
  } else if (!getAvailableMoves(board).length) {
    announceDraw();
  } else {
    doNextIteration();
  }
}

function doNextIteration() {
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  const isAiTurn = currentPlayer === "X" && vsAi;
  updatePlayer(currentPlayer, isAiTurn);
  if (isAiTurn) {
    doAiMove();
  }
}

function doAiMove() {
  setTimeout(() => {
    const bestMove = altminimax2(board, 0, "X", -Infinity, Infinity);
    squareClick(bestMove[0], bestMove[1], true);
  });
}

function announceWin(winningSquares, isAiWin) {
  gameActive = false;
  $('#gameStatus').hide();
  $('#result').show();

  const squareClass = isAiWin ? squareClasses.lose : squareClasses.win;
  
  if (isAiWin) {
    $("#result").text("You Lost").addClass(squareClasses.lose);
  } else {
    const message = vsAi
      ? "You Win"
      : "Winner: " + (currentPlayer === "0" ? "0s" : "Xs");
    $("#result").text(message).addClass(squareClasses.win);
  }
  winningSquares.forEach(([x, y]) =>
    $(`#square${x}${y}`).addClass(squareClass)
  );
}

function announceDraw() {
  gameActive = false;
  $('#gameStatus').hide();
  $("#result").show().text("Draw").addClass('bg-gray-500');
  $(".square").addClass("bg-gray-500");
}

function updatePlayer(player, isAiPlayer) {
  const statusDivId = '#gameStatus' + player;
  const inactiveStatusDivId = '#gameStatus' + (player === 'O' ? 'X' : 'O');
  $(statusDivId).addClass('shadow-lg bg-green-500 text-white');
  $(inactiveStatusDivId).removeClass('shadow-lg bg-green-500 text-white');
}

function checkWin(board, player, winLength) {
  const checkRows = () => {
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j <= board.length - winLength; j++) {
        const currentLine = [];
        for (let k = 0; k < winLength; k++) {
          if (board[i][j + k] === player) {
            currentLine.push([i, j + k]);
          } else {
            break;
          }
        }
        if (currentLine.length === winLength) {
          return currentLine;
        }
      }
    }
    return false;
  };

  const checkCols = () => {
    for (let i = 0; i <= board.length - winLength; i++) {
      for (let j = 0; j < board.length; j++) {
        const currentLine = [];
        for (let k = 0; k < winLength; k++) {
          if (board[i + k][j] === player) {
            currentLine.push([i + k, j]);
          } else {
            break;
          }
        }
        if (currentLine.length === winLength) {
          return currentLine;
        }
      }
    }
    return false;
  };

  const checkLeftToRightDiagonal = () => {
    for (let i = 0; i <= board.length - winLength; i++) {
      for (let j = 0; j <= board.length - winLength; j++) {
        const currentLine = [];
        for (let k = 0; k < winLength; k++) {
          if (board[i + k][j + k] === player) {
            currentLine.push([i + k, j + k]);
          } else {
            break;
          }
        }
        if (currentLine.length === winLength) {
          return currentLine;
        }
      }
    }
    return false;
  };

  const checkRightToLeftDiagonal = () => {
    for (let i = 0; i <= board.length - winLength; i++) {
      for (let j = board.length - 1; j >= 0; j--) {
        const currentLine = [];
        for (let k = 0; k < winLength; k++) {
          if (board[i + k][j - k] === player) {
            currentLine.push([i + k, j - k]);
          } else {
            break;
          }
        }
        if (currentLine.length === winLength) {
          return currentLine;
        }
      }
    }
    return false;
  };

  return (
    checkRows() ||
    checkCols() ||
    checkLeftToRightDiagonal() ||
    checkRightToLeftDiagonal()
  );
}

function getAvailableMoves(board) {
  const moves = [];
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board.length; j++) {
      if (board[i][j] === "") {
        moves.push([i, j]);
      }
    }
  }
  return moves;
}

function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function altminimax(board, depth, player, alpha, beta, bestMove) {
  const maximiser = "X";
  const minimiser = "O";
  const maxDepth = 6;

  if (checkWin(board, maximiser, winLength)) {
    return 20 - depth;
  }
  if (checkWin(board, minimiser, winLength)) {
    return -20 + depth;
  }
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) {
    return 0;
  }
  if (depth > maxDepth) {
    return getRandomInteger(-25, 25);
  }

  if (player === maximiser) {
    for (const move of availableMoves) {
      board[move[0]][move[1]] = player;
      const value = altminimax(
        board,
        depth + 1,
        minimiser,
        alpha,
        beta,
        bestMove
      );
      board[move[0]][move[1]] = "";

      if (depth === 0) {
        console.log(move, value);
      }

      if (value > alpha) {
        alpha = value;
        if (depth === 0) {
          bestMove.i = move[0];
          bestMove.j = move[1];
        }
      } else if (alpha >= beta) {
        break;
      }
    }
    return alpha;
  } else {
    for (const move of availableMoves) {
      board[move[0]][move[1]] = player;
      const value = altminimax(
        board,
        depth + 1,
        maximiser,
        alpha,
        beta,
        bestMove
      );
      board[move[0]][move[1]] = "";

      if (value < beta) {
        beta = value;
        if (depth === 0) {
          bestMove.i = move[0];
          bestMove.j = move[1];
        }
      } else if (beta <= alpha) {
        break;
      }
    }
    return beta;
  }
}

const maximiser = "X";
const minimiser = "O";

function altminimax2(board, depth, player, alpha, beta) {
  const availableMoves = getAvailableMoves(board);

  if (checkWin(board, maximiser, winLength)) {
    return { score: 20 };
  }
  if (checkWin(board, minimiser, winLength)) {
    return { score: -20 };
  }
  if (availableMoves.length === 0) {
    return { score: 0 };
  }

  let bestMove;
  let score;

  if (player === maximiser) {
    score = -Infinity;
    for (const move of availableMoves) {
      board[move[0]][move[1]] = player;
      const nextPlayer = player === maximiser ? minimiser : maximiser;
      const result = altminimax2(board, depth + 1, nextPlayer, alpha, beta);
      board[move[0]][move[1]] = "";

      if (result.score > score) {
        score = result.score;
        bestMove = move;
        alpha = Math.max(alpha, score);
        if (alpha >= beta) {
          break;
        }
      }
    }
    return { ...bestMove, score: score };
  } else {
    score = Infinity;
    for (const move of availableMoves) {
      board[move[0]][move[1]] = player;
      const nextPlayer = player === maximiser ? minimiser : maximiser;
      const result = altminimax2(board, depth + 1, nextPlayer, alpha, beta);
      board[move[0]][move[1]] = "";

      if (result.score < score) {
        score = result.score;
        bestMove = move;
        beta = Math.min(beta, score);
        if (alpha >= beta) {
          break;
        }
      }
    }
    return { ...bestMove, score: score };
  }
}
