
// the game should be represented as code
// so we need code to represent the board
const tttBoard = [[null, null, null],
                    [null, null, null],
                    [null, null, null]]
                    
// okay now that we have the board,we need functions that perform actions on the board
function writeValueToBoard(value, position, board){
  const copyOfBoard = [[...board[0]],[...board[1],[...board[3]]]];
  copyOfBoard[position.row][position.col] = value;
  return copyOfBoard;
}
// we need a function that looks at the board and takes a value whooms turn currently is and determines where on the board to write it
function getPositionToWriteValue(value, board){
    /// if board is full return null
    if(board.every(r => r.every(c => c !== null))){
        return null;
    }
    /// if any user has 3 consecutive items return null
    const allLines = getAllPossibleConsecutiveItems(board);
    const allLineValues = getObjValuesArray(allLines);
    if(allLineValues.map(v => v.lineValue).some(v =>  v === 'XXX' || v === 'OOO')){
        return null;
    }
    
    //if a line of same type has 2, then finish the line
    const lineWith2Values = allLineValues.find(v => v.lineValue === value + value);
    if(lineWith2Values){
        const emptyCol = lineWith2Values.lineDetails.find(ld => ld.value === null);
        return {row: emptyCol.position[0], col: emptyCol.position[1]}
    }

    //if a line of other type has 2, then block the opponent from finising it
    const lineWith2OppositeValues = allLineValues.find(v => v.lineValue.length === 2 && v.lineValue[0] === v.lineValue[1]);
    if(lineWith2OppositeValues){
        const emptyCol = lineWith2OppositeValues.lineDetails.find(ld => ld.value === null);
        return {row: emptyCol.position[0], col: emptyCol.position[1]}
    }

    //if a line has only 1 of same value, then add another one
    const lineWithOneOfSameValue = allLineValues.find(v => v.lineValue === 'X');
    if(lineWithOneOfSameValue){
        const firstEmptyCol = lineWithOneOfSameValue.lineDetails.find(ld => ld.value === null);
        return {row: firstEmptyCol.position[0], col: firstEmptyCol.position[1]};
    }

    //if middle row is empty, just return the middle row value
    if(board[1][1] === null){
        return {row: 1, col: 1}
    }

    //if there's a corner with null, try putting one there
    const emptyCorner = [{position:{row:0,col:0},value:board[0][0]},{position:{row:0,col:2},value:board[0][2]}
    ,{position:{row:2, col: 0}, value: board[2][0]},{position: {row: 2, col: 2}, value: board[2][2]}].find(i => i.value === null);
    if(emptyCorner){
        return emptyCorner.position;
    }

    //otherwise, just return the first null col

    return allLineValues.find(v => v.lineValue.length < 3).lineDetails.find(ld => ld.value === null).position;
}

function getAllPossibleConsecutiveItems(board){
    return {
        topRow: {lineValue: board[0].join(''), lineDetails: board[0].map((v, i) => ({value: v, position: [0,i]}))},
        middleHRow: {lineValue: board[1].join(''), lineDetails: board[1].map((v, i) => ({value: v, position: [1,i]}))},
        bottomRow: {lineValue: board[2].join(''), lineDetails: board[2].map((v, i) => ({value: v, position: [2,i]}))},
        leftRow: {lineValue: board.map(v => v[0]).join(''), lineDetails: board.map((v, i) => ({value: v[0], position: [i,0]}))},
        middleVRow: {lineValue: board.map(v => v[1]).join(''), lineDetails: board.map((v, i) => ({value: v[1], position: [i,1]}))},
        rightRow: {lineValue: board.map(v => v[2]).join(''), lineDetails: board.map((v, i) => ({value: v[2], position: [i,2]}))},
        forwardSlashRow: {lineValue: board.map((v, i) => v[2 - i]).join(''), lineDetails: board.map((v, i) => ({value: v[2-i], position: [i,2-i]}))},
        backSlashRow: {lineValue: board.map((v, i) => v[i]).join(''), lineDetails: board.map((v, i) => ({value: v[0+i], position: [i,i]}))},
    }
}

function getObjValuesArray(obj){
    const keys = Object.keys(obj);
    return keys.map(k => obj[k]);
}

function isValueWinner(value, board){
    const allLines = getAllPossibleConsecutiveItems(board);
    const allLineValues = getObjValuesArray(allLines);
    if(allLineValues.map(v => v.lineValue).some(v =>  v === value.repeat(3))){
        return true;
    }
    return false;
}

function isBoardFull(board){
    return board.every(r => r.every(v => v !== null))
}

const Game = {
    board: null,
    winner: null, // set to winner letter when there's a winner
    usersValue: null,
    computersValue: null,
    nextTurn: null,
    gameStatus: 'STOPPED',
    init(usersValue){
        if(!['X', 'O'].includes(usersValue)){
            throw new Error('users value was set to ' + usersValue + ' but must be X or O')
        }
        this.board = JSON.parse(JSON.stringify(tttBoard));
        this.usersValue = usersValue;
        if(usersValue === 'X'){
            this.computersValue = 'O';
        } else {
            this.computersValue = 'X';
        }
        this.winner = null;
        this.nextTurn = 'X';
        this.gameStatus = 'PLAYING'
    },
    userPlaceItem({row, col}){
        //check if status is playing
        if(this.gameStatus !== 'PLAYING'){
            throw new Error('in order to place an item, game must be in playing state.')
        }
        // check if users is allowed to place item
        if(this.usersValue !== this.nextTurn){
            throw new Error(this.usersValue + ' tried placing an item, but it was the turn of ' + this.nextTurn)
        }
        //check if spot is avialable
        if(this.board[row][col] !== null){
            throw new Error('cannot place item on non-emtpy spot')
        }

        this.board[row][col] = this.usersValue;
        if(isValueWinner(this.usersValue, this.board)){
            this.gameStatus = 'STOPPED';
            this.winner = this.usersValue;
        }

        if(isBoardFull(this.board)){
            this.gameStatus = 'STOPPED'
        }

        this.nextTurn = this.computersValue;

        return {row, col};
    },
    computerPlaceItem(){
                //check if status is playing
                if(this.gameStatus !== 'PLAYING'){
                    throw new Error('in order to place an item, game must be in playing state.')
                }
                // check if users is allowed to place item
                if(this.computersValue !== this.nextTurn){
                    throw new Error(this.computersValue + ' tried placing an item, but it was the turn of ' + this.nextTurn)
                }

                const position = getPositionToWriteValue(this.computersValue, this.board);
                
                if(position){
                    const {row, col} = position;

                    this.board[row][col] = this.computersValue;
                    if(isValueWinner(this.computersValue, this.board)){
                        this.gameStatus = 'STOPPED';
                        this.winner = this.computersValue;
                    }
            
                    if(isBoardFull(this.board)){
                        this.gameStatus = 'STOPPED'
                    }

                    this.nextTurn = this.usersValue;

                    return position;
                }         
    },
}