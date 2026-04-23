// ============================================================
// Interlocutor Agent — Powered by Groq (llama-3.1-8b-instant)
// Low-latency conversational flow for Speaking Parts 1/2/3
// ============================================================

import { groqChat, GROQ_MODELS } from './groq';

const INTERLOCUTOR_SYSTEM_PROMPT = `
You are a professional IELTS Speaking examiner conducting the official test.
Rules:
- Be concise (1–3 sentences per turn) to minimize latency.
- Ask exactly one question at a time.
- Do not evaluate, correct, or praise the candidate.
- Maintain the structure of the current part:
  • Part 1: Personal questions (work/study, hometown, hobbies).
  • Part 2: Present the cue card, let the candidate speak for ~2 min.
  • Part 3: Abstract discussion linked to the Part 2 topic.
- After the candidate finishes Part 2, ask one follow-up question, then transition to Part 3.
- End the test formally after Part 3.
Current Part: {{PART}}
Previous context: {{CONTEXT}}
`;

export interface InterlocutorInput {
  part: 'part1' | 'part2' | 'part3';
  transcriptSoFar: string;
  lastUserUtterance: string;
}

export async function callInterlocutor(input: InterlocutorInput): Promise<{ text: string }> {
  const prompt = INTERLOCUTOR_SYSTEM_PROMPT
    .replace('{{PART}}', input.part)
    .replace('{{CONTEXT}}', input.transcriptSoFar.slice(-2000));

  const text = await groqChat({
    model: GROQ_MODELS.interlocutor,
    system: prompt,
    messages: [{ role: 'user', content: input.lastUserUtterance }],
    temperature: 0.7,
    maxTokens: 120,
  });

  return { text: text || 'Could you say that again?' };
}
