// ============================================================
// TTS Layer — Browser SpeechSynthesis + OpenAI TTS fallback
// ============================================================

export class TTSEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
    }
  }

  speak(text: string, onEnd?: () => void) {
    if (!this.synth) return;
    this.stop();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB';
    u.rate = 1.0;
    u.pitch = 1.0;
    u.onend = () => onEnd?.();
    this.currentUtterance = u;
    this.synth.speak(u);
  }

  stop() {
    if (!this.synth) return;
    this.synth.cancel();
    this.currentUtterance = null;
  }
}

// OpenAI TTS fallback for higher quality voice
export async function synthesizeWithOpenAI(
  text: string,
  apiKey?: string
): Promise<ArrayBuffer> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey ?? process.env.OPENAI_API_KEY ?? ''}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
      response_format: 'mp3',
    }),
  });

  if (!res.ok) throw new Error(`TTS error: ${res.status}`);
  return res.arrayBuffer();
}
