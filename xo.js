let currentPlayer = "O";
let boardSize = 3;
let winLength = 3;
let board = Array(boardSize)
  .fill([])
  .map(() => [...Array(boardSize).fill("")]);
let vsAi = true;
let gameActive = true;
let gameLength = Infinity;
let timer;
let firstTurn = true;

const squareClasses = {
  lose: "bg-red-500 text-white",
  win: "bg-green-600 text-white",
  draw: "bg-gray-500 text-white",
};
const activeClasses = "bg-green-600 text-white shadow-xl";

const players = {
  X: {
    key: "X",
    symbol: "X",
    opposite: "O",
    isAi: false,
    remainingTime: Infinity,
  },
  O: {
    key: "O",
    symbol: "O",
    opposite: "X",
    isAi: false,
    remainingTime: Infinity,
  },
};

$(() => {
  $("#boardSize").on("input", updateSliders);
  $("#winLength").on("input", updateSliders);
  setPlayerCharacterInputLimits()
  reset();
});

function setPlayerCharacterInputLimits() {
  try {
    const segmenter = new Intl.Segmenter();
    const getVisibleLength = (value) => [...segmenter.segment(value)].length;
    $('.player-input').on('beforeinput', (event) => {
      console.log(event)
      if(event.originalEvent.data && getVisibleLength(event.target.value + event.originalEvent.data) > 1) {
        event.preventDefault();
      }
    })
  } catch(e) {
    // Intl is unsported on some browsers
    $('.player-input').attr('maxlength', 1);
  }
}

function getBoardWidth() {
  return getComputedStyle($(":root")[0])
    .getPropertyValue("--boardWidth")
    .slice(0, -2);
}

function tick(player) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (gameActive) {
      player.remainingTime = player.remainingTime - 0.1;
      $("#timer" + player.key).text(Math.round(player.remainingTime) + "s");
      if (player.remainingTime <= 0) {
        announceTimeout();
      }
    }
    tick(player);
  }, 100);
}

function reset() {
  board = Array(boardSize)
    .fill([])
    .map(() => [...Array(boardSize).fill("")]);
  currentPlayer = players["O"];
  vsAi = $("#humanRadio:checked").val() === undefined;
  players["X"].isAi = vsAi;
  gameActive = true;
  firstTurn = true;
  gameLength = parseFloat($("#gameLength").val());
  players["X"].remainingTime = gameLength;
  players["O"].remainingTime = gameLength;

  $(".square").text("").removeClass(Object.values(squareClasses).join(" "));

  updatePlayer(currentPlayer);
  createBoard(board, getBoardWidth(), boardSize);

  $("#result").hide();
  $("#gameStatus").show();
  $('.player-input').attr('disabled', false);


  if ($("#aiFirstCheckbox:checked").val() && vsAi) {
    currentPlayer = players["X"];
    updatePlayer(currentPlayer);
    doAiMove();
  }

  $(".clock").removeClass("active");
  $("#gameStatus" + currentPlayer.key + " .clock").addClass("active");


  if (gameLength === Infinity) {
    $(".timer").hide();
  } else {
    tick(currentPlayer);
    $(".timer").show();
    $(".timer span").text(gameLength + "s");
  }
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
}

function createBoard(board, boardWidthPx, boardSize) {
  const createSquare = (x, y) =>
    `<div tabindex="0" aria-roledescription="square" position row:${x}, column:${y}" id="square${x}${y}" class="square" onkeypress="squareClick(${x}, ${y})" onclick="squareClick(${x}, ${y})"></div>`;
  const createRow = (y, row) =>
    '<div class="row">' +
    row.map((_, index) => createSquare(y, index)).join(" ") +
    "</div>";
  $("#board").html(board.map((row, index) => createRow(index, row)).join(""));
  $(":root").css({ "--squareLength": boardWidthPx / boardSize });
}

