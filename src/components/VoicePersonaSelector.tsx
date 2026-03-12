import React from 'react';
import type { VoicePersona, VoicePersonaConfig } from '../types';
import './VoicePersonaSelector.css';

const PERSONAS: VoicePersonaConfig[] = [
  {
    id: 'hype',
    name: 'Hype Announcer',
    description: 'ESPN energy, dramatic calls',
    systemPrompt: '',
    icon: '🎙️'
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'Tactical & calm, explains the why',
    systemPrompt: '',
    icon: '🧠'
  },
  {
    id: 'casual',
    name: 'Casual Fan',
    description: 'Group chat vibes, emojis',
    systemPrompt: '',
    icon: '📱'
  }
];

interface VoicePersonaSelectorProps {
  selectedPersona: VoicePersona;
  onPersonaChange: (persona: VoicePersona) => void;
}

export const VoicePersonaSelector: React.FC<VoicePersonaSelectorProps> = ({
  selectedPersona,
  onPersonaChange,
}) => {
  return (
    <div className="voice-persona-selector">
      <h3>🎤 Voice Persona</h3>
      <div className="personas-row">
        {PERSONAS.map((persona) => (
          <button
            key={persona.id}
            className={`persona-btn ${selectedPersona === persona.id ? 'selected' : ''}`}
            onClick={() => onPersonaChange(persona.id)}
          >
            <span className="persona-icon">{persona.icon}</span>
            <span className="persona-name">{persona.name}</span>
            <span className="persona-desc">{persona.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
