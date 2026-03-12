import React, { useState, useEffect } from 'react';
import type { KeyMoment } from '../types';
import { formatGameTime } from '../utils/momentumEngine';
import { speakText, stopSpeaking, isSpeaking } from '../utils/speechService';
import './ApprovedCommentary.css';

interface ApprovedCommentaryProps {
  moment: KeyMoment;
  commentary: string;
}

export const ApprovedCommentary: React.FC<ApprovedCommentaryProps> = ({
  moment,
  commentary,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    // Trigger animation
    setIsVisible(true);
    
    return () => {
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpeaking(isSpeaking());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      speakText(commentary, () => setSpeaking(false));
      setSpeaking(true);
    }
  };

  return (
    <div className={`approved-commentary ${isVisible ? 'visible' : ''}`}>
      <div className="commentary-header">
        <span className="commentary-tag">{moment.tag}</span>
        <span className="commentary-time">{formatGameTime(moment.play.gameTimeSeconds)}</span>
        <span className="commentary-score">
          {moment.play.scoreHome} - {moment.play.scoreAway}
        </span>
      </div>
      
      <div className="commentary-body">
        <p>{commentary}</p>
      </div>
      
      <div className="commentary-footer">
        <button className="speak-btn" onClick={handleSpeak}>
          {speaking ? '🔇 Stop' : '🔊 Read Aloud'}
        </button>
      </div>
    </div>
  );
};
