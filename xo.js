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
const maxAiBoardSize = 7;

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
  setPlayerCharacterInputLimits();
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
      if (
        event.originalEvent.data &&
        getVisibleLength(event.target.value + event.originalEvent.data) > 1
      ) {
        event.preventDefault();
      }
    };
    $(".player-input").on("beforeinput", handleBeforeInput);
  } catch (e) {
    // Intl is not supported on some browsers - fallback to maxlength attribute
    $(".player-input").attr("maxlength", 1);
  }
}

function getBoardWidthPx() {
  return getComputedStyle($(":root")[0])
    .getPropertyValue("--boardWidthPx")
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
  players["X"].remainingTime = players["O"].remainingTime = parseFloat(
    $("#gameLength").val()
  );
  currentPlayer = aiFirst && players["X"].isAi ? players["X"] : players["O"];

  updateGameStatusUI(currentPlayer);
  createHtmlBoard(board, getBoardWidthPx(), boardSize);
  $(".square").text("").removeClass(Object.values(squareClasses).join(" "));
  $("#result").hide().removeClass(Object.values(squareClasses).join(" "));
  $("#gameStatus").show();
  $(".player-input").attr("disabled", false);

  if (currentPlayer.remainingTime === Infinity) {
    $(".timer").hide();
  } else {
    startTimers();
  }

  if (aiFirst) {
    // Random turn to start
    selectSquareForTurn(
      getRandomInteger(0, board.length - 1),
      getRandomInteger(0, board.length - 1)
    );
  }
}

/**
 * Called at the start of a game
 * Shows the timers on the UI and starts the remaining time countdown for the current player
 */
function startTimers() {
  timerTick(currentPlayer);
  $(".clock").removeClass("active");
  $("#gameStatus" + currentPlayer.key + " .clock").addClass("active");
  $(".timer").show();
  $(".timer span").text(currentPlayer.remainingTime + "s");
}

/**
 * Handles the logic of ensuring the game is set up correctly as the user changes various game options
 */
function updateSliders() {
  boardSize = parseInt($("#boardSize").val());
  winLength = parseInt($("#winLength").val());

  // Highlight the selected option the datalist for each slider
  const className = "text-green-700 font-bold";
  $("#boardSizes option").removeClass(className);
  $(`#boardSizes option[value='${boardSize}']`).addClass(className);
  $("#winLengths option").removeClass(className);
  $(`#winLengths option[value='${winLength}']`).addClass(className);

  // The win length can only be 3 on a 3x3 board,
  // otherwise the user can change the winlength to any number between 3 and the chosen board size
  if (boardSize == 3) {
    $("#winLength").hide();
    $("#winLengths").hide();
    $("#winLengthLabel").text("Win Length: 3");
  } else {
    $("#winLength").show().attr("max", boardSize);
    $("#winLengths option")
      .hide()
      .filter(function () {
        return parseInt($(this).attr("value")) <= boardSize;
      })
      .show();
    $("#winLengths").show();
    $("#winLengthLabel").text("Win Length:");
  }

  // AI is too slow for large board sizes so we take this option away
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
  // Subfunction to create a single square div
  const createSquare = (x, y) =>
    `<div 
    tabindex="0" 
    aria-roledescription="position row:${x}, column:${y}" 
    id="square${x}${y}" 
    class="square"
    onkeypress="selectSquareForTurn(${x}, ${y})"
    onclick="selectSquareForTurn(${x}, ${y})"
    ></div>`;
  // Subfunction to create a row of squares given a certain board length
  const createRow = (y, row) =>
    `<div class="row">${row
      .map((_, index) => createSquare(y, index))
      .join(" ")}</div>`;

  const boardHtml = board.map((row, index) => createRow(index, row)).join("");
  $("#board").html(boardHtml);
  updateSquareLengthCss(boardWidthPx, boardSize);
}

/**
 * Updates the CSS variable for squarelength so squares are correctly sized
 */
