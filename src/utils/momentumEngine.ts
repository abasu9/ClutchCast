import type { Play, MomentumPlay, KeyMoment, MomentTag } from '../types';

// Convert clock string (MM:SS) to seconds remaining in period
function parseClockToSeconds(clock: string): number {
  if (!clock) return 0;
  const parts = clock.split(':');
  if (parts.length !== 2) return 0;
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// Convert period and clock to total game time in seconds (0 = start, 2400 = end of regulation)
function getGameTimeSeconds(period: number, clock: string): number {
  const secondsRemaining = parseClockToSeconds(clock);
  const periodLength = 20 * 60; // 20 minutes per half
  
  if (period === 1) {
    // First half: 0-1200 seconds
    return periodLength - secondsRemaining;
  } else if (period === 2) {
    // Second half: 1200-2400 seconds
    return periodLength + (periodLength - secondsRemaining);
  } else {
    // Overtime periods
    const otLength = 5 * 60;
    return 2400 + (period - 2) * otLength + (otLength - secondsRemaining);
  }
}

// Calculate timing weight - later in game = higher stakes
function getTimingWeight(gameTimeSeconds: number, totalGameTime: number): number {
  const progress = gameTimeSeconds / totalGameTime;
  // Exponential increase towards end of game
  return 0.5 + 0.5 * Math.pow(progress, 2);
}

// Calculate score swing weight
function getScoreSwingWeight(prevDiff: number, currentDiff: number): number {
  const swing = Math.abs(currentDiff - prevDiff);
  // 3-pointer = 3 point swing, normalize to 0-1
  return Math.min(swing / 6, 1) * 0.4;
}

// Check if we're in clutch time (final 2 minutes, close game)
function isClutchTime(gameTimeSeconds: number, totalGameTime: number, scoreDiff: number): boolean {
  const timeRemaining = totalGameTime - gameTimeSeconds;
  const finalTwoMinutes = timeRemaining <= 120;
  const closeGame = Math.abs(scoreDiff) <= 8;
  return finalTwoMinutes && closeGame;
}

// Simple win probability estimate based on score and time
function estimateWinProbability(scoreDiff: number, timeRemaining: number): number {
  if (timeRemaining <= 0) return scoreDiff > 0 ? 1 : scoreDiff < 0 ? 0 : 0.5;
  
  // Points per second average
  const pps = 1.5 / 60; // ~1.5 points per minute per team
  const expectedSwing = pps * timeRemaining;
  
  // Sigmoid function centered on score difference
  const z = scoreDiff / (expectedSwing + 1);
  return 1 / (1 + Math.exp(-z * 2));
}

// Process plays and calculate momentum scores
export function processMomentumPlays(plays: Play[]): MomentumPlay[] {
  if (!plays || plays.length === 0) return [];
  
  const totalGameTime = 2400; // 40 minutes regulation
  const momentumPlays: MomentumPlay[] = [];
  
  let prevScoreDiff = 0;
  let runTracker = { team: '', points: 0, plays: 0 };
  
  for (let i = 0; i < plays.length; i++) {
    const play = plays[i];
    const scoreDiff = play.scoreHome - play.scoreAway;
    const gameTimeSeconds = getGameTimeSeconds(play.period, play.clock);
    const timeRemaining = Math.max(0, totalGameTime - gameTimeSeconds);
    
    // Track scoring runs
    const pointsScored = Math.abs(scoreDiff - prevScoreDiff);
    if (pointsScored > 0) {
      const scoringTeam = scoreDiff > prevScoreDiff ? 'home' : 'away';
      if (runTracker.team === scoringTeam) {
        runTracker.points += pointsScored;
        runTracker.plays++;
      } else {
        runTracker = { team: scoringTeam, points: pointsScored, plays: 1 };
      }
    }
    
    // Calculate component scores
    const timingWeight = getTimingWeight(gameTimeSeconds, totalGameTime);
    const scoreSwingWeight = getScoreSwingWeight(prevScoreDiff, scoreDiff);
    
    // Win probability shift
    const prevWinProb = estimateWinProbability(prevScoreDiff, timeRemaining + 1);
    const currentWinProb = estimateWinProbability(scoreDiff, timeRemaining);
    const winProbShift = Math.abs(currentWinProb - prevWinProb);
    
    // Clutch bonus
    const isClutch = isClutchTime(gameTimeSeconds, totalGameTime, scoreDiff);
    const clutchBonus = isClutch ? 0.3 : 0;
    
    // Run bonus
    const isSignificantRun = runTracker.points >= 5 && runTracker.plays >= 2;
    const runBonus = isSignificantRun ? 0.2 : 0;
    
    // Calculate final momentum score (0-100)
    let momentumScore = 0;
    momentumScore += scoreSwingWeight * 100;      // 0-40 points
    momentumScore += timingWeight * 20;            // 10-30 points
    momentumScore += winProbShift * 50;            // 0-50 points
    momentumScore += clutchBonus * 100;            // 0-30 points
    momentumScore += runBonus * 100;               // 0-20 points
    
    momentumScore = Math.min(100, Math.max(0, momentumScore));
    
    momentumPlays.push({
      ...play,
      momentumScore,
      gameTimeSeconds,
      scoreDiff,
      isRun: isSignificantRun,
      runLength: runTracker.points,
      winProbabilityShift: winProbShift,
      isClutch
    });
    
    prevScoreDiff = scoreDiff;
  }
  
  return momentumPlays;
}

// Determine the appropriate tag for a key moment
function determineMomentTag(play: MomentumPlay, plays: MomentumPlay[]): MomentTag {
  const playIndex = plays.findIndex(p => p.id === play.id);
  
  // Check for comeback - was team losing significantly and now close/winning?
  const recentPlays = plays.slice(Math.max(0, playIndex - 10), playIndex + 1);
  const wasDownBig = recentPlays.some(p => Math.abs(p.scoreDiff) >= 10);
  const nowClose = Math.abs(play.scoreDiff) <= 3;
  
  if (wasDownBig && nowClose) {
    return '💀 COMEBACK';
  }
  
  // Clutch moment in final 2 minutes
  if (play.isClutch && play.momentumScore >= 40) {
    return '🏆 CLUTCH';
  }
  
  // Dagger - put the game away late
  if (play.gameTimeSeconds >= 2200 && Math.abs(play.scoreDiff) >= 8) {
    return '⚡ DAGGER';
  }
  
  // Default to momentum shift
  return '🔥 MOMENTUM SHIFT';
}

// Detect top 5 key moments
export function detectKeyMoments(momentumPlays: MomentumPlay[]): KeyMoment[] {
  if (momentumPlays.length === 0) return [];
  
  // Sort by momentum score descending
  const sortedPlays = [...momentumPlays]
    .filter(p => p.momentumScore > 20) // Minimum threshold
    .sort((a, b) => b.momentumScore - a.momentumScore);
  
  // Take top 5, ensuring they're not too close together
  const keyMoments: KeyMoment[] = [];
  const usedTimeRanges: number[] = [];
  
  for (const play of sortedPlays) {
    if (keyMoments.length >= 5) break;
    
    // Check if too close to an existing key moment (within 30 seconds)
    const tooClose = usedTimeRanges.some(t => Math.abs(t - play.gameTimeSeconds) < 30);
    if (tooClose) continue;
    
    usedTimeRanges.push(play.gameTimeSeconds);
    keyMoments.push({
      play,
      tag: determineMomentTag(play, momentumPlays),
      rank: keyMoments.length + 1
    });
  }
  
  // Sort by game time for display
  return keyMoments.sort((a, b) => a.play.gameTimeSeconds - b.play.gameTimeSeconds);
}

// Format game time for display
export function formatGameTime(seconds: number): string {
  const period = seconds < 1200 ? 1 : seconds < 2400 ? 2 : Math.ceil((seconds - 2400) / 300) + 2;
  let periodSeconds: number;
  
  if (period === 1) {
    periodSeconds = 1200 - seconds;
  } else if (period === 2) {
    periodSeconds = 2400 - seconds;
  } else {
    periodSeconds = (period * 300 + 2100) - seconds;
  }
  
  const minutes = Math.floor(periodSeconds / 60);
  const secs = periodSeconds % 60;
  const periodName = period <= 2 ? `${period}H` : `OT${period - 2}`;
  
  return `${periodName} ${minutes}:${secs.toString().padStart(2, '0')}`;
}
