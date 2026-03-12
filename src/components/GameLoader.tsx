import React, { useState } from 'react';
import { FAMOUS_GAMES } from '../utils/ncaaApi';
import './GameLoader.css';

interface GameLoaderProps {
  onLoadGame: (gameId: string) => void;
  isLoading: boolean;
}

export const GameLoader: React.FC<GameLoaderProps> = ({ onLoadGame, isLoading }) => {
  const [gameId, setGameId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameId.trim()) {
      onLoadGame(gameId.trim());
    }
  };

  return (
    <div className="game-loader">
      <h2>🏀 Load a Game</h2>
      
      <form onSubmit={handleSubmit} className="game-id-form">
        <input
          type="text"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          placeholder="Enter NCAA Game ID..."
          disabled={isLoading}
          className="game-id-input"
        />
        <button type="submit" disabled={isLoading || !gameId.trim()} className="load-btn">
          {isLoading ? '⏳ Loading...' : '🎯 Load Game'}
        </button>
      </form>

      <div className="famous-games">
        <h3>⭐ Famous March Madness Games</h3>
        <div className="famous-games-grid">
          {FAMOUS_GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => onLoadGame(game.id)}
              disabled={isLoading}
              className="famous-game-btn"
            >
              <span className="game-year">{game.year}</span>
              <span className="game-name">{game.name}</span>
              <span className="game-desc">{game.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
