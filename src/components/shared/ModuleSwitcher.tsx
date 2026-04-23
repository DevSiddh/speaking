'use client';

import { Mic, PenLine } from 'lucide-react';
import useAppStore from '@/lib/state/store';
import { cn } from '@/lib/utils';

export default function ModuleSwitcher() {
  const { activeModule, setModule } = useAppStore();

  return (
    <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
      <button
        onClick={() => setModule('speaking')}
        className={cn(
          'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
          activeModule === 'speaking'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        )}
      >
        <Mic className="h-4 w-4" />
        Speaking
      </button>
      <button
        onClick={() => setModule('writing')}
        className={cn(
          'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
          activeModule === 'writing'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        )}
      >
        <PenLine className="h-4 w-4" />
        Writing
      </button>
    </div>
  );
}
