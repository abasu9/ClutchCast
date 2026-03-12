import type { Play, GameData, FamousGame } from '../types';

// Use Vite proxy to bypass CORS
const NCAA_API_BASE = '/ncaa-api';

// Famous March Madness games as fallbacks
export const FAMOUS_GAMES: FamousGame[] = [
  {
    id: '5764053',
    name: 'Florida St vs Virginia',
    year: 2021,
    description: 'ACC Tournament matchup'
  },
  {
    id: '6501693',
    name: 'Long Beach St vs Hawaii',
    year: 2026,
    description: 'Big West Conference game'
  },
  {
    id: '6503203',
    name: 'Penn St vs Rutgers',
    year: 2026,
    description: 'Big Ten Conference showdown'
  }
];

// Actual NCAA API response types
interface NcaaTeam {
  isHome: boolean;
  nameShort: string;
  nameFull: string;
  teamName: string;
  teamId: string;
}

interface NcaaPlayStat {
  teamId: number;
  homeScore: number;
  visitorScore: number;
  clock: string;
  eventDescription: string;
  isHome: boolean;
  eventId: number;
}

interface NcaaPeriod {
  periodNumber: number;
  periodDisplay: string;
  playbyplayStats: NcaaPlayStat[];
}

interface NcaaApiResponse {
  contestId: number;
  title: string;
  description: string;
  status: string;
  period: number;
  teams: NcaaTeam[];
  periods: NcaaPeriod[];
}

function normalizePlay(play: NcaaPlayStat, periodNumber: number, index: number): Play {
  return {
    id: `play-${periodNumber}-${play.eventId || index}`,
    clock: play.clock || '0:00',
    period: periodNumber,
    description: play.eventDescription || 'Play',
    scoreHome: play.homeScore ?? 0,
    scoreAway: play.visitorScore ?? 0,
    team: play.isHome ? 'home' : 'away',
    playType: undefined
  };
}

export async function fetchGameData(gameId: string): Promise<GameData> {
  try {
    const response = await fetch(`${NCAA_API_BASE}/game/${gameId}/play-by-play`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: NcaaApiResponse = await response.json();
    
    // Extract team names from teams array
    const homeTeamData = data.teams?.find(t => t.isHome);
    const awayTeamData = data.teams?.find(t => !t.isHome);
    
    const homeTeam = homeTeamData?.nameShort || homeTeamData?.teamName || 'Home';
    const awayTeam = awayTeamData?.nameShort || awayTeamData?.teamName || 'Away';
    
    // Extract plays from periods
    const plays: Play[] = [];
    
    if (data.periods && Array.isArray(data.periods)) {
      for (const period of data.periods) {
        if (period.playbyplayStats && Array.isArray(period.playbyplayStats)) {
          for (let i = 0; i < period.playbyplayStats.length; i++) {
            const playStat = period.playbyplayStats[i];
            plays.push(normalizePlay(playStat, period.periodNumber, i));
          }
        }
      }
    }
    
    // Get final score from last play or default to 0
    const finalScoreHome = plays.length > 0 ? plays[plays.length - 1].scoreHome : 0;
    const finalScoreAway = plays.length > 0 ? plays[plays.length - 1].scoreAway : 0;
    
    return {
      gameId,
      homeTeam,
      awayTeam,
      plays,
      finalScoreHome,
      finalScoreAway
    };
  } catch (error) {
    console.error('Failed to fetch game data:', error);
    throw new Error(`Failed to load game ${gameId}. Please check the game ID and try again.`);
  }
}

// Generate mock data for demo purposes when API is unavailable
export function generateMockGameData(): GameData {
  const plays: Play[] = [];
  let homeScore = 0;
  let awayScore = 0;
  
  // Generate ~100 plays across a full game
  for (let i = 0; i < 100; i++) {
    const period = i < 50 ? 1 : 2;
    const periodTime = period === 1 ? 50 - i : 100 - i;
    const minutes = Math.floor(periodTime * 20 / 50);
    const seconds = (periodTime * 20 / 50 - minutes) * 60;
    
    // Random scoring
    const scoringTeam = Math.random() > 0.5 ? 'home' : 'away';
    const points = Math.random() > 0.7 ? 3 : 2;
    
    if (scoringTeam === 'home') {
      homeScore += points;
    } else {
      awayScore += points;
    }
    
    plays.push({
      id: `mock-${i}`,
      clock: `${minutes}:${Math.floor(seconds).toString().padStart(2, '0')}`,
      period,
      description: `${scoringTeam === 'home' ? 'Home' : 'Away'} team ${points}-pointer`,
      scoreHome: homeScore,
      scoreAway: awayScore,
      team: scoringTeam
    });
  }
  
  return {
    gameId: 'mock-game',
    homeTeam: 'Wildcats',
    awayTeam: 'Tigers',
    plays,
    finalScoreHome: homeScore,
    finalScoreAway: awayScore
  };
}
