
    let currentPlayer = '0';
    let boardSize = 3;
    let winLength = 3;
    let board = Array(boardSize).fill([]).map(() => [...Array(boardSize).fill('')]);
    let vsAi = true;
    let gameActive = true;
    let BOARD_WIDTH = 500;

    function getBoardWidth() {
        return getComputedStyle($(':root')[0]).getPropertyValue('--boardWidth').slice(0, -2);
    }

    $(document).ready(() => {
        createBoard()
        BOARD_WIDTH = getBoardWidth();
        $('#boardSize').on('input', updateSliders);
        $('#winLength').on('input', updateSliders);
        reset();
    });

    function reset() {    
        board = Array(boardSize).fill([]).map(() => [...Array(boardSize).fill('')]);
        $('.square').text('').removeClass('bg-red-500 bg-green-300 bg-gray-500');
        $('#player').removeClass('text-green-500 text-red-500');
        currentPlayer = '0';
        updatePlayer(currentPlayer);
        vsAi = $('#humanRadio:checked').val() === undefined;
        gameActive = true;
        createBoard();
    }

    function updateSliders() {
        boardSize = parseInt($('#boardSize').val());
        winLength = parseInt($('#winLength').val());

        $('#boardSizes option').removeClass('text-green-700 font-bold');
        $(`#boardSizes option[value="${boardSize}"]`).addClass('text-green-700 font-bold');
        
        if(boardSize == 3) {
            $('#winLength').hide();
            $('#winLengths').hide();
            $('#winLengthLabel').text('Win Length: 3');
        } else {
            $('#winLength').show();
            $('#winLength').attr('max', boardSize);
            $('#winLengths option').hide();
            $('#winLengths option').filter(function () {
                return parseInt($(this).attr('value')) <= boardSize;
            }).show();
            $('#winLengths').show();
            $('#winLengthLabel').text('Win Length:');
        }

        if(boardSize > 5) {
            vsAi = false;
            $('#aiRadio').attr('checked', vsAi).attr('disabled', !vsAi);
            $('#humanRadio').attr('checked', !vsAi);
        } else {
            $('#aiRadio').attr('checked', vsAi).attr('disabled', false);
            $('#humanRadio').attr('checked', !vsAi);
        }
        
        reset();
    }

    function createBoard() {
        const createSquare = (x, y) => `<div id="square${x}${y}" class="square" onclick="squareClick(${x}, ${y})"></div>`;
        const createRow = (y, row) => '<div class="row">' + row.map((_, index) => createSquare(y, index)).join(' ') + '</div>';
        const html = board.map((row, index) => createRow(index, row)).join('');
        $('#board').html(html);
        $('.row').css({
            height: BOARD_WIDTH / boardSize + 'px',
            display: 'flex'
        });
        $('.square').css({
            flex: 1,
            border: '1px solid black',
            'font-size': BOARD_WIDTH / boardSize * 0.75 + 'px',
            'line-height': BOARD_WIDTH / boardSize + 'px',
            'text-align': 'center'
        });
    }

    function squareClick(x, y, isAiTurn) {
        if (board[x][y] || !gameActive) return;

        $(`#square${x}${y}`).text(currentPlayer)
        board[x][y] = currentPlayer;

        const win = checkWin(board, currentPlayer, winLength);

        if (win) {
            announceWin(win, isAiTurn);
        } else if(!getAvailableMoves(board).length) {
            announceDraw();
        } else {
            nextIteration();
        }
    }

    function nextIteration() {
        currentPlayer = currentPlayer === 'X' ? '0' : 'X';
        const isAiTurn = currentPlayer === 'X' && vsAi;
        updatePlayer(currentPlayer, isAiTurn);
        if (isAiTurn) {
            aiMove();
        }
    }

    function aiMove() {
        $('#board').css({'pointer-events': 'none'});
        setTimeout(() => {
            const move = findBestMove(board)
            squareClick(move[0], move[1], true);
            $('#board').css({'pointer-events': 'auto'});
        });
    }

    function announceWin(winningSquares, isAiWin) {
        gameActive = false;
        const squareClass = isAiWin ? 'bg-red-500' : 'bg-green-300'
        if(isAiWin) {
            $('#player').text('You Lost').addClass('text-red-500');
        } else {
            const message = vsAi ? 'You Win' : ('Winner: ' + (currentPlayer === '0' ? '0s' : 'Xs'));
            $('#player').text(message).addClass('text-green-500');
        }
        winningSquares.forEach(([x, y]) => $(`#square${x}${y}`).addClass(squareClass));        
    }

    function announceDraw() {
        gameActive = false;
        $('#player').text('Draw');
        $('.square').addClass('bg-gray-500');
    }

    function updatePlayer(player, isAiPlayer) {
        $('#player').text('Turn: ' + player + (isAiPlayer ? '...' : ''));
    }

    function checkWin(board, player, winLength) {
        const checkRows = () => {
            for (let i = 0; i < board.length; i++) {
                for (let j = 0; j <= board.length - winLength; j++) {
                    const currentLine = [];
                    for(let k = 0; k < winLength; k++) {
                        if(board[i][j + k] === player) {
                            currentLine.push([i, j + k]);
                        } else {
                            break;
                        }
                    }
                    if(currentLine.length === winLength) {
                        return currentLine;
                    }
                }
            }
            return false;
        }

        const checkCols = () => {
            for (let i = 0; i <= board.length - winLength; i++) {
                for (let j = 0; j < board.length; j++) {
                    const currentLine = [];
                    for(let k = 0; k < winLength; k++) {
                        if(board[i + k][j] === player) {
                            currentLine.push([i + k, j]);
                        } else {
                            break;
                        }
                    }
                    if(currentLine.length === winLength) {
                        return currentLine;
                    }
                }
            }
            return false;
        }

        const checkLeftToRightDiagonal = () => {
            for (let i = 0; i <= board.length - winLength; i++) {
                for (let j = 0; j <= board.length - winLength; j++) {
                    const currentLine = [];
                    for(let k = 0; k < winLength; k++) {
                        if(board[i + k][j + k] === player) {
                            currentLine.push([i + k, j + k]);
                        } else {
                            break;
                        }
                    }
                    if(currentLine.length === winLength) {
                        return currentLine;
                    }
                }
            }
            return false;
        }

        const checkRightToLeftDiagonal = () => {
            for (let i = 0; i <= board.length - winLength; i++) {
                for (let j = board.length - 1; j >= 0; j--) {
                    const currentLine = [];
                    for(let k = 0; k < winLength; k++) {
                        if(board[i + k][j - k] === player) {
                            currentLine.push([i + k, j - k]);
                        } else {
                            break;
                        }
                    }
                    if(currentLine.length === winLength) {
                        return currentLine;
                    }
                }
            }
            return false;
        }

        return checkRows() || checkCols() || checkLeftToRightDiagonal() || checkRightToLeftDiagonal();
    }

    function getAvailableMoves(board) {
        const moves = [];
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board.length; j++) {
                if (!board[i][j]) {
                    moves.push([i, j]);
                }
            }
        }
        return moves;
    }
    
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    function altminimax(board, depth, player, alpha, beta, startTime, bestMove) {
        const maximiser = 'X';
        const minimiser = '0';
        const maxDepth = 6; // change this for difficulty
        const maxTimeSeconds = 10;
        depth++;

        if (checkWin(board, maximiser, winLength)) {
            return 100 + depth;
        }
        if (checkWin(board, minimiser, winLength)) {
            return -100 + depth;
        }
        const availableMoves = getAvailableMoves(board);
        if (availableMoves.length === 0) {
            return 0;
        }
        if(depth > maxDepth) {
            return getRandomInt(-25, 25);
        }
        if(depth > 2 && (startTime + maxTimeSeconds * 1000) > performance.now()) {
            console.log("TIME OUT")
            return 0;
        }

        if(player === maximiser) {
            for(const move of availableMoves) {
                board[move[0]][move[1]] = player;
                const value = altminimax(board, depth, minimiser, alpha, beta);
                board[move[0]][move[1]] = '';

                if(value > alpha) {
                    alpha = value;
                } else if (alpha >= beta) {
                    break;
                }
            } 
            return alpha;
        } else {
            for(const move of availableMoves) {
                board[move[0]][move[1]] = player;
                const value = altminimax(board, depth, maximiser, alpha, beta);
                board[move[0]][move[1]] = '';

                if(value < beta) {
                    beta = value;
                } else if (beta <= alpha) {
                    break;
                }
            } 
            return beta;
        }
    }

    function findBestMove(board) {
        let bestScore = -Infinity;
        let bestMove;

        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                if (board[i][j] === "") {
                    board[i][j] = "X"; // Simulate a move for the maximizing player
                    let score = altminimax(board, 0, '0', -Infinity, Infinity);
                    board[i][j] = ""; // Undo the move

                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = [i, j];
                    }
                }
            }
        }
        return bestMove;
    }
