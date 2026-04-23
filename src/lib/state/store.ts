// ============================================================
// IELTS Co-Pilot — Zustand State Manager (SharedState)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppState,
  SpeakingSession,
  SpeakingTurn,
  SpeakingPart,
  WritingTask,
  IELTSModule,
  AssessmentResult,
} from '@/types';
import { generateId } from '@/lib/utils';

interface AppActions {
  setModule: (m: IELTSModule) => void;

  // Speaking
  startSpeakingSession: (part: SpeakingPart) => string;
  addSpeakingTurn: (sessionId: string, turn: SpeakingTurn) => void;
  updateSpeakingStatus: (
    sessionId: string,
    status: SpeakingSession['status']
  ) => void;
  setSpeakingAssessment: (
    sessionId: string,
    assessment: AssessmentResult
  ) => void;
  setMicActive: (active: boolean) => void;
  setSpeakingPart: (part: SpeakingPart) => void;

  // Writing
  createWritingTask: (type: 'task1' | 'task2', prompt: string) => string;
  updateEssayText: (taskId: string, text: string) => void;
  submitWritingTask: (taskId: string) => void;
  setWritingAssessment: (
    taskId: string,
    assessment: AssessmentResult
  ) => void;

  // UI
  toggleSidebar: () => void;
  toggleEvaluationPanel: () => void;
  setToast: (msg: string | null) => void;
}

const initialSpeakingSession = (): SpeakingSession => ({
  id: generateId(),
  part: 'part1',
  turns: [],
  transcript: '',
  status: 'idle',
});

const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      // ------------------------------------------------------
      // Initial state
      // ------------------------------------------------------
      activeModule: 'speaking',
      speaking: {
        currentPart: 'part1',
        sessions: [],
        activeSessionId: null,
        isMicActive: false,
      },
      writing: {
        tasks: [],
        activeTaskId: null,
      },
      ui: {
        sidebarOpen: false,
        showEvaluationPanel: true,
        toastMessage: null,
      },

      // ------------------------------------------------------
      // Actions
      // ------------------------------------------------------
      setModule: (m) => set({ activeModule: m }),

      startSpeakingSession: (part) => {
        const session: SpeakingSession = {
          ...initialSpeakingSession(),
          part,
          status: 'idle',
        };
        set((state) => ({
          speaking: {
            ...state.speaking,
            sessions: [session, ...state.speaking.sessions],
            activeSessionId: session.id,
          },
        }));
        return session.id;
      },

      addSpeakingTurn: (sessionId, turn) => {
        set((state) => {
          const sessions = state.speaking.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  turns: [...s.turns, turn],
                  transcript:
                    turn.role === 'user'
                      ? `${s.transcript} ${turn.text}`.trim()
                      : s.transcript,
                }
              : s
          );
          return { speaking: { ...state.speaking, sessions } };
        });
      },

      updateSpeakingStatus: (sessionId, status) => {
        set((state) => ({
          speaking: {
            ...state.speaking,
            sessions: state.speaking.sessions.map((s) =>
              s.id === sessionId ? { ...s, status } : s
            ),
          },
        }));
      },

      setSpeakingAssessment: (sessionId, assessment) => {
        set((state) => ({
          speaking: {
            ...state.speaking,
            sessions: state.speaking.sessions.map((s) =>
              s.id === sessionId ? { ...s, assessment, status: 'done' } : s
            ),
          },
        }));
      },

      setMicActive: (active) =>
        set((state) => ({
          speaking: { ...state.speaking, isMicActive: active },
        })),

      setSpeakingPart: (part) =>
        set((state) => ({
          speaking: { ...state.speaking, currentPart: part },
        })),

      createWritingTask: (type, prompt) => {
        const task: WritingTask = {
          id: generateId(),
          type,
          prompt,
          essayText: '',
          wordCount: 0,
          status: 'idle',
          timeStarted: Date.now(),
        };
        set((state) => ({
          writing: {
            tasks: [task, ...state.writing.tasks],
            activeTaskId: task.id,
          },
        }));
        return task.id;
      },

      updateEssayText: (taskId, text) => {
        set((state) => ({
          writing: {
            ...state.writing,
            tasks: state.writing.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    essayText: text,
                    wordCount: text.trim().split(/\s+/).filter(Boolean).length,
                    status: 'drafting',
                  }
                : t
            ),
          },
        }));
      },

      submitWritingTask: (taskId) => {
        set((state) => ({
          writing: {
            ...state.writing,
            tasks: state.writing.tasks.map((t) =>
              t.id === taskId
                ? { ...t, status: 'evaluating', timeSubmitted: Date.now() }
                : t
            ),
          },
        }));
      },

      setWritingAssessment: (taskId, assessment) => {
        set((state) => ({
          writing: {
            ...state.writing,
            tasks: state.writing.tasks.map((t) =>
              t.id === taskId ? { ...t, assessment, status: 'done' } : t
            ),
          },
        }));
      },

      toggleSidebar: () =>
        set((state) => ({
          ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
        })),

      toggleEvaluationPanel: () =>
        set((state) => ({
          ui: { ...state.ui, showEvaluationPanel: !state.ui.showEvaluationPanel },
        })),

      setToast: (msg) => set((state) => ({ ui: { ...state.ui, toastMessage: msg } })),
    }),
    {
      name: 'ielts-copilot-store',
      partialize: (state) => ({
        speaking: {
          sessions: state.speaking.sessions,
          currentPart: state.speaking.currentPart,
        },
        writing: {
          tasks: state.writing.tasks,
        },
        activeModule: state.activeModule,
      }),
    }
  )
);

export default useAppStore;
