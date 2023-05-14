$(() => {
    let currentPlayer = '0';

    const boardSize = 4;
    const winLength = 3;
    const board = Array(boardSize).fill([]).map(() => [...Array(boardSize).fill('')]);


    const boardWidth = 400;

    (createBoard = () => {
        const createSquare = (x, y) => `<div class="square" onclick="squareClick(${x}, ${y}, event)"></div>`;
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

    squareClick = (x, y, event) => {
        event.target.innerText = currentPlayer;
        board[x][y] = currentPlayer;
        const win = checkWin(board, currentPlayer, winLength);

        if (win) {
            announceWin();
        } else {
            currentPlayer = currentPlayer === 'X' ? '0' : 'X';
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
});