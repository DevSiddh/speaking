'use client';

import { X, AlertCircle, BookOpen, Link2, CheckCircle } from 'lucide-react';
import useAppStore from '@/lib/state/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { bandColor, criterionLabel } from '@/lib/utils';
import type { Flaw, IELTSCriteria } from '@/types';

const criterionIcons: Record<IELTSCriteria, React.ReactNode> = {
  lexical_resource: <BookOpen className="h-4 w-4" />,
  grammatical_range_accuracy: <AlertCircle className="h-4 w-4" />,
  coherence_cohesion: <Link2 className="h-4 w-4" />,
  task_response_pronunciation: <CheckCircle className="h-4 w-4" />,
};

export default function EvaluationPanel() {
  const { ui, toggleEvaluationPanel } = useAppStore();
  if (!ui.showEvaluationPanel) return null;

  // For now we render a placeholder; in practice this receives active session/task assessment
  return (
    <aside className="w-full border-l border-slate-200 bg-slate-50 p-4 lg:w-96">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Evaluation
        </h2>
        <button onClick={toggleEvaluationPanel} className="rounded p-1 hover:bg-slate-200">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="space-y-4">
        <EmptyState />
      </div>
    </aside>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-8 text-center text-sm text-slate-400">
        Submit your response to receive structured IELTS feedback.
      </CardContent>
    </Card>
  );
}

export function AssessmentCard({ assessment }: { assessment: NonNullable<ReturnType<typeof useAppStore.getState>['speaking']['sessions'][0]['assessment']> }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-slate-900">{assessment.overallBand.toFixed(1)}</span>
        <Badge variant="outline">Overall Band</Badge>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {assessment.bandScores.map((b) => (
          <div
            key={b.criterion}
            className={`flex items-center justify-between rounded-lg px-3 py-2 ${bandColor(b.score)}`}
          >
            <div className="flex items-center gap-2">
              {criterionIcons[b.criterion]}
              <span className="text-sm font-medium">{criterionLabel(b.criterion)}</span>
            </div>
            <span className="text-sm font-bold">{b.score.toFixed(1)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase text-slate-500">Detailed Flaws</h4>
        {assessment.flaws.map((flaw) => (
          <FlawCard key={flaw.id} flaw={flaw} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Examiner Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">{assessment.summary}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function FlawCard({ flaw }: { flaw: Flaw }) {
  const colors: Record<string, string> = {
    lexical_resource: 'border-l-4 border-l-emerald-400 bg-emerald-50',
    grammatical_range_accuracy: 'border-l-4 border-l-red-400 bg-red-50',
    coherence_cohesion: 'border-l-4 border-l-amber-400 bg-amber-50',
    task_response_pronunciation: 'border-l-4 border-l-blue-400 bg-blue-50',
  };

  return (
    <div className={`rounded-r-lg p-3 ${colors[flaw.criterion] ?? 'bg-slate-50'}`}>
      <div className="mb-1 flex items-center gap-2">
        <Badge variant="outline" className="text-[10px]">
          {criterionLabel(flaw.criterion)}
        </Badge>
      </div>
      <p className="mb-1 text-sm text-slate-700 line-through">{flaw.extractedSentence}</p>
      <p className="mb-2 text-xs text-slate-500">{flaw.explanation}</p>
      <p className="text-sm font-medium text-slate-900">{flaw.correctedVersion}</p>
    </div>
  );
}
