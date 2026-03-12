import React from 'react';
import type { KeyMoment } from '../types';
import { formatGameTime } from '../utils/momentumEngine';
import './MomentCards.css';

interface MomentCardsProps {
  moments: KeyMoment[];
  selectedMoment: KeyMoment | null;
  onMomentClick: (moment: KeyMoment) => void;
  isGenerating: boolean;
}

export const MomentCards: React.FC<MomentCardsProps> = ({
  moments,
  selectedMoment,
  onMomentClick,
  isGenerating,
}) => {
  return (
    <div className="moment-cards">
      <h2>🎯 Top 5 Key Moments</h2>
      <div className="cards-grid">
        {moments.map((moment) => {
          const isSelected = selectedMoment?.play.id === moment.play.id;
          return (
            <button
              key={moment.play.id}
              className={`moment-card ${isSelected ? 'selected' : ''} ${isGenerating && isSelected ? 'generating' : ''}`}
              onClick={() => onMomentClick(moment)}
              disabled={isGenerating}
            >
              <div className="moment-header">
                <span className="moment-rank">#{moment.rank}</span>
                <span className="moment-tag">{moment.tag}</span>
              </div>
              <div className="moment-time">{formatGameTime(moment.play.gameTimeSeconds)}</div>
              <div className="moment-score">
                {moment.play.scoreHome} - {moment.play.scoreAway}
              </div>
              <div className="moment-desc">{moment.play.description}</div>
              <div className="moment-momentum">
                <span className="momentum-label">Momentum</span>
                <div className="momentum-bar">
                  <div 
                    className="momentum-fill"
                    style={{ width: `${moment.play.momentumScore}%` }}
                  ></div>
                </div>
                <span className="momentum-value">{moment.play.momentumScore.toFixed(0)}</span>
              </div>
              {isSelected && isGenerating && (
                <div className="generating-indicator">
                  <span className="spinner"></span> Generating...
                </div>
              )}
              {!isSelected && !isGenerating && (
                <div className="click-hint">Click for AI commentary</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
