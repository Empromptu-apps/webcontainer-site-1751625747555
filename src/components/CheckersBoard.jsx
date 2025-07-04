import React, { useState, useEffect } from 'react';

const CheckersBoard = () => {
  // Initialize 8x8 board with pieces
  const initializeBoard = () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Place black pieces (AI) on top rows
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { color: 'black', isKing: false };
        }
      }
    }
    
    // Place red pieces (player) on bottom rows
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { color: 'red', isKing: false };
        }
      }
    }
    
    return board;
  };

  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('red');
  const [gameStatus, setGameStatus] = useState('playing');
  const [aiAgent, setAiAgent] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [apiCalls, setApiCalls] = useState([]);

  // Log API calls
  const logApiCall = (call) => {
    setApiCalls(prev => [...prev, { ...call, timestamp: new Date().toISOString() }]);
  };

  // Create AI agent on component mount
  useEffect(() => {
    const createAI = async () => {
      try {
        const requestData = {
          instructions: "You are a checkers AI opponent. When given a board state, analyze it and return your move in the format 'from_row,from_col to to_row,to_col'. Make strategic moves to capture opponent pieces when possible, otherwise make good positional moves. Keep responses brief and only return the move.",
          agent_name: "Checkers AI"
        };

        logApiCall({
          type: 'REQUEST',
          endpoint: '/api_tools/create-agent',
          data: requestData
        });

        const response = await fetch('/api_tools/create-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer hrvbv45mdftmconqclw'
          },
          body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        
        logApiCall({
          type: 'RESPONSE',
          endpoint: '/api_tools/create-agent',
          data: data
        });

        setAiAgent(data.agent_id);
      } catch (error) {
        console.error('Failed to create AI agent:', error);
        logApiCall({
          type: 'ERROR',
          endpoint: '/api_tools/create-agent',
          data: { error: error.message }
        });
      }
    };
    createAI();
  }, []);

  // Convert board to string representation for AI
  const boardToString = (board) => {
    let boardStr = "Current board state (R=red player, B=black AI, K=king, .=empty):\n";
    boardStr += "  0 1 2 3 4 5 6 7\n";
    for (let row = 0; row < 8; row++) {
      boardStr += row + " ";
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (!piece) {
          boardStr += ". ";
        } else {
          const symbol = piece.color === 'red' ? 'R' : 'B';
          boardStr += (piece.isKing ? symbol + 'K' : symbol + ' ');
        }
      }
      boardStr += "\n";
    }
    return boardStr;
  };

  // Get valid moves for a piece
  const getValidMoves = (board, row, col) => {
    const piece = board[row][col];
    if (!piece) return [];
    
    const moves = [];
    const directions = piece.isKing ? 
      [[-1, -1], [-1, 1], [1, -1], [1, 1]] : 
      piece.color === 'red' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
    
    directions.forEach(([dRow, dCol]) => {
      const newRow = row + dRow;
      const newCol = col + dCol;
      
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        if (!board[newRow][newCol]) {
          moves.push([newRow, newCol]);
        } else if (board[newRow][newCol].color !== piece.color) {
          // Check for jump
          const jumpRow = newRow + dRow;
          const jumpCol = newCol + dCol;
          if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8 && !board[jumpRow][jumpCol]) {
            moves.push([jumpRow, jumpCol]);
          }
        }
      }
    });
    
    return moves;
  };

  // Make a move on the board
  const makeMove = (fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fromRow][fromCol];
    
    // Move piece
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;
    
    // Check for capture
    if (Math.abs(toRow - fromRow) === 2) {
      const captureRow = (fromRow + toRow) / 2;
      const captureCol = (fromCol + toCol) / 2;
      newBoard[captureRow][captureCol] = null;
    }
    
    // Check for king promotion
    if ((piece.color === 'red' && toRow === 0) || (piece.color === 'black' && toRow === 7)) {
      newBoard[toRow][toCol].isKing = true;
    }
    
    return newBoard;
  };

  // Handle square click
  const handleSquareClick = (row, col) => {
    if (currentPlayer !== 'red' || gameStatus !== 'playing' || isAiThinking) return;
    
    if (selectedSquare) {
      const [selectedRow, selectedCol] = selectedSquare;
      const validMoves = getValidMoves(board, selectedRow, selectedCol);
      
      if (validMoves.some(([r, c]) => r === row && c === col)) {
        const newBoard = makeMove(selectedRow, selectedCol, row, col);
        setBoard(newBoard);
        setSelectedSquare(null);
        setCurrentPlayer('black');
      } else {
        setSelectedSquare(null);
      }
    } else if (board[row][col] && board[row][col].color === 'red') {
      setSelectedSquare([row, col]);
    }
  };

  // AI move
  useEffect(() => {
    if (currentPlayer === 'black' && aiAgent && gameStatus === 'playing') {
      const makeAIMove = async () => {
        setIsAiThinking(true);
        try {
          const boardString = boardToString(board);
          const message = `${boardString}\nMake your move as black pieces. Return only the move in format: from_row,from_col to to_row,to_col`;
          
          const requestData = {
            agent_id: aiAgent,
            message: message
          };

          logApiCall({
            type: 'REQUEST',
            endpoint: '/api_tools/chat',
            data: requestData
          });

          const response = await fetch('/api_tools/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer hrvbv45mdftmconqclw'
            },
            body: JSON.stringify(requestData)
          });
          
          const data = await response.json();
          
          logApiCall({
            type: 'RESPONSE',
            endpoint: '/api_tools/chat',
            data: data
          });

          const moveMatch = data.response.match(/(\d),(\d) to (\d),(\d)/);
          
          if (moveMatch) {
            const [, fromRow, fromCol, toRow, toCol] = moveMatch.map(Number);
            const newBoard = makeMove(fromRow, fromCol, toRow, toCol);
            setBoard(newBoard);
            setCurrentPlayer('red');
          }
        } catch (error) {
          console.error('AI move failed:', error);
          logApiCall({
            type: 'ERROR',
            endpoint: '/api_tools/chat',
            data: { error: error.message }
          });
          setCurrentPlayer('red');
        } finally {
          setIsAiThinking(false);
        }
      };
      
      setTimeout(makeAIMove, 1000);
    }
  }, [currentPlayer, aiAgent, board, gameStatus]);

  // Reset game
  const resetGame = () => {
    setBoard(initializeBoard());
    setSelectedSquare(null);
    setCurrentPlayer('red');
    setGameStatus('playing');
    setIsAiThinking(false);
  };

  // Expose API calls and reset function to parent
  useEffect(() => {
    window.checkersApiCalls = apiCalls;
    window.resetCheckersGame = resetGame;
  }, [apiCalls]);

  return (
    <div className="game-card">
      {/* Game Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Game Board
          </h2>
          <div className="flex items-center space-x-4">
            {isAiThinking && (
              <div className="flex items-center space-x-2 text-primary-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span className="text-sm">AI thinking...</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-600 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">
              You {currentPlayer === 'red' && !isAiThinking ? '(Your turn)' : ''}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">
              AI {currentPlayer === 'black' || isAiThinking ? '(AI turn)' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Checkers Board */}
      <div className="flex justify-center">
        <div className="grid grid-cols-8 gap-0 border-4 border-amber-800 rounded-lg overflow-hidden shadow-lg">
          {board.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const isSelected = selectedSquare && selectedSquare[0] === rowIndex && selectedSquare[1] === colIndex;
              const isValidMove = selectedSquare && getValidMoves(board, selectedSquare[0], selectedSquare[1])
                .some(([r, c]) => r === rowIndex && c === colIndex);
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                  className={`
                    checkers-square
                    ${(rowIndex + colIndex) % 2 === 0 ? 'bg-amber-100' : 'bg-amber-800'}
                    ${isSelected ? 'ring-4 ring-yellow-400' : ''}
                    ${isValidMove ? 'ring-2 ring-green-400' : ''}
                    ${currentPlayer === 'red' && !isAiThinking ? 'cursor-pointer' : 'cursor-not-allowed'}
                  `}
                  role="button"
                  tabIndex={0}
                  aria-label={`Square ${rowIndex}-${colIndex} ${piece ? `with ${piece.color} ${piece.isKing ? 'king' : 'piece'}` : 'empty'}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSquareClick(rowIndex, colIndex);
                    }
                  }}
                >
                  {piece && (
                    <div className={`
                      checkers-piece
                      ${piece.color === 'red' ? 'bg-red-600' : 'bg-gray-800'}
                      ${isSelected ? 'scale-110' : ''}
                    `}>
                      {piece.isKing ? '♔' : ''}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">How to Play:</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• Click a red piece to select it</li>
          <li>• Click a highlighted square to move</li>
          <li>• Jump over opponent pieces to capture them</li>
          <li>• Reach the opposite end to become a king</li>
        </ul>
      </div>
    </div>
  );
};

export default CheckersBoard;
