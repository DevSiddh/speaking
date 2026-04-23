// ============================================================
// STT Layer — Whisper / Web Speech API
// CRITICAL: Capture raw speech (filler words, stutters, errors)
// ============================================================

import { generateId } from '@/lib/utils';

export type STTCallback = (text: string, isFinal: boolean) => void;

export class STTEngine {
  private recognizer: SpeechRecognition | null = null;
  private stream: MediaStream | null = null;
  private onResult: STTCallback;
  private onError?: (e: Error) => void;
  private onStart?: () => void;
  private onEnd?: () => void;
  private isRunning = false;

  constructor(options: {
    onResult: STTCallback;
    onError?: (e: Error) => void;
    onStart?: () => void;
    onEnd?: () => void;
  }) {
    this.onResult = options.onResult;
    this.onError = options.onError;
    this.onStart = options.onStart;
    this.onEnd = options.onEnd;
  }

  async start() {
    if (this.isRunning) return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Web Speech API not supported in this browser.');
    }

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recog = new SpeechRecognition();
    this.recognizer = recog;
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = 'en-GB';

    recog.onstart = () => {
      this.isRunning = true;
      this.onStart?.();
    };

    recog.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      if (final) this.onResult(final.trim(), true);
      if (interim) this.onResult(interim.trim(), false);
    };

    recog.onerror = (event: any) => {
      this.onError?.(new Error(event.error));
    };

    recog.onend = () => {
      this.isRunning = false;
      this.onEnd?.();
      // Auto-restart unless explicitly stopped
      if (this.recognizer && !this.isRunning) {
        try {
          this.recognizer.start();
        } catch {
          /* ignore restart race */
        }
      }
    };

    recog.start();
  }

  stop() {
    this.isRunning = false;
    this.recognizer?.stop();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.recognizer = null;
    this.stream = null;
  }
}

// Whisper fallback for higher-fidelity raw transcription
export async function transcribeWithWhisper(
  audioBlob: Blob,
  apiKey?: string
): Promise<string> {
  const form = new FormData();
  form.append('file', audioBlob, 'recording.webm');
  form.append('model', 'whisper-1');
  form.append('language', 'en');
  form.append('prompt', 'Transcribe exactly as spoken. Include filler words like um, uh, repetitions, false starts, and grammatical errors. Do not correct the speaker.');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey ?? process.env.OPENAI_API_KEY ?? ''}`,
    },
    body: form,
  });

  if (!res.ok) throw new Error(`Whisper error: ${res.status}`);
  const json = await res.json();
  return json.text ?? '';
}
