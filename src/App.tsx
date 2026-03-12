import { useState, useEffect } from 'react';
import {
  GameLoader,
  MomentumTimeline,
  MomentCards,
  VoicePersonaSelector,
  ApprovalModal,
  FullStory,
  ApprovedCommentary,
} from './components';
import type { 
  GameData, 
  MomentumPlay, 
  KeyMoment, 
  VoicePersona, 
  CommentaryResponse 
} from './types';
import { fetchGameData } from './utils/ncaaApi';
import { processMomentumPlays, detectKeyMoments } from './utils/momentumEngine';
import { generateCommentary } from './utils/ollamaService';
import { initVoices } from './utils/speechService';
import './App.css';

function App() {
  // Game state
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [momentumPlays, setMomentumPlays] = useState<MomentumPlay[]>([]);
  const [keyMoments, setKeyMoments] = useState<KeyMoment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedMoment, setSelectedMoment] = useState<KeyMoment | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<VoicePersona>('hype');
  
  // Commentary state
  const [pendingCommentary, setPendingCommentary] = useState<CommentaryResponse | null>(null);
  const [approvedCommentary, setApprovedCommentary] = useState<Map<string, string>>(new Map());
  const [isGeneratingCommentary, setIsGeneratingCommentary] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Initialize speech synthesis voices
  useEffect(() => {
    initVoices();
  }, []);

  // Clear commentary when persona changes - forces regeneration with new voice
  useEffect(() => {
    setApprovedCommentary(new Map());
    setPendingCommentary(null);
    setShowApprovalModal(false);
  }, [selectedPersona]);

  // Load game data
  const handleLoadGame = async (gameId: string) => {
    setIsLoading(true);
    setError(null);
    setGameData(null);
    setMomentumPlays([]);
    setKeyMoments([]);
    setSelectedMoment(null);
    setApprovedCommentary(new Map());

    try {
      const data = await fetchGameData(gameId);
      setGameData(data);

      // Process momentum
      const plays = processMomentumPlays(data.plays);
      setMomentumPlays(plays);

      // Detect key moments
      const moments = detectKeyMoments(plays);
      setKeyMoments(moments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle moment click - generate commentary
  const handleMomentClick = async (moment: KeyMoment) => {
    setSelectedMoment(moment);

    // If already have approved commentary, don't regenerate
    if (approvedCommentary.has(moment.play.id)) {
      return;
    }

    // Generate new commentary
    setIsGeneratingCommentary(true);
    
    try {
      const response = await generateCommentary(
        moment,
        selectedPersona,
        gameData?.homeTeam || 'Home',
        gameData?.awayTeam || 'Away'
      );
      setPendingCommentary(response);
      setShowApprovalModal(true);
    } catch (err) {
      console.error('Commentary generation failed:', err);
    } finally {
      setIsGeneratingCommentary(false);
    }
  };

  // Approve commentary
  const handleApproveCommentary = () => {
    if (selectedMoment && pendingCommentary) {
      setApprovedCommentary(prev => {
        const newMap = new Map(prev);
        newMap.set(selectedMoment.play.id, pendingCommentary.commentary);
        return newMap;
      });
    }
    setShowApprovalModal(false);
    setPendingCommentary(null);
  };

  // Edit commentary
  const handleEditCommentary = (editedText: string) => {
    if (pendingCommentary) {
      setPendingCommentary({
        ...pendingCommentary,
        commentary: editedText
      });
    }
  };

  // Regenerate commentary
  const handleRegenerateCommentary = async () => {
    if (!selectedMoment || !gameData) return;

    setIsGeneratingCommentary(true);
    try {
      const response = await generateCommentary(
        selectedMoment,
        selectedPersona,
        gameData.homeTeam,
        gameData.awayTeam
      );
      setPendingCommentary(response);
    } catch (err) {
      console.error('Commentary regeneration failed:', err);
    } finally {
      setIsGeneratingCommentary(false);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>🏀 CLUTCHCAST</h1>
        <p className="tagline">AI Sports Commentary & Key Moment Detection</p>
      </header>

      <main className="app-main">
        {/* Game not loaded - show loader */}
        {!gameData && !isLoading && (
          <GameLoader onLoadGame={handleLoadGame} isLoading={isLoading} />
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Loading game data...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <button onClick={() => setError(null)}>Try Again</button>
          </div>
        )}

        {/* Game loaded - show dashboard */}
        {gameData && !isLoading && (
          <div className="game-dashboard">
            {/* Game info header */}
            <div className="game-info">
              <div className="team home-team">
                <span className="team-name">{gameData.homeTeam}</span>
                <span className="team-score">{gameData.finalScoreHome}</span>
              </div>
              <div className="vs">VS</div>
              <div className="team away-team">
                <span className="team-score">{gameData.finalScoreAway}</span>
                <span className="team-name">{gameData.awayTeam}</span>
              </div>
              <button 
                className="new-game-btn"
                onClick={() => {
                  setGameData(null);
                  setMomentumPlays([]);
                  setKeyMoments([]);
                }}
              >
                Load New Game
              </button>
            </div>

            {/* Voice persona selector */}
            <VoicePersonaSelector 
              selectedPersona={selectedPersona}
              onPersonaChange={setSelectedPersona}
            />

            {/* Momentum timeline - hero element */}
            <MomentumTimeline
              plays={momentumPlays}
              keyMoments={keyMoments}
              selectedMoment={selectedMoment}
              onMomentClick={handleMomentClick}
            />

            {/* Key moment cards */}
            <MomentCards
              moments={keyMoments}
              selectedMoment={selectedMoment}
              onMomentClick={handleMomentClick}
              isGenerating={isGeneratingCommentary}
            />

            {/* Approved commentary display */}
            {selectedMoment && approvedCommentary.has(selectedMoment.play.id) && (
              <ApprovedCommentary
                moment={selectedMoment}
                commentary={approvedCommentary.get(selectedMoment.play.id)!}
              />
            )}

            {/* Full story generator */}
            <FullStory
              moments={keyMoments}
              homeTeam={gameData.homeTeam}
              awayTeam={gameData.awayTeam}
              finalScoreHome={gameData.finalScoreHome}
              finalScoreAway={gameData.finalScoreAway}
              selectedPersona={selectedPersona}
            />
          </div>
        )}
      </main>

      {/* Approval Modal */}
      <ApprovalModal
        commentary={pendingCommentary}
        isOpen={showApprovalModal}
        onApprove={handleApproveCommentary}
        onEdit={handleEditCommentary}
        onRegenerate={handleRegenerateCommentary}
        onClose={() => setShowApprovalModal(false)}
        isRegenerating={isGeneratingCommentary}
      />

      {/* Footer */}
      <footer className="app-footer">
        <p>CLUTCHCAST — AI-Powered March Madness Commentary</p>
        <p className="disclaimer">AI-generated content. Review before sharing.</p>
      </footer>
    </div>
  );
}

export default App;
