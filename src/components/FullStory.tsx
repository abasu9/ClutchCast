import React, { useState, useEffect } from 'react';
import type { KeyMoment, VoicePersona, CommentaryResponse } from '../types';
import { generateFullStory } from '../utils/ollamaService';
import { speakText, stopSpeaking, isSpeaking } from '../utils/speechService';
import './FullStory.css';

interface FullStoryProps {
  moments: KeyMoment[];
  homeTeam: string;
  awayTeam: string;
  finalScoreHome: number;
  finalScoreAway: number;
  selectedPersona: VoicePersona;
}

export const FullStory: React.FC<FullStoryProps> = ({
  moments,
  homeTeam,
  awayTeam,
  finalScoreHome,
  finalScoreAway,
  selectedPersona,
}) => {
  const [story, setStory] = useState<CommentaryResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [lastPersona, setLastPersona] = useState<VoicePersona>(selectedPersona);

  // Clear story when persona changes so user regenerates with new voice
  useEffect(() => {
    if (selectedPersona !== lastPersona) {
      setStory(null);
      setLastPersona(selectedPersona);
      stopSpeaking();
    }
  }, [selectedPersona, lastPersona]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpeaking(isSpeaking());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleGenerateStory = async () => {
    setIsGenerating(true);
    setIsExpanded(true);
    
    try {
      const response = await generateFullStory(
        moments,
        selectedPersona,
        homeTeam,
        awayTeam,
        finalScoreHome,
        finalScoreAway
      );
      setStory(response);
    } catch (error) {
      console.error('Error generating story:', error);
      setStory({
        commentary: 'Failed to generate story. Please ensure Ollama is running.',
        approved: false
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else if (story) {
      speakText(story.commentary, () => setSpeaking(false));
      setSpeaking(true);
    }
  };

  if (moments.length === 0) return null;

  return (
    <div className="full-story">
      <div className="story-header">
        <h2>📖 Full Story</h2>
        <button 
          className="generate-story-btn"
          onClick={handleGenerateStory}
          disabled={isGenerating}
        >
          {isGenerating ? '⏳ Generating...' : '✨ Tell the Full Story'}
        </button>
      </div>

      {isExpanded && (
        <div className="story-content">
          {isGenerating ? (
            <div className="story-loading">
              <div className="story-spinner"></div>
              <p>Crafting the narrative...</p>
            </div>
          ) : story ? (
            <>
              {story.biasWarning && (
                <div className="story-bias-warning">{story.biasWarning}</div>
              )}
              <div className="story-text">
                {story.commentary.split('\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
              <div className="story-actions">
                <button className="story-action-btn" onClick={handleSpeak}>
                  {speaking ? '🔇 Stop' : '🔊 Read Aloud'}
                </button>
                <button className="story-action-btn" onClick={handleGenerateStory}>
                  🔄 Regenerate
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
