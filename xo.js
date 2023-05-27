
    let currentPlayer = '0';
    let boardSize = 3;
    let winLength = 3;
    let board = Array(boardSize).fill([]).map(() => [...Array(boardSize).fill('')]);
    let vsAi = true;
    let gameActive = true;

    const squareClasses = {
        lose: 'bg-red-500',
        win: 'bg-green-300',
        draw: 'bg-gray-500'
    }
    const playerClass = {
        lose: 'text-red-500',
        win: 'text-green-500',
    }


    // TODO
    // refine AI first bit
    // Timer
    // Difficulty levels
    // make ai work for larger boards and win as quick as possible

    $(() => {
        $('#boardSize').on('input', updateSliders);
        $('#winLength').on('input', updateSliders);
        reset();
    });

    function getBoardWidth() {
        return getComputedStyle($(':root')[0]).getPropertyValue('--boardWidth').slice(0, -2);
    }

    function reset() {    
        board = Array(boardSize).fill([]).map(() => [...Array(boardSize).fill('')]);
        currentPlayer = '0';
        vsAi = $('#humanRadio:checked').val() === undefined;
        gameActive = true;

        $('.square').text('').removeClass(Object.values(squareClasses).join(' '));
        $('#player').removeClass(Object.values(playerClass).join(' '));
        
        updatePlayer(currentPlayer);
        createBoard(board, getBoardWidth(), boardSize);

        if($('#aiFirstCheckbox:checked').val()) {
            currentPlayer = 'X';
            doAiMove();
        }
    }

    function updateSliders() {
        boardSize = parseInt($('#boardSize').val());
        winLength = parseInt($('#winLength').val());

        $('#boardSizes option').removeClass('text-green-700 font-bold');
        $(`#boardSizes option[value='${boardSize}']`).addClass('text-green-700 font-bold');
        $('#winLengths option').removeClass('text-green-700 font-bold');
        $(`#winLengths option[value='${winLength}']`).addClass('text-green-700 font-bold');
        
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

    function createBoard(board, boardWidthPx, boardSize) {
        const createSquare = (x, y) => `<div tabindex="0" aria-roledescription="square" id="square${x}${y}" class="square" onkeypress="squareClick(${x}, ${y})" onclick="squareClick(${x}, ${y})"></div>`;
        const createRow = (y, row) => '<div class="row">' + row.map((_, index) => createSquare(y, index)).join(' ') + '</div>';
        $('#board').html(board.map((row, index) => createRow(index, row)).join(''));
        $(':root').css({'--squareLength':  boardWidthPx / boardSize});
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
            doNextIteration();
        }
    }

    function doNextIteration() {
        currentPlayer = currentPlayer === 'X' ? '0' : 'X';
        const isAiTurn = currentPlayer === 'X' && vsAi;
        updatePlayer(currentPlayer, isAiTurn);
        if (isAiTurn) {
            doAiMove();
        }
    }

    function doAiMove() {
        setTimeout(() => {
            const move = findBestMove(board, 'X', '0')
            squareClick(move[0], move[1], true);
        });
    }

    function announceWin(winningSquares, isAiWin) {
        gameActive = false;
        const squareClass = isAiWin ? squareClasses.lose : squareClasses.win;
        if(isAiWin) {
            $('#player').text('You Lost').addClass(playerClass.lose);
        } else {
            const message = vsAi ? 'You Win' : ('Winner: ' + (currentPlayer === '0' ? '0s' : 'Xs'));
            $('#player').text(message).addClass(playerClass.win);
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
    
    function getRandomInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    function altminimax(board, depth, player, alpha, beta) {
        const maximiser = 'X';
        const minimiser = '0';
        const maxDepth = 6;
        depth++;

        if (checkWin(board, maximiser, winLength)) {
            return 20 + depth;
        }
        if (checkWin(board, minimiser, winLength)) {
            return -20 + depth;
        }
        const availableMoves = getAvailableMoves(board);
        if (availableMoves.length === 0) {
            return 0;
        }
        if(depth > maxDepth) {
            return getRandomInteger(-25, 25);
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

    function findBestMove(board, player, otherPlayer) {
        let maxScore = -Infinity;
        let optimalMove;

        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                if (board[i][j] === '') {
                    board[i][j] = player;
                    let score = altminimax(board, 0, otherPlayer, -Infinity, Infinity);
                    board[i][j] = '';

                    if (score > maxScore) {
                        maxScore = score;
                        optimalMove = [i, j];
                    }
                }
            }
        }
        return optimalMove;
    }
