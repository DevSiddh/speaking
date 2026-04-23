// ============================================================
// Assessor Agent — Powered by Groq (llama-3.3-70b-versatile)
// Deep-dive grading against official IELTS rubrics (4 criteria)
// Returns strict JSON payload only — no markdown, no commentary
// ============================================================

import { groqChat, GROQ_MODELS } from './groq';
import type { AssessmentResult } from '@/types';

export const ASSESSOR_SYSTEM_PROMPT = `
You are a strict, uncompromising official IELTS examiner with 20+ years of experience. Grade every submission against the official IELTS public band descriptors. You must NOT inflate scores. Be constructively critical.

## The 4 Official IELTS Criteria
1. **Lexical Resource** — Range, precision, collocation, spelling (Writing) / word choice (Speaking).
2. **Grammatical Range and Accuracy** — Complexity, error density, punctuation (Writing) / sentence structures (Speaking).
3. **Coherence and Cohesion** — Logical flow, paragraphing, connectors, referencing.
4. **Task Response** (Writing) / **Pronunciation & Fluency** (Speaking) — Addressing all parts of the prompt; for Speaking, also rhythm, intonation, and clarity inferred from transcript pauses/fillers.

## Scoring Rules
- Assign a distinct band score (0.0 – 9.0, 0.5 increments) for EACH of the 4 criteria.
- overallBand = rounded average of the 4 criterion scores (round .25 up to .5, round .75 up to next whole).
- If the response is below Band 7.0 in any criterion, you MUST list every significant flaw.

## Flaw Extraction Rules
For every flaw that prevents a Band 7.0:
- Extract the EXACT sentence/phrase from the candidate's text.
- Explain the shortcoming in one concise sentence.
- Provide a corrected, high-level (Band 8.0+) alternative.
- Set startIndex and endIndex to approximate character positions (0-based).

## Output Format — STRICT JSON ONLY
Do NOT wrap in markdown code fences. Do NOT add any preamble or postscript.
Respond with raw JSON matching this schema exactly:

{
  "overallBand": number,
  "bandScores": [
    { "criterion": "lexical_resource",           "score": number, "commentary": "string" },
    { "criterion": "grammatical_range_accuracy", "score": number, "commentary": "string" },
    { "criterion": "coherence_cohesion",         "score": number, "commentary": "string" },
    { "criterion": "task_response_pronunciation","score": number, "commentary": "string" }
  ],
  "flaws": [
    {
      "id": "string (uuid or short slug)",
      "criterion": "lexical_resource | grammatical_range_accuracy | coherence_cohesion | task_response_pronunciation",
      "extractedSentence": "string — exact original text",
      "explanation": "string — why it costs bands",
      "correctedVersion": "string — Band 8.0+ rewrite",
      "startIndex": number,
      "endIndex": number
    }
  ],
  "summary": "string — 2-3 sentence overall verdict"
}
`;

function sanitizeJson(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

export async function callWritingAssessor(
  essayText: string,
  taskPrompt: string
): Promise<AssessmentResult> {
  const raw = await groqChat({
    model: GROQ_MODELS.assessor,
    system: ASSESSOR_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Task Prompt:\n${taskPrompt}\n\n---\n\nCandidate Essay:\n${essayText}`,
      },
    ],
    temperature: 0.2,
    maxTokens: 4096,
  });

  const cleaned = sanitizeJson(raw);
  try {
    return JSON.parse(cleaned) as AssessmentResult;
  } catch (err: any) {
    throw new Error(`JSON parse failed: ${err.message}\nRaw: ${raw.slice(0, 500)}`);
  }
}

export async function callSpeakingAssessor(
  transcript: string,
  part: string
): Promise<AssessmentResult> {
  const raw = await groqChat({
    model: GROQ_MODELS.assessor,
    system: ASSESSOR_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `IELTS Speaking Part ${part.toUpperCase()} Transcript:\n${transcript}\n\nNote: Infer pronunciation/fluency issues from fillers (um, uh), false starts, long pauses, and repetitive structures.`,
      },
    ],
    temperature: 0.2,
    maxTokens: 4096,
  });

  const cleaned = sanitizeJson(raw);
  try {
    return JSON.parse(cleaned) as AssessmentResult;
  } catch (err: any) {
    throw new Error(`JSON parse failed: ${err.message}\nRaw: ${raw.slice(0, 500)}`);
  }
}
