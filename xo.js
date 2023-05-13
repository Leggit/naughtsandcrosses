$(() => {
    let naughts = true;

    grid = new Array(9).map(_ => '');

    squareClick = (id, event) => {
        event.target.innerText = naughts ? '0' : 'X';
        grid[parseInt(id)] = naughts ? '0' : 'X';
        const win = checkWin();

        if (win) {
            announceWin();
        } else {
            naughts = !naughts;
            togglePlayer();
        }
    }

    announceWin = () => {
        const player = document.getElementById('player');
        player.innerText = 'Winner: ' + (naughts ? 'Naughts' : 'Crosses');
    }

    togglePlayer = () => {
        const player = document.getElementById('player');
        player.innerText = 'Turn: ' + (naughts ? 'Naughts' : 'Crosses');
    }



    checkWin = () => {
        const winningNumbers = [
            [0, 1, 2],
            [0, 4, 8],
            [1, 4, 7],
            [2, 5, 8],
            [3, 4, 5],
            [6, 7, 8],
            [6, 4, 2]
        ];

        const playersSquares = this.grid.reduce((accumulation, squareValue, index) => {
            const playerCharacter = naughts ? '0' : 'X';
            if (squareValue === playerCharacter) {
                accumulation.push(index);
            }
            return accumulation;
        }, [])

        for (const winningCombo of winningNumbers) {
            if (winningCombo.every(index => playersSquares.includes(index))) {
                return true;
            }
        }

        return false;
    }

    altCheckWin = (board = [[]], player, winLength = 3) => {
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
                  for(let count = 0; count < winLength; count++) {
                    if (board[i + count][j + count] !== player) {
                        return false;
                    }
                  }
                }
            }
            return true;
        }

        const checkRightToLeftDiagonal = () => {
            for (let i = 0; i <= board.length - winLength; i++) {
                for (let j = board.length - 1; j >= 0; j--) {
                  for(let count = 0; count < winLength; count++) {
                    if (board[i + count][j - count] !== player) {
                        return false;
                    }
                  }
                }
            }
            return true;
        }

        return checkRows() || checkCols() || checkLeftToRightDiagonal() || checkRightToLeftDiagonal();
    }

    const board = [
        ['X', 'X', 'X'],
        ['', 'X', ''],
        ['X', '', '']
    ];

    console.log(altCheckWin(board, 'X', 3));
});