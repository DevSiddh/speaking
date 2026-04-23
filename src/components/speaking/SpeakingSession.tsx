'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, RotateCcw, Send, ShieldAlert, Loader2 } from 'lucide-react';
import useAppStore from '@/lib/state/store';
import { STTEngine } from '@/lib/stt/engine';
import { TTSEngine } from '@/lib/tts/engine';
import { generateId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import WaveformVisualizer from './WaveformVisualizer';

type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

export default function SpeakingSessionView() {
  const {
    speaking,
    startSpeakingSession,
    addSpeakingTurn,
    updateSpeakingStatus,
    setMicActive,
    setSpeakingAssessment,
    activeModule,
  } = useAppStore();

  const [interimText, setInterimText] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permission, setPermission] = useState<PermissionState>('idle');
  const [recorderState, setRecorderState] = useState<'inactive' | 'recording' | 'paused'>('inactive');

  const sttRef = useRef<STTEngine | null>(null);
  const ttsRef = useRef<TTSEngine | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const activeSession = speaking.sessions.find((s) => s.id === speaking.activeSessionId);

  // Auto-init session when switching to speaking module
  useEffect(() => {
    if (!speaking.activeSessionId && activeModule === 'speaking') {
      startSpeakingSession(speaking.currentPart);
    }
  }, [activeModule, speaking.activeSessionId, speaking.currentPart, startSpeakingSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      sttRef.current?.stop();
      ttsRef.current?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const handleRequestPermission = useCallback(async () => {
    setPermission('requesting');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
        },
      });
      setStream(mediaStream);
      setPermission('granted');
      return mediaStream;
    } catch (err: any) {
      console.error('Mic permission error:', err);
      setPermission(err.name === 'NotAllowedError' ? 'denied' : 'error');
      return null;
    }
  }, []);

  const handleStartRecording = useCallback(async () => {
    if (!activeSession) return;

    let mediaStream = stream;
    if (!mediaStream || permission !== 'granted') {
      mediaStream = await handleRequestPermission();
      if (!mediaStream) return;
    }

    // Reset chunk buffer
    audioChunksRef.current = [];

    // Initialize MediaRecorder for raw audio capture
    const mimeType = MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

    const recorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstart = () => {
      setRecorderState('recording');
      setMicActive(true);
      updateSpeakingStatus(activeSession.id, 'recording');
    };

    recorder.onstop = async () => {
      setRecorderState('inactive');
      setMicActive(false);
      await processTurn(activeSession.id);
    };

    recorder.onerror = (e) => {
      console.error('MediaRecorder error:', e);
      setRecorderState('inactive');
      setMicActive(false);
    };

    // Start capturing chunks every 100ms for finer granularity
    recorder.start(100);

    // Also start Web Speech API for real-time transcription
    sttRef.current = new STTEngine({
      onResult: (text, isFinal) => {
        if (isFinal) {
          setInterimText('');
          addSpeakingTurn(activeSession.id, {
            id: generateId(),
            role: 'user',
            text,
            timestamp: Date.now(),
          });
        } else {
          setInterimText(text);
        }
      },
      onError: (err) => {
        console.error('STT error:', err);
        setMicActive(false);
      },
      onStart: () => setMicActive(true),
      onEnd: () => setMicActive(false),
    });

    await sttRef.current.start();
  }, [activeSession, stream, permission, handleRequestPermission, addSpeakingTurn, updateSpeakingStatus, setMicActive]);

  const handleStopRecording = useCallback(() => {
    sttRef.current?.stop();
    mediaRecorderRef.current?.stop();
    // onstop handler above triggers processTurn
  }, []);

  const processTurn = useCallback(
    async (sessionId: string) => {
      updateSpeakingStatus(sessionId, 'processing');

      // Build audio blob from captured chunks for potential Whisper fallback
      const mimeType = mediaRecorderRef.current?.mimeType ?? 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      console.log(`Captured audio: ${audioBlob.size} bytes, type: ${mimeType}`);

      const session = useAppStore.getState().speaking.sessions.find((s) => s.id === sessionId);
      const lastUserTurn = [...(session?.turns ?? [])].reverse().find((t) => t.role === 'user');
      if (!lastUserTurn) {
        updateSpeakingStatus(sessionId, 'idle');
        return;
      }

      try {
        const res = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            part: session?.part ?? 'part1',
            transcriptSoFar: session?.transcript ?? '',
            lastUserUtterance: lastUserTurn.text,
          }),
        });

        const data = await res.json();
        const interlocutorText = data.text ?? 'Could you elaborate on that?';

        addSpeakingTurn(sessionId, {
          id: generateId(),
          role: 'interlocutor',
          text: interlocutorText,
          timestamp: Date.now(),
        });

        if (!ttsRef.current) ttsRef.current = new TTSEngine();
        ttsRef.current.speak(interlocutorText);

        updateSpeakingStatus(sessionId, 'idle');
      } catch (err) {
        console.error('Interlocutor error:', err);
        updateSpeakingStatus(sessionId, 'idle');
      }
    },
    [addSpeakingTurn, updateSpeakingStatus]
  );

  const handleEvaluate = useCallback(async () => {
    if (!activeSession) return;
    updateSpeakingStatus(activeSession.id, 'evaluating');

    try {
      const res = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'speaking',
          transcript: activeSession.transcript,
          part: activeSession.part,
        }),
      });

      const assessment = await res.json();
      setSpeakingAssessment(activeSession.id, assessment);
    } catch (err) {
      console.error('Evaluate error:', err);
      updateSpeakingStatus(activeSession.id, 'idle');
    }
  }, [activeSession, setSpeakingAssessment, updateSpeakingStatus]);

  const handleReset = useCallback(() => {
    sttRef.current?.stop();
    ttsRef.current?.stop();
    mediaRecorderRef.current?.stop();
    setStream(null);
    setMicActive(false);
    setPermission('idle');
    setRecorderState('inactive');
    startSpeakingSession(speaking.currentPart);
  }, [startSpeakingSession, speaking.currentPart, setMicActive]);

  // ------------------------------------------------------------------
  // Render helpers
  // ------------------------------------------------------------------

  const isRecording = recorderState === 'recording' || speaking.isMicActive;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Speaking Test</h1>
          <p className="text-sm text-slate-500">
            Part {activeSession?.part.replace('part', '') ?? '1'} &middot;{' '}
            {isRecording ? (
              <span className="font-medium text-red-500">Recording…</span>
            ) : (
              <span className="text-slate-400">Tap mic to start</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEvaluate}
            disabled={activeSession?.status === 'evaluating'}
          >
            {activeSession?.status === 'evaluating' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Evaluate
          </Button>
        </div>
      </div>

      {/* Permission Gate */}
      {permission === 'denied' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <ShieldAlert className="mx-auto mb-2 h-6 w-6 text-red-500" />
          <p className="text-sm font-medium text-red-700">Microphone access denied</p>
          <p className="mt-1 text-xs text-red-600">
            Please allow microphone access in your browser settings to use the Speaking test.
          </p>
          <Button
            variant="destructive"
            size="sm"
            className="mt-3"
            onClick={() => handleRequestPermission()}
          >
            Retry Permission
          </Button>
        </div>
      )}

      {permission === 'error' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <ShieldAlert className="mx-auto mb-2 h-6 w-6 text-amber-500" />
          <p className="text-sm font-medium text-amber-700">Microphone unavailable</p>
          <p className="mt-1 text-xs text-amber-600">
            Could not access your microphone. Check that no other app is using it.
          </p>
        </div>
      )}

      {/* Transcript Area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {activeSession?.turns.length === 0 && !interimText && (
          <div className="flex h-full flex-col items-center justify-center text-slate-400">
            <Mic className="mb-2 h-8 w-8 opacity-30" />
            <p className="text-sm">Your conversation will appear here.</p>
          </div>
        )}

        {activeSession?.turns.map((turn) => (
          <div
            key={turn.id}
            className={`mb-3 max-w-[80%] rounded-lg px-4 py-2 text-sm ${
              turn.role === 'user'
                ? 'ml-auto bg-slate-900 text-slate-50'
                : 'mr-auto bg-slate-100 text-slate-900'
            }`}
          >
            <span className="mb-1 block text-[10px] opacity-60 uppercase">
              {turn.role === 'user' ? 'You' : 'Examiner'}
            </span>
            {turn.text}
          </div>
        ))}

        {interimText && (
          <div className="mb-3 ml-auto max-w-[80%] rounded-lg bg-slate-200 px-4 py-2 text-sm text-slate-500">
            <span className="mb-1 block text-[10px] opacity-60 uppercase">You</span>
            {interimText}
          </div>
        )}
      </div>

      {/* Waveform + Controls */}
      <div className="space-y-3">
        <WaveformVisualizer isActive={isRecording} stream={stream} />

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={permission === 'denied' || permission === 'error'}
            className={`flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all disabled:opacity-40 ${
              isRecording
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>
          <span className="text-xs text-slate-400">
            {isRecording ? 'Tap to stop' : permission === 'granted' ? 'Tap to speak' : 'Tap to enable mic'}
          </span>
        </div>
      </div>
    </div>
  );
}
