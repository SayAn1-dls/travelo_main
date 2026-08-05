// Browser voice engine — speech-to-text (Web Speech API) + text-to-speech (speechSynthesis)

export function voiceInputSupported() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function voiceOutputSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function createRecognizer({ onInterim, onFinal, onEnd, onError }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = navigator.language || 'en-US';
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => {
    let interim = '';
    let final = '';
    for (let i = 0; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) final += r[0].transcript;
      else interim += r[0].transcript;
    }
    if (final && onFinal) onFinal(final.trim());
    else if (onInterim) onInterim(interim);
  };
  rec.onend = () => onEnd && onEnd();
  rec.onerror = (e) => onError && onError(e.error);
  return rec;
}

export function speak(text, { onEnd } = {}) {
  if (!voiceOutputSupported()) return;
  const clean = String(text)
    .replace(/\*\*/g, '')
    .replace(/[\u25b8\u2022#_`*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return;
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = 1.03;
  u.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.lang.startsWith('en') && /Google|Samantha|Daniel|Aria/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith('en'));
  if (preferred) u.voice = preferred;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (voiceOutputSupported()) window.speechSynthesis.cancel();
}
