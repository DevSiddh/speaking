import { NextRequest, NextResponse } from 'next/server';
import { callWritingAssessor, callSpeakingAssessor } from '@/lib/agents/assessor';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, essayText, taskPrompt, transcript, part } = body;

    if (type === 'writing') {
      if (!essayText || !taskPrompt) {
        return NextResponse.json({ error: 'Missing essay or prompt' }, { status: 400 });
      }
      const result = await callWritingAssessor(essayText, taskPrompt);
      return NextResponse.json(result);
    }

    if (type === 'speaking') {
      if (!transcript || !part) {
        return NextResponse.json({ error: 'Missing transcript or part' }, { status: 400 });
      }
      const result = await callSpeakingAssessor(transcript, part);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid assessment type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}
