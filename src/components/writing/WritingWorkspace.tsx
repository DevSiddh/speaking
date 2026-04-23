'use client';

import { useCallback, useEffect, useState } from 'react';
import { Send, Clock, Type } from 'lucide-react';
import useAppStore from '@/lib/state/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { wordCount, bandColor, criterionLabel } from '@/lib/utils';
import { AssessmentCard } from '@/components/shared/EvaluationPanel';

const TASK2_PROMPT = `
Some people think that the best way to reduce crime is to give longer prison sentences.
To what extent do you agree or disagree?
`;

export default function WritingWorkspace() {
  const {
    writing,
    createWritingTask,
    updateEssayText,
    submitWritingTask,
    setWritingAssessment,
    activeModule,
  } = useAppStore();

  const [elapsed, setElapsed] = useState(0);

  const activeTask = writing.tasks.find((t) => t.id === writing.activeTaskId);

  useEffect(() => {
    if (!activeTask && activeModule === 'writing') {
      createWritingTask('task2', TASK2_PROMPT);
    }
  }, [activeModule, activeTask, createWritingTask]);

  useEffect(() => {
    if (!activeTask?.timeStarted) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - activeTask.timeStarted!) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTask?.timeStarted]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSubmit = useCallback(async () => {
    if (!activeTask) return;
    submitWritingTask(activeTask.id);

    try {
      const res = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'writing',
          essayText: activeTask.essayText,
          taskPrompt: activeTask.prompt,
        }),
      });

      const assessment = await res.json();
      setWritingAssessment(activeTask.id, assessment);
    } catch (err) {
      console.error(err);
    }
  }, [activeTask, submitWritingTask, setWritingAssessment]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:flex-row lg:p-8">
      {/* Left: Editor */}
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Writing Task 2</h1>
            <p className="text-sm text-slate-500">40 minutes recommended</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(elapsed)}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Type className="h-3 w-3" />
              {activeTask?.wordCount ?? 0}
            </Badge>
            <Button size="sm" onClick={handleSubmit} disabled={activeTask?.status === 'evaluating'}>
              <Send className="mr-2 h-4 w-4" />
              {activeTask?.status === 'evaluating' ? 'Grading…' : 'Submit'}
            </Button>
          </div>
        </div>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-700">Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-slate-600">{activeTask?.prompt}</p>
          </CardContent>
        </Card>

        <textarea
          value={activeTask?.essayText ?? ''}
          onChange={(e) => activeTask && updateEssayText(activeTask.id, e.target.value)}
          placeholder="Start typing your essay here..."
          className="min-h-[300px] flex-1 resize-none rounded-xl border border-slate-200 bg-white p-4 text-base leading-relaxed text-slate-900 shadow-sm outline-none ring-slate-200 transition-all focus:ring-2"
          spellCheck={false}
        />
      </div>

      {/* Right: Evaluation Panel */}
      <aside className="w-full border-l border-slate-200 bg-slate-50 p-4 lg:w-96">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Evaluation
        </h2>
        {activeTask?.assessment ? (
          <AssessmentCard assessment={activeTask.assessment} />
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-slate-400">
              Submit your essay to receive structured IELTS feedback.
            </CardContent>
          </Card>
        )}
      </aside>
    </div>
  );
}
