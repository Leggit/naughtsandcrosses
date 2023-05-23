
    let currentPlayer = '0';
    let boardSize = 3;
    let winLength = 3;
    let board = Array(boardSize).fill([]).map(() => [...Array(boardSize).fill('')]);
    let vsAi = false;
    const boardWidth = 500;

    function setup() {
        board = Array(boardSize).fill([]).map(() => [...Array(boardSize).fill('')]);
        createBoard()
        $(':root').css({ '--boardWidth': boardWidth });
        $('#boardSize').on('input', updateSliders);
        $('#winLength').on('input', updateSliders);
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
        board = Array(boardSize).fill([]).map(() => [...Array(boardSize).fill('')]);
        createBoard()
    }

    $(document).ready(setup);

    function createBoard() {
        const createSquare = (x, y) => `<div id="square${x}${y}" class="square" onclick="squareClick(${x}, ${y}, event)"></div>`;
        const createRow = (y, row) => '<div class="row">' + row.map((_, index) => createSquare(y, index)).join(' ') + '</div>';
        const html = board.map((row, index) => createRow(index, row)).join('');
        $('#board').html(html);
        $('.row').css({
            height: boardWidth / boardSize + 'px',
            display: 'flex'
        });
        $('.square').css({
            flex: 1,
            border: '1px solid black',
            'font-size': boardWidth / boardSize * 0.75 + 'px',
            'line-height': boardWidth / boardSize + 'px',
            'text-align': 'center'
        });
    }

    function reset() {
        board = Array(boardSize).fill([]).map(() => [...Array(boardSize).fill('')]);
        $('.square').text('').removeClass('bg-red-500');
        currentPlayer = '0';
        updatePlayer(currentPlayer);
        vsAi = $('#humanRadio:checked').val() === undefined;
    }

    function squareClick(x, y) {
        if (board[x][y] === 'X' || board[x][y] === '0') return;

        $(`#square${x}${y}`).text(currentPlayer)
        board[x][y] = currentPlayer;

        const win = checkWin(board, currentPlayer, winLength)
        if (win) {
            announceWin(win);
        } else {
            currentPlayer = currentPlayer === 'X' ? '0' : 'X';
            updatePlayer(currentPlayer);
            if (currentPlayer === 'X' && vsAi) {
                const move = findBestMove(board)
                squareClick(move[0], move[1]);
            }
        }
    }

    function announceWin(winningSquares) {
        $('#player').text('Winner: ' + (currentPlayer === '0' ? 'Naughts' : 'Crosses')).addClass('text-green-500 font-bold');
        winningSquares.forEach(([x, y]) => {
            $(`#square${x}${y}`).addClass('bg-red-500')
        })
    }

    function updatePlayer(player) {
        $('#player').text('Turn: ' + player);
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

    minimax = (board, player, depth = 0) => {
        // TODO implement depth check to win quicker?
        calls++;

        const availableMoves = getAvailableMoves(board);
        
        if(checkWin(board, '0')) {
            return { score: 100 - depth };
        }
        if(checkWin(board, 'X')) {
            return { score: -100 + depth };
        }
        if(availableMoves.length === 0 || depth === 6) {
            return { score: 0 };
        }

        availableMoves.forEach(availableMove => {
            board[availableMove[0]][availableMove[1]] = player;
            if(player === 'X') {
                availableMove.score = minimax(board, '0', depth + 1).score;
            } else {
                availableMove.score = minimax(board, 'X', depth + 1).score;
            }
            board[availableMove[0]][availableMove[1]] = '';
        });

        let optimalMove;
        if(player === '0') {
            optimalMove = { score: -Infinity };
            for(const availableMove of availableMoves) {
                if(availableMove.score > optimalMove.score) {
                    optimalMove = availableMove;
                }
            }
        } else {
            optimalMove = { score: Infinity };
            for(const availableMove of availableMoves) {
                if(availableMove.score < optimalMove.score) {
                    optimalMove = availableMove;
                }
            }
        }
        return optimalMove;
    }


    getAvailableMoves = (board) => {
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
    
    var calls = 0;

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    altminimax = (board, depth, player, alpha, beta, startTime, bestMove) => {
        calls++;
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

    findBestMove = (board) =>  {
        let bestScore = -Infinity;
        let bestMove;

        calls = 0;
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

        console.log("Calls: ", calls);
        return bestMove;
    }
