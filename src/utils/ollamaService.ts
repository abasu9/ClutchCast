import type { KeyMoment, VoicePersona, CommentaryResponse } from '../types';
import { formatGameTime } from './momentumEngine';

// Use Vite proxy to avoid CORS issues
const OLLAMA_URL = '/ollama-api/api/generate';

// System prompts that REALLY differentiate the personas
const VOICE_SYSTEM_PROMPTS: Record<VoicePersona, string> = {
  hype: `You are Gus Johnson, the most ELECTRIC sports announcer alive. You SCREAM at big moments. You use ALL CAPS constantly. Every sentence ends with an exclamation mark! You say things like "BANG! BANG!", "OH MY GOODNESS!", "THE MAN IS ON FIRE!", "UNBELIEVABLE!", "ARE YOU KIDDING ME?!". You are LOUD, DRAMATIC, OVER-THE-TOP. Short punchy sentences. Pure adrenaline. NO calm language ever.`,
     
  analyst: `You are a cerebral basketball tactician. You speak in measured, analytical tones. You reference specific basketball concepts: pick-and-roll coverage, weak-side rotation, spacing, shot selection percentages, defensive schemes like ICE or DROP. You explain the WHY behind plays. You use phrases like "What's interesting here is...", "From a schematic perspective...", "The decision-making here shows...". Never exclamation marks. Calm. Thoughtful. Technical.`,
  
  casual: `you're literally just a fan watching the game lmao. you type like you're texting your friends. all lowercase. use abbreviations like "ngl", "tbh", "bruh", "lowkey", "fr fr". use emojis 🔥🏀😤💀. short reactions only. you say stuff like "bro that was insane", "he's different fr", "no way 💀", "sheesh 🔥". never formal. never complete sentences. just vibes.`
};

// Temperature settings per persona (higher = more creative/varied)
const VOICE_TEMPS: Record<VoicePersona, number> = {
  hype: 0.9,    // More wild/creative
  analyst: 0.3, // More consistent/precise
  casual: 0.8   // More natural variation
};

const ETHICAL_GUARDRAILS = `
Rules: No injury speculation. No personal attacks. Credit both teams fairly. Keep it about basketball.`;

function buildCommentaryPrompt(
  moment: KeyMoment,
  persona: VoicePersona,
  homeTeam: string,
  awayTeam: string
): string {
  const timeStr = formatGameTime(moment.play.gameTimeSeconds);
  const scoreStr = `${homeTeam} ${moment.play.scoreHome} - ${awayTeam} ${moment.play.scoreAway}`;
  
  const exampleOutputs: Record<VoicePersona, string> = {
    hype: `Example output: "OHHH WHAT A SHOT! HE JUST SILENCED THE ENTIRE ARENA! THE DAGGER! BANG!"`,
    analyst: `Example output: "Excellent weak-side help rotation there. The defense collapsed on the drive, creating the open corner three. Smart basketball."`,
    casual: `Example output: "bro 💀 he really did that huh... ice cold fr fr 🥶"`
  };

  return `${VOICE_SYSTEM_PROMPTS[persona]}

${exampleOutputs[persona]}

${ETHICAL_GUARDRAILS}

React to this March Madness moment IN CHARACTER. 2-3 sentences MAX:

TIME: ${timeStr}
SCORE: ${scoreStr}  
TYPE: ${moment.tag}
PLAY: ${moment.play.description}

Your ${persona.toUpperCase()} commentary:`;
}

