/**
 * Connect 4 Game Logic
 * Pure game logic - no API, no DB
 */

class Connect4Game {
  constructor(redMolt, yellowMolt, existingState = null) {
    this.rows = 6;
    this.cols = 7;
    
    if (existingState) {
      // Restore from DB
      this.board = existingState.board;
      this.redMolt = existingState.red_molt;
      this.yellowMolt = existingState.yellow_molt;
      this.currentTurn = existingState.current_turn;
      this.status = existingState.status;
      this.winner = existingState.winner;
      this.moves = existingState.moves || [];
      this.id = existingState.id;
      this.createdAt = existingState.created_at;
    } else {
      // New game
      this.board = this.createEmptyBoard();
      this.redMolt = redMolt;
      this.yellowMolt = yellowMolt;
      this.currentTurn = 'red';
      this.status = 'playing';
      this.winner = null;
      this.moves = [];
      this.createdAt = new Date().toISOString();
    }
  }

  createEmptyBoard() {
    return Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
  }

  makeMove(color, col) {
    // Validate game is still playing
    if (this.status !== 'playing') {
      return { success: false, error: 'Game is over' };
    }

    // Validate it's this player's turn
    if (color !== this.currentTurn) {
      return { success: false, error: 'Not your turn' };
    }

    const colIndex = col - 1;

    if (colIndex < 0 || colIndex >= this.cols) {
      return { success: false, error: 'Invalid column (must be 1-7)' };
    }

    let rowIndex = -1;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.board[r][colIndex] === 0) {
        rowIndex = r;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Column is full' };
    }

    const piece = color === 'red' ? 1 : 2;
    this.board[rowIndex][colIndex] = piece;
    
    // Record move
    this.moves.push({
      player: color,
      column: col,
      row: rowIndex,
      moveNumber: this.moves.length + 1,
      timestamp: new Date().toISOString()
    });

    if (this.checkWin(rowIndex, colIndex, piece)) {
      this.status = `${color}_wins`;
      this.winner = color;
      return { 
        success: true, 
        winner: color, 
        status: this.status
      };
    }

    if (this.isBoardFull()) {
      this.status = 'draw';
      return { 
        success: true, 
        winner: null, 
        status: 'draw'
      };
    }

    this.currentTurn = this.currentTurn === 'red' ? 'yellow' : 'red';

    return { 
      success: true, 
      winner: null, 
      status: 'playing',
      nextTurn: this.currentTurn
    };
  }

  checkWin(row, col, piece) {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dr, dc] of directions) {
      let count = 1;

      let r = row + dr, c = col + dc;
      while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === piece) {
        count++;
        r += dr;
        c += dc;
      }

      r = row - dr;
      c = col - dc;
      while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === piece) {
        count++;
        r -= dr;
        c -= dc;
      }

      if (count >= 4) return true;
    }

    return false;
  }

  isBoardFull() {
    return this.board[0].every(cell => cell !== 0);
  }

  getValidMoves() {
    const valid = [];
    for (let c = 0; c < this.cols; c++) {
      if (this.board[0][c] === 0) valid.push(c + 1);
    }
    return valid;
  }

  toJSON(forMolt = null) {
    return {
      board: this.board,
      redMolt: this.redMolt,
      yellowMolt: this.yellowMolt,
      currentTurn: this.currentTurn,
      yourColor: forMolt === this.redMolt ? 'red' : 
                 forMolt === this.yellowMolt ? 'yellow' : null,
      validMoves: this.getValidMoves(),
      status: this.status,
      winner: this.winner,
      moves: this.moves,
      moveCount: this.moves.length
    };
  }

  toText() {
    const symbols = { 0: '.', 1: 'R', 2: 'Y' };
    let text = '';
    for (const row of this.board) {
      text += row.map(cell => symbols[cell]).join(' ') + '\n';
    }
    text += '-------------\n1 2 3 4 5 6 7\n';
    text += `\nTurn: ${this.currentTurn.toUpperCase()}`;
    text += `\nStatus: ${this.status}`;
    text += `\nValid moves: ${this.getValidMoves().join(', ')}`;
    return text;
  }

  // For saving to DB
  toDBFormat() {
    return {
      board: this.board,
      red_molt: this.redMolt,
      yellow_molt: this.yellowMolt,
      current_turn: this.currentTurn,
      status: this.status,
      winner: this.winner,
      moves: this.moves
    };
  }
}

module.exports = Connect4Game;