function updateSquareLengthCss(boardWidthPx, boardSize) {
  const squareLength = boardWidthPx / boardSize;
  $(":root").css({ "--squareLengthPx": squareLength });
}

/**
 * Called every turn either when a user selects a square or in the code by the AI,
 * Executes turn logic given the coordinates of the chosen square
 * Contains a condition to do nothing if the square is already taken or if no game is active
 */
function selectSquareForTurn(x, y) {
  // Do nothing if the square is taken or if the current game has ended
  if (board[x][y] || !isGameActive) return;

  // Disable the player symbol inputs once the first turn has been taken
  if (isFirstTurn) {
    isFirstTurn = false;
    $(".player-input").attr("disabled", true);
    // Check the inputs are not empty
    if ($("#xInput").val().length <= 0) $("#xInput").val("X");
    if ($("#oInput").val().length <= 0) $("#oInput").val("O");
    players["X"].symbol = $("#xInput").val();
    players["O"].symbol = $("#oInput").val();
  }

  // Update the UI and in code representation of the board to reflect this turn
  $(`#square${x}${y}`).text(currentPlayer.symbol);
  board[x][y] = currentPlayer.symbol;

  // Check if the game is in a terminal state and take the next appropriate action based on this
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
  updateGameStatusUI(currentPlayer);
  if (currentPlayer.remainingTime !== Infinity) {
    timerTick(currentPlayer);
  }
  if (currentPlayer.isAi) {
    doAiMove();
  }
}

function timerTick(player) {
  clearTimeout(currentTickTimer); // So that if the player takes their turn during the timout window the current tick is cancelled
  currentTickTimer = setTimeout(() => {
    if (isGameActive) {
      player.remainingTime = player.remainingTime - 0.1;
      $("#timer" + player.key).text(Math.round(player.remainingTime) + "s");
      if (player.remainingTime <= 0) {
        announceTimeout();
      }
    }
    timerTick(player); // Repeat timer logic until this function is called elsewhere with the other player passed in
  }, 100);
}

function doAiMove() {
  // Using setTimout means the UI updates with the previous move before calculating the next best move
  setTimeout(() => {
    const bestMove = minimax(board, 0, currentPlayer, -Infinity, Infinity);
    selectSquareForTurn(bestMove[0], bestMove[1]);
  });
}

function announceWin(winningSquares) {
  isGameActive = false;
  $("#gameStatus").hide();
  $("#result").show();

  if (currentPlayer.isAi) {
    $("#result").text("You Lost").addClass(squareClasses.lose);
  } else {
    const message = players["X"].isAi
      ? "You Win"
      : "Winner: " + currentPlayer.symbol;
    $("#result").text(message).addClass(squareClasses.win);
  }

  const squareClass = currentPlayer.isAi
    ? squareClasses.lose
    : squareClasses.win;
  winningSquares.forEach(([x, y]) =>
    $(`#square${x}${y}`).addClass(squareClass)
  );
}

function announceTimeout() {
  isGameActive = false;
  $("#gameStatus").hide();
  $("#result")
    .show()
    .text(currentPlayer.symbol + " lost 🐌")
    .addClass(squareClasses.lose);
  $(".square").addClass(squareClasses.lose);
}

function announceDraw() {
  isGameActive = false;
  $("#gameStatus").hide();
  $("#result").show().text("Draw").addClass(squareClasses.draw);
  $(".square").addClass(squareClasses.draw);
}

/**
 * Update various elements in the gameStatus area to show the current active player etc.
 */
function updateGameStatusUI(player) {
  const statusDivId = "#gameStatus" + player.key;
  const inactiveStatusDivId = "#gameStatus" + player.opposite;
  $(statusDivId).addClass("shadow-lg bg-green-600 text-white");
  $(inactiveStatusDivId).removeClass("shadow-lg bg-green-600 text-white");
  $("#gameStatus" + player.opposite + " .clock").removeClass("active");
  $("#gameStatus" + player.key + " .clock").addClass("active");
}

