// NCAA API Types
export interface Play {
  id: string;
  clock: string;
  period: number;
  description: string;
  scoreHome: number;
  scoreAway: number;
  team?: string;
  playType?: string;
}

export interface GameData {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  plays: Play[];
  finalScoreHome: number;
  finalScoreAway: number;
}

// Momentum Engine Types
export interface MomentumPlay extends Play {
  momentumScore: number;
  gameTimeSeconds: number;
  scoreDiff: number;
  isRun: boolean;
  runLength: number;
  winProbabilityShift: number;
  isClutch: boolean;
}

export interface KeyMoment {
  play: MomentumPlay;
  tag: MomentTag;
  rank: number;
  commentary?: string;
  approved?: boolean;
}

export type MomentTag = '🔥 MOMENTUM SHIFT' | '⚡ DAGGER' | '💀 COMEBACK' | '🏆 CLUTCH';

// Voice Persona Types
export type VoicePersona = 'hype' | 'analyst' | 'casual';

export interface VoicePersonaConfig {
  id: VoicePersona;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
}

// Commentary Types
export interface CommentaryRequest {
  moment: KeyMoment;
  persona: VoicePersona;
  homeTeam: string;
  awayTeam: string;
}

export interface CommentaryResponse {
  commentary: string;
  biasWarning?: string;
  approved: boolean;
}

// Famous Games
export interface FamousGame {
  id: string;
  name: string;
  year: number;
  description: string;
}