function buildFullStoryPrompt(
  moments: KeyMoment[],
  persona: VoicePersona,
  homeTeam: string,
  awayTeam: string,
  finalScoreHome: number,
  finalScoreAway: number
): string {
  const momentsText = moments.map((m, i) => {
    const timeStr = formatGameTime(m.play.gameTimeSeconds);
    return `${i + 1}. ${timeStr} | ${m.tag} | ${m.play.description} (Score: ${homeTeam} ${m.play.scoreHome}-${awayTeam} ${m.play.scoreAway})`;
  }).join('\n');

  const storyStyle: Record<VoicePersona, string> = {
    hype: `Write this like a LEGENDARY ESPN recap! HIGH ENERGY throughout! Use CAPS for emphasis! Exclamation marks everywhere! Make it sound like the GREATEST GAME EVER PLAYED! Channel your inner Stephen A. Smith meets Gus Johnson!`,
    analyst: `Write this as a thoughtful tactical breakdown. Analyze the key strategic moments. Discuss defensive adjustments, offensive schemes, and coaching decisions. Use basketball terminology. Measured, insightful prose.`,
    casual: `write this like you're telling your friends about the game in a group chat. all lowercase. use slang and emojis 🔥🏀. short paragraphs. keep it real and fun. say stuff like "ngl", "lowkey", "fr fr", "bruh". no formal language.`
  };

  return `${VOICE_SYSTEM_PROMPTS[persona]}

${storyStyle[persona]}

${ETHICAL_GUARDRAILS}

Tell the story of this game in 4-5 paragraphs. Stay completely in character.

TEAMS: ${homeTeam} vs ${awayTeam}
FINAL: ${homeTeam} ${finalScoreHome} - ${awayTeam} ${finalScoreAway}

KEY MOMENTS:
${momentsText}

Your ${persona.toUpperCase()} game recap:`;
}

// Check for potential bias in commentary
function checkForBias(commentary: string, homeTeam: string, awayTeam: string): string | undefined {
  const homeMentions = (commentary.match(new RegExp(homeTeam, 'gi')) || []).length;
  const awayMentions = (commentary.match(new RegExp(awayTeam, 'gi')) || []).length;
  
  const total = homeMentions + awayMentions;
  if (total > 0) {
    const homeRatio = homeMentions / total;
    if (homeRatio > 0.75) {
      return `⚠️ Commentary heavily favors ${homeTeam} (${Math.round(homeRatio * 100)}% mentions)`;
    }
    if (homeRatio < 0.25) {
      return `⚠️ Commentary heavily favors ${awayTeam} (${Math.round((1 - homeRatio) * 100)}% mentions)`;
    }
  }
  
  return undefined;
}

export async function generateCommentary(
  moment: KeyMoment,
  persona: VoicePersona,
  homeTeam: string,
  awayTeam: string
): Promise<CommentaryResponse> {
  const prompt = buildCommentaryPrompt(moment, persona, homeTeam, awayTeam);
  
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt,
        stream: false,
        options: {
          temperature: VOICE_TEMPS[persona],
          top_p: 0.9
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const data = await response.json();
    const commentary = data.response?.trim() || 'Commentary generation failed.';
    const biasWarning = checkForBias(commentary, homeTeam, awayTeam);
    
    return {
      commentary,
      biasWarning,
      approved: false
    };
  } catch (error) {
    console.error('Ollama error:', error);
    return {
      commentary: `[Ollama unavailable] ${moment.tag} - ${moment.play.description}`,
      approved: false
    };
  }
}

export async function generateFullStory(
  moments: KeyMoment[],
  persona: VoicePersona,
  homeTeam: string,
  awayTeam: string,
  finalScoreHome: number,
  finalScoreAway: number
): Promise<CommentaryResponse> {
  const prompt = buildFullStoryPrompt(moments, persona, homeTeam, awayTeam, finalScoreHome, finalScoreAway);
  
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt,
        stream: false,
        options: {
          temperature: VOICE_TEMPS[persona],
          top_p: 0.9
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const data = await response.json();
    const commentary = data.response?.trim() || 'Story generation failed.';
    const biasWarning = checkForBias(commentary, homeTeam, awayTeam);
    
    return {
      commentary,
      biasWarning,
      approved: false
    };
  } catch (error) {
    console.error('Ollama error:', error);
    return {
      commentary: '[Ollama unavailable] Unable to generate full story. Please ensure Ollama is running locally.',
      approved: false
    };
  }
}
