// Web Speech API service for text-to-speech

let currentUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoice: SpeechSynthesisVoice | null = null;

// Preferred high-quality voices on macOS (in order of preference)
const PREFERRED_VOICES = [
  'Samantha', // High quality US English
  'Alex',     // High quality US English
  'Karen',    // Australian English
  'Daniel',   // British English
  'Moira',    // Irish English
  'Tessa',    // South African English
];

function getBestVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  
  const voices = speechSynthesis.getVoices();
  
  // Try preferred voices first
  for (const name of PREFERRED_VOICES) {
    const voice = voices.find(v => v.name.includes(name) && v.lang.startsWith('en'));
    if (voice) {
      cachedVoice = voice;
      return voice;
    }
  }
  
  // Fallback: prefer local/premium voices over remote
  const localEnglish = voices.find(v => v.lang.startsWith('en') && v.localService);
  if (localEnglish) {
    cachedVoice = localEnglish;
    return localEnglish;
  }
  
  // Last resort: any English voice
  const anyEnglish = voices.find(v => v.lang.startsWith('en'));
  if (anyEnglish) {
    cachedVoice = anyEnglish;
    return anyEnglish;
  }
  
  return null;
}

export function speakText(text: string, onEnd?: () => void): void {
  // Cancel any ongoing speech
  stopSpeaking();
  
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return;
  }
  
  currentUtterance = new SpeechSynthesisUtterance(text);
  
  // Use best available voice
  const voice = getBestVoice();
  if (voice) {
    currentUtterance.voice = voice;
  }
  
  // Optimized settings for clarity
  currentUtterance.rate = 0.9;   // Slightly slower for clarity
  currentUtterance.pitch = 1.0;
  currentUtterance.volume = 0.85; // Slight reduction to prevent clipping
  
  if (onEnd) {
    currentUtterance.onend = onEnd;
  }
  
  // Small delay to ensure voice is ready
  setTimeout(() => {
    if (currentUtterance) {
      speechSynthesis.speak(currentUtterance);
    }
  }, 50);
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  if (!('speechSynthesis' in window)) return false;
  return speechSynthesis.speaking;
}

// Initialize voices (needed for some browsers)
export function initVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve([]);
      return;
    }
    
    let voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    
    // Wait for voices to load
    speechSynthesis.onvoiceschanged = () => {
      voices = speechSynthesis.getVoices();
      resolve(voices);
    };
  });
}
