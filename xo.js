/* Constants */
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
const squareClasses = {
  lose: "bg-red-500 text-white",
  win: "bg-green-600 text-white",
  draw: "bg-gray-500 text-white",
};
const activeClasses = "bg-green-600 text-white shadow-xl";
const maxAiBoardSize = 5;

/* Global variables */
let currentPlayer = players["O"];
let boardSize = 3;
let winLength = 3;
let board;
let isGameActive = true;
let currentTickTimer;
let isFirstTurn = true;

/* Init when page is ready */
$(() => init());

function init() {
  setupSliderEvents();
  setPlayerCharacterInputLimits()
  reset();
}

function setupSliderEvents() {
  $("#boardSize, #winLength").on("input", updateSliders);
}

function createEmtpyBoardArray() {
  return Array(boardSize)
  .fill([])
  .map(() => [...Array(boardSize).fill("")]);
}

/**
 * Limit the number of visible characters that can be input as a player symbol to 1
 * The default method of doing this is not compatible with some browsers so contains a fallback to using the maxlength attribute
 */
function setPlayerCharacterInputLimits() {
  try {
    const segmenter = new Intl.Segmenter();
    const getVisibleLength = (value) => [...segmenter.segment(value)].length;
    const handleBeforeInput = (event) => {
      if (event.originalEvent.data && getVisibleLength(event.target.value + event.originalEvent.data) > 1) {
        event.preventDefault();
      }
    }
    $('.player-input').on('beforeinput', handleBeforeInput);
  } catch(e) {
    // Intl is not supported on some browsers - fallback to maxlength attribute
    $('.player-input').attr('maxlength', 1);
  }
}

function getBoardWidthPx() {
  return getComputedStyle($(":root")[0])
    .getPropertyValue("--boardWidth")
    .slice(0, -2);
}

/**
 * Clears the board and sets up for a new game using the game parameters chosen by the user
 * Starts the timers and makes the AI take the first move (if applicable)
 */
function reset() {
  board = createEmtpyBoardArray(boardSize);
  isGameActive = true;
  isFirstTurn = true;
  const aiFirst = $("#aiFirstCheckbox:checked").val();
  players["X"].isAi = $("#humanRadio:checked").val() === undefined;
  players["X"].remainingTime = players["O"].remainingTime = parseFloat($("#gameLength").val());
  currentPlayer = aiFirst && players["X"].isAi ? players["X"] : players["O"];

  updatePlayer(currentPlayer);
  createHtmlBoard(board, getBoardWidthPx(), boardSize);
  $(".square").text("").removeClass(Object.values(squareClasses).join(" "));
  $("#result").hide();
  $("#gameStatus").show();
  $('.player-input').attr('disabled', false);

  if (currentPlayer.remainingTime === Infinity) {
    $(".timer").hide();
  } else {
    startTimers();
  }

  if (aiFirst) {
    doAiMove();
  }
}

function startTimers() {
  timerTick(currentPlayer);
  $(".clock").removeClass("active");
  $("#gameStatus" + currentPlayer.key + " .clock").addClass("active");
  $(".timer").show();
  $(".timer span").text(currentPlayer.remainingTime + "s");
}

function updateSliders() {
  boardSize = parseInt($("#boardSize").val());
  winLength = parseInt($("#winLength").val());

  const className = "text-green-700 font-bold"
  $("#boardSizes option").removeClass(className);
  $(`#boardSizes option[value='${boardSize}']`).addClass(className);
  $("#winLengths option").removeClass(className);
  $(`#winLengths option[value='${winLength}']`).addClass(className);


  if (boardSize == 3) {
    $("#winLength").hide();
    $("#winLengths").hide();
    $("#winLengthLabel").text("Win Length: 3");
  } else {
    $("#winLength").show().attr("max", boardSize);
    $("#winLengths option").hide().filter(function () {
      return parseInt($(this).attr("value")) <= boardSize;
    }).show();
    $("#winLengths").show();
    $("#winLengthLabel").text("Win Length:");
  }

  if (boardSize > maxAiBoardSize) {
    $("#aiRadio").prop("checked", false).attr("disabled", true);
    $("#aiFirstCheckbox").attr("disabled", true).prop("checked", false);
    $("#humanRadio").prop("checked", true);
  } else {
    $("#aiRadio").attr("disabled", false);
    $("#aiFirstCheckbox").attr("disabled", false);
  }
}

function createHtmlBoard(board, boardWidthPx, boardSize) {
  const createSquare = (x, y) =>
    `<div 
    tabindex="0" 
    aria-roledescription="position row:${x}, column:${y}" 
    id="square${x}${y}" 
    class="square"
    onkeypress="squareClick(${x}, ${y})"
    onclick="squareClick(${x}, ${y})"
    ></div>`;
  const createRow = (y, row) => `<div class="row">${row.map((_, index) => createSquare(y, index)).join(" ")}</div>`;
  const boardHtml = board.map((row, index) => createRow(index, row)).join("");
  $("#board").html(boardHtml);
  updateSquareLengthCss(boardWidthPx, boardSize);
}

function updateSquareLengthCss(boardWidthPx, boardSize) {
  const squareLength = boardWidthPx / boardSize;
  $(":root").css({ "--squareLength": squareLength });
}

function onSquareClick(x, y) {
  if (board[x][y] || !isGameActive) return;

  if (isFirstTurn) {
    isFirstTurn = false;
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
    startNextTurn();
  }
}

function startNextTurn() {
  currentPlayer = players[currentPlayer.opposite];
  updatePlayer(currentPlayer);
  if (currentPlayer.remainingTime !== Infinity) {
    timerTick(currentPlayer);
  }
  if (currentPlayer.isAi) {
    doAiMove();
  }
}

function timerTick(player) {
  clearTimeout(currentTickTimer);// So that if the player takes their turn during the timout window the current tick is cancelled
  currentTickTimer = setTimeout(() => {
    if (isGameActive) {
      player.remainingTime = player.remainingTime - 0.1;
      $("#timer" + player.key).text(Math.round(player.remainingTime) + "s");
      if (player.remainingTime <= 0) {
        announceTimeout();
      }
    }
    timerTick(player);// Repeat timer logic until this function is called elsewhere with the other player passed in
  }, 100);
}

function doAiMove() {
  const bestMove = abminimax(board, 0, currentPlayer, -Infinity, Infinity);
  onSquareClick(bestMove[0], bestMove[1]);
}

function announceWin(winningSquares) {
  isGameActive = false;
  $("#gameStatus").hide();
  $("#result").show();

  if (currentPlayer.isAi) {
    $("#result").text("You Lost").addClass(squareClasses.lose);
  } else {
    const message = players["X"].isAi ? "You Win" : "Winner: " + currentPlayer.symbol;
    $("#result").text(message).addClass(squareClasses.win);
  }

  const squareClass = currentPlayer.isAi ? squareClasses.lose : squareClasses.win;
  winningSquares.forEach(([x, y]) =>
    $(`#square${x}${y}`).addClass(squareClass)
  );
}

function announceTimeout() {
  isGameActive = false;
  $("#gameStatus").hide();
  $("#result").show().text(currentPlayer.symbol + " lost 🐌").addClass(squareClasses.lose);
  $(".square").addClass(squareClasses.lose);
}

function announceDraw() {
  isGameActive = false;
  $("#gameStatus").hide();
  $("#result").show().text("Draw").addClass(squareClasses.draw);
  $(".square").addClass(squareClasses.draw);
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
            currentLine.push([i, j + k]); // Store
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
