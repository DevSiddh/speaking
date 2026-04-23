import { NextRequest, NextResponse } from 'next/server';
import { callInterlocutor } from '@/lib/agents/interlocutor';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { part, transcriptSoFar, lastUserUtterance } = body;

    if (!part || !lastUserUtterance) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await callInterlocutor({
      part,
      transcriptSoFar: transcriptSoFar ?? '',
      lastUserUtterance,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}
