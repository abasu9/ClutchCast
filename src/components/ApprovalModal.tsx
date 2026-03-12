import React, { useState, useEffect } from 'react';
import type { CommentaryResponse } from '../types';
import { speakText, stopSpeaking, isSpeaking } from '../utils/speechService';
import './ApprovalModal.css';

interface ApprovalModalProps {
  commentary: CommentaryResponse | null;
  isOpen: boolean;
  onApprove: () => void;
  onEdit: (editedText: string) => void;
  onRegenerate: () => void;
  onClose: () => void;
  isRegenerating: boolean;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  commentary,
  isOpen,
  onApprove,
  onEdit,
  onRegenerate,
  onClose,
  isRegenerating,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (commentary) {
      setEditedText(commentary.commentary);
      setIsEditing(false);
    }
  }, [commentary]);

  useEffect(() => {
    // Check speaking status periodically
    const interval = setInterval(() => {
      setSpeaking(isSpeaking());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen || !commentary) return null;

  const handleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      speakText(isEditing ? editedText : commentary.commentary, () => {
        setSpeaking(false);
      });
      setSpeaking(true);
    }
  };

  const handleEdit = () => {
    if (isEditing) {
      onEdit(editedText);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleApprove = () => {
    stopSpeaking();
    if (isEditing) {
      onEdit(editedText);
    }
    onApprove();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="approval-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🤖 AI Commentary Preview</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        {commentary.biasWarning && (
          <div className="bias-warning">
            {commentary.biasWarning}
          </div>
        )}

        <div className="commentary-container">
          {isEditing ? (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="commentary-edit"
              rows={6}
            />
          ) : (
            <div className="commentary-text">
              {commentary.commentary}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button 
            className="action-btn speak-btn"
            onClick={handleSpeak}
            disabled={isRegenerating}
          >
            {speaking ? '🔇 Stop' : '🔊 Listen'}
          </button>
          
          <button 
            className="action-btn edit-btn"
            onClick={handleEdit}
            disabled={isRegenerating}
          >
            {isEditing ? '💾 Save Edit' : '✏️ Edit'}
          </button>
          
          <button 
            className="action-btn regenerate-btn"
            onClick={onRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? '⏳ Generating...' : '🔄 Regenerate'}
          </button>
          
          <button 
            className="action-btn approve-btn"
            onClick={handleApprove}
            disabled={isRegenerating}
          >
            ✅ Approve
          </button>
        </div>

        <div className="modal-footer">
          <p>Review AI-generated content before displaying. Edit if needed.</p>
        </div>
      </div>
    </div>
  );
};
