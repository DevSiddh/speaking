'use client';

import { useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import useAppStore from '@/lib/state/store';
import ModuleSwitcher from './ModuleSwitcher';
import SpeakingSessionView from '@/components/speaking/SpeakingSession';
import WritingWorkspace from '@/components/writing/WritingWorkspace';

export default function AppShell() {
  const { activeModule } = useAppStore();

  useEffect(() => {
    document.title = activeModule === 'speaking' ? 'IELTS Co-Pilot — Speaking' : 'IELTS Co-Pilot — Writing';
  }, [activeModule]);

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Top Navigation */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900">IELTS Co-Pilot</span>
        </div>
        <ModuleSwitcher />
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {activeModule === 'speaking' ? <SpeakingSessionView /> : <WritingWorkspace />}
      </main>
    </div>
  );
}
