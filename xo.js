$(() => {
    let currentPlayer = '0';

    const boardSize = 4;
    const winLength = 4;
    let board = Array(boardSize).fill([]).map(() => [...Array(boardSize).fill('')]);

    const boardWidth = 400;

    (createBoard = () => {
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
    })();

    reset = () => {
        board = Array(boardSize).fill([]).map(() => [...Array(boardSize).fill('')]);
        $('.square').text('');
        currentPlayer = '0';
        togglePlayer();
    }

    squareClick = (x, y, event) => {
        if (board[x][y] === 'X' || board[x][y] === '0') return;

        $(`#square${x}${y}`).text(currentPlayer)
        board[x][y] = currentPlayer;
        const win = checkWin(board, currentPlayer, winLength);

        if (win) {
            announceWin();
            // TODO show the win on the board visually?
        } else {
            currentPlayer = currentPlayer === 'X' ? '0' : 'X';
            if (currentPlayer === 'X') {
                //const move = findBestMove(board)
                calls = 0 
                const move = minimax(board, currentPlayer, 0);
                console.log(calls)
                squareClick(move[0], move[1]);
            }
            togglePlayer();
        }
    }

    announceWin = () => {
        $('#player').text('Winner: ' + (currentPlayer === '0' ? 'Naughts' : 'Crosses'));
    }

    togglePlayer = () => {
        $('#player').text('Turn: ' + (currentPlayer === '0' ? 'Naughts' : 'Crosses'));
    }

    checkWin = (board = [[]], player = 'X', winLength = 3) => {
        const checkRows = () => {
            for (let i = 0; i < board.length; i++) {
                for (let j = 0; j <= board.length - winLength; j++) {
                    if (board[i].slice(j, j + winLength).every(val => val === player)) {
                        return true;
                    }
                }
            }
            return false;
        }

        const checkCols = () => {
            for (let i = 0; i <= board.length - winLength; i++) {
                for (let j = 0; j < board.length; j++) {
                    if (board.slice(i, i + winLength).every(col => col[j] === player)) {
                        return true;
                    }
                }
            }
            return false;
        }

        const checkLeftToRightDiagonal = () => {
            for (let i = 0; i <= board.length - winLength; i++) {
                for (let j = 0; j <= board.length - winLength; j++) {
                    if (Array(winLength).fill().every((_, index) => board[i + index][j + index] === player)) {
                        return true;
                    }
                }
            }
            return false;
        }

        const checkRightToLeftDiagonal = () => {
            for (let i = 0; i <= board.length - winLength; i++) {
                for (let j = board.length - 1; j >= 0; j--) {
                    for (let count = 0; count < winLength; count++) {
                        if (Array(winLength).fill().every((_, index) => board[i + index][j - index] === player)) {
                            return true;
                        }
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
        if(availableMoves.length === 0 || depth === 6) {
            return { score: 0 };
        }
        if(checkWin(board, '0')) {
            return { score: 100 - depth };
        }
        if(checkWin(board, 'X')) {
            return { score: -100 + depth };
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

    altminimax = (board, depth, player, alpha, beta, startTime) => {
        calls++;
        const maximiser = 'X';
        const minimiser = '0';
        const maxDepth = 6; // change this for difficulty
        const maxTimeSeconds = 10;

        if (checkWin(board, maximiser)) {
            return 100 + depth;
        }
        if (checkWin(board, minimiser)) {
            return -100 + depth;
        }
        const availableMoves = getAvailableMoves(board);
        if (availableMoves.length === 0 || depth > maxDepth) {
            return 0;
        }

        if(player === maximiser) {
            for(const move of availableMoves) {
                board[move[0]][move[1]] = player;
                const value = altminimax(board, depth + 1, minimiser, alpha, beta);
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
                const value = altminimax(board, depth + 1, maximiser, alpha, beta);
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
                    debugger
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
});