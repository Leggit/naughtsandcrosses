$(() => {
    let currentPlayer = '0';

    const boardSize = 4;
    const winLength = 3;
    let board = Array(boardSize).fill([]).map(() => [...Array(boardSize).fill('')]);

    const boardWidth = 400;

    (createBoard = () => {
        const createSquare = (x, y) => `<div id="square${x}${y}" class="square" onclick="squareClick(${x}, ${y}, event)"></div>`;
        const createRow = (y, row) => '<div class="row">' + row.map((_, index) => createSquare(index, y)).join(' ') + '</div>';
        const html = board.map((row, index) => createRow(index, row)).join('');
        $('#board').html(html);
        $('.row').css({ 
            height: boardWidth / boardSize  + 'px',
            display: 'flex'
        });
        $('.square').css({
            flex: 1,
            border: '1px solid black',
            'font-size': boardWidth / boardSize * 0.75  + 'px',
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
        if(board[x][y] === 'X' || board[x][y] === '0') return;

        $(`#square${x}${y}`).text(currentPlayer)
        board[x][y] = currentPlayer;
        debugger
        const win = checkWin(board, currentPlayer, winLength);

        if (win) {
            announceWin();
            // TODO show the win on the board visually?
        } else {
            currentPlayer = currentPlayer === 'X' ? '0' : 'X';
            if(currentPlayer === 'X') {
                const move = minimax(board, currentPlayer);
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
            for(let i = 0; i < board.length; i++) {
                for(let j = 0; j <= board.length - winLength; j++) {
                    if(board[i].slice(j, j + winLength).every(val => val === player)) {
                        return true;
                    }
                }
            }
            return false;
        }

        const checkCols = () => {
            for(let i = 0; i <= board.length - winLength; i++) {
                for(let j = 0; j < board.length; j++) {
                    if(board.slice(i, i + winLength).every(col => col[j] === player)) {
                        return true;
                    }
                }
            }
            return false;
        }

        const checkLeftToRightDiagonal = () => {
            for (let i = 0; i <= board.length - winLength; i++) {
                for (let j = 0; j <= board.length - winLength; j++) {
                    if(Array(winLength).fill().every((_, index) => board[i + index][j + index] === player)) {
                        return true;
                    }
                }
            }
            return false;
        }

        const checkRightToLeftDiagonal = () => {
            for (let i = 0; i <= board.length - winLength; i++) {
                for (let j = board.length - 1; j >= 0; j--) {
                  for(let count = 0; count < winLength; count++) {
                    if(Array(winLength).fill().every((_, index) => board[i + index][j - index] === player)) {
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
        for(let i = 0; i < board.length; i++) {
            for(let j = 0; j < board.length; j++) {
                if(!board[i][j]) {
                    moves.push([i, j]);
                }
            }
        }
        return moves;
    }
});