import React from 'react';

const GameControls = () => {
  const resetGame = () => {
    if (window.resetCheckersGame) {
      window.resetCheckersGame();
    }
  };

  return (
    <div className="game-card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Game Controls
      </h3>
      
      <div className="space-y-4">
        <button
          onClick={resetGame}
          className="btn-primary w-full"
          aria-label="Start a new game"
        >
          New Game
        </button>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-2">Game Features:</p>
          <ul className="space-y-1">
            <li>• AI-powered opponent</li>
            <li>• Standard checkers rules</li>
            <li>• King piece promotion</li>
            <li>• Capture mechanics</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GameControls;