function squareClick(x, y) {
  if (board[x][y] || !gameActive) return;

  if (firstTurn) {
    firstTurn = false;
    $('.player-input').attr('disabled', true);
    players['X'].symbol = $('#xInput').val();
    players['O'].symbol = $('#oInput').val();
  }

  $(`#square${x}${y}`).text(currentPlayer.symbol);
  board[x][y] = currentPlayer.symbol;

  const win = checkWin(board, currentPlayer.symbol, winLength);

  if (win) {
    announceWin(win);
  } else if (!getAvailableMoves(board).length) {
    announceDraw();
  } else {
    doNextIteration();
  }
}

function doNextIteration() {
  currentPlayer = players[currentPlayer.opposite];
  updatePlayer(currentPlayer);
  if (gameLength !== Infinity) {
    tick(currentPlayer);
  }
  if (currentPlayer.isAi) {
    doAiMove();
  }
}

function doAiMove() {
  setTimeout(() => {
    const bestMove = abminimax(board, 0, currentPlayer, -Infinity, Infinity);
    console.log(bestMove)
    squareClick(bestMove[0], bestMove[1], true);
  });
}

function announceWin(winningSquares) {
  gameActive = false;
  $("#gameStatus").hide();
  $("#result").show();

  if (currentPlayer.isAi) {
    $("#result").text("You Lost").addClass(squareClasses.lose);
  } else {
    const message = vsAi ? "You Win" : "Winner: " + currentPlayer.symbol;
    $("#result").text(message).addClass(squareClasses.win);
  }

  const squareClass = currentPlayer.isAi ? squareClasses.lose : squareClasses.win;
  winningSquares.forEach(([x, y]) =>
    $(`#square${x}${y}`).addClass(squareClass)
  );
}

function announceTimeout() {
  gameActive = false;
  $("#gameStatus").hide();
  $("#result").show().text(currentPlayer.symbol + " lost 🐌").addClass(squareClasses.lose);
  $(".square").addClass("bg-gray-500");
}

function announceDraw() {
  gameActive = false;
  $("#gameStatus").hide();
  $("#result").show().text("Draw").addClass("bg-gray-500");
  $(".square").addClass("bg-gray-500");
}

function updatePlayer(player) {
  const statusDivId = "#gameStatus" + player.key;
  const inactiveStatusDivId = "#gameStatus" + player.opposite;
  $(statusDivId).addClass("shadow-lg bg-green-600 text-white");
  $(inactiveStatusDivId).removeClass("shadow-lg bg-green-600 text-white");
  $("#gameStatus" + player.opposite + " .clock").removeClass("active");
  $("#gameStatus" + player.key + " .clock").addClass("active");
}

function checkWin(board, playerSymbol, winLength) {
  const checkRows = () => {
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j <= board.length - winLength; j++) {
        const currentLine = [];
        for (let k = 0; k < winLength; k++) {
          if (board[i][j + k] === playerSymbol) {
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
          if (board[i + k][j] === playerSymbol) {
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
          if (board[i + k][j + k] === playerSymbol) {
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
          if (board[i + k][j - k] === playerSymbol) {
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

function abminimax(board, depth, player, alpha, beta) {
  const availableMoves = getAvailableMoves(board);

  if (checkWin(board, players["X"].symbol, winLength)) {
    return { score: 20 };
  }
  if (checkWin(board, players["O"].symbol, winLength)) {
    return { score: -20 };
  }
  if (availableMoves.length === 0) {
    return { score: 0 };
  }

  let bestMove;
  let score;

  if (player === players["X"]) {
    score = -Infinity;
    for (const move of availableMoves) {
      board[move[0]][move[1]] = player.symbol;
      const result = abminimax(
        board,
        depth + 1,
        players[player.opposite],
        alpha,
        beta
      );
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
      board[move[0]][move[1]] = player.symbol;
      const result = abminimax(
        board,
        depth + 1,
        players[player.opposite],
        alpha,
        beta
      );
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
