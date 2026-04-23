// ============================================================
// IELTS Co-Pilot — Core Type Definitions
// ============================================================

export type IELTSModule = 'speaking' | 'writing';

export type IELTSCriteria =
  | 'lexical_resource'
  | 'grammatical_range_accuracy'
  | 'coherence_cohesion'
  | 'task_response_pronunciation';

export type SpeakingPart = 'part1' | 'part2' | 'part3';

export interface BandScore {
  criterion: IELTSCriteria;
  score: number; // 0.0 – 9.0 in 0.5 increments
  commentary: string;
}

export interface Flaw {
  id: string;
  criterion: IELTSCriteria;
  extractedSentence: string;
  explanation: string;
  correctedVersion: string;
  startIndex: number;
  endIndex: number;
}

export interface AssessmentResult {
  overallBand: number;
  bandScores: BandScore[];
  flaws: Flaw[];
  summary: string;
}

export interface SpeakingTurn {
  id: string;
  role: 'user' | 'interlocutor';
  text: string;
  audioUrl?: string;
  timestamp: number;
  durationMs?: number;
}

export interface SpeakingSession {
  id: string;
  part: SpeakingPart;
  turns: SpeakingTurn[];
  transcript: string;
  status: 'idle' | 'recording' | 'processing' | 'responding' | 'evaluating' | 'done';
  assessment?: AssessmentResult;
}

export interface WritingTask {
  id: string;
  type: 'task1' | 'task2';
  prompt: string;
  essayText: string;
  wordCount: number;
  status: 'idle' | 'drafting' | 'evaluating' | 'done';
  assessment?: AssessmentResult;
  timeStarted?: number;
  timeSubmitted?: number;
}

export interface AppState {
  activeModule: IELTSModule;
  speaking: {
    currentPart: SpeakingPart;
    sessions: SpeakingSession[];
    activeSessionId: string | null;
    isMicActive: boolean;
  };
  writing: {
    tasks: WritingTask[];
    activeTaskId: string | null;
  };
  ui: {
    sidebarOpen: boolean;
    showEvaluationPanel: boolean;
    toastMessage: string | null;
  };
}

export interface STTChunk {
  text: string;
  isFinal: boolean;
  confidence?: number;
}

export interface AgentResponse {
  text: string;
  audioBase64?: string;
  meta?: Record<string, unknown>;
}