function checkWin(board, playerSymbol, winLength) {
  // Go through every square and see if it is the start of a winning horizonal line
  // Each subfunction either returns false or an array of winning squares
  const checkRows = () => {
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j <= board.length - winLength; j++) {
        const currentLine = [];
        for (let k = 0; k < winLength; k++) {
          if (board[i][j + k] === playerSymbol) {
            currentLine.push([i, j + k]); // Store potential winning squares
          } else {
            break; // Not a winning line
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

  // Use JS "truthy" functionality to either return falsey for no win,
  // or an array (Truthy) for the winning squares
  return (
    checkRows() ||
    checkCols() ||
    checkLeftToRightDiagonal() ||
    checkRightToLeftDiagonal()
  );
}

/**
 * Cycles through the provided board and finds empty squares
 * Returns an array of moves in the format [x, y]
 * Limit to nearby flag means only moves that are next to occupied squares will be returned
 * - this is useful for making the AI run faster on larger boards
 */
function getAvailableMoves(board, limitToNearby) {
  const moves = [];
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board.length; j++) {
      if (board[i][j] === "") {
        if (!limitToNearby || isNearBySquareOccupied(board, i, j)) {
          moves.push([i, j]);
        }
      }
    }
  }
  return moves;
}

/**
 * Checks to see if one or more squares within the passed in distance (default of 1) is occupied
 */
function isNearBySquareOccupied(board, i, j, distance = 1) {
  const xMin = i - distance >= 0 ? i - distance : 0;
  const xMax = i + distance;
  const yMin = j - distance >= 0 ? j - distance : 0;
  const yMax = j + distance;

  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) {
      if (x === i && y === j) continue;
      if (board[x]?.[y]) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Utility function to return a randon integer between the supplied min and max integers (inclusive)
 */
function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Minimax function that uses a form alpha beta pruning
 */
function minimax(board, depth, player, alpha, beta) {
  // Limit the available moves returned on larger boards
  const availableMoves = getAvailableMoves(board, board.length > 4);

  // Terminal condition checking
  if (checkWin(board, players["X"].symbol, winLength)) {
    return { score: 100 - depth }; // Subtract the depth so moves that win quicker score higher
  }
  if (checkWin(board, players["O"].symbol, winLength)) {
    return { score: -100 + depth };
  }
  if (availableMoves.length === 0 || depth >= 6) {
    return { score: getRandomInteger(-5, 5) };// Either a branch that leads to a draw or a branch that is too deep
  }

  let bestMove;
  let bestScore;

  if (player === players["X"]) {
    bestScore = -Infinity;
    for (const move of availableMoves) {
      // Do the move, calculate the score
      board[move[0]][move[1]] = player.symbol;
      const result = minimax(
        board,
        depth + 1,
        players[player.opposite],
        alpha,
        beta
      );
      board[move[0]][move[1]] = ""; // Undo the move that was tested

      if (result.score > bestScore) {
        bestScore = result.score; // Best that the maximiser can do at this depth
        bestMove = move;
        alpha = Math.max(alpha, bestScore); // Update the best that the maximiser can do at any depth
        if (alpha >= beta) {
          // Means this move gaurantees a win against the minimiser if maximiser continues to play optimally
          // So ignore the rest of the moves at this depth
          break;
        } 
      }
    }
    return { ...bestMove, score: bestScore };
  } else {
    bestScore = Infinity;
    for (const move of availableMoves) {
      board[move[0]][move[1]] = player.symbol;
      const result = minimax(
        board,
        depth + 1,
        players[player.opposite],
        alpha,
        beta
      );
      board[move[0]][move[1]] = "";

      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = move;
        beta = Math.min(beta, bestScore);
        if (alpha >= beta) {
          break;
        }
      }
    }
    return { ...bestMove, score: bestScore };
  }
}
