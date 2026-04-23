// ============================================================
// Groq LLM Client — Unified wrapper for all agents
// Uses OpenAI-compatible API (fast + free tier)
// ============================================================

const GROQ_BASE = 'https://api.groq.com/openai/v1';
const GROQ_KEY = process.env.GROQ_API_KEY ?? '';

export async function groqChat({
  model,
  system,
  messages,
  temperature = 0.3,
  maxTokens = 4096,
  jsonMode = false,
}: {
  model: string;
  system?: string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages: system ? [{ role: 'system', content: system }, ...messages] : messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? '';
}

// Models available on Groq free tier (as of 2025)
export const GROQ_MODELS = {
  assessor: 'llama-3.3-70b-versatile',   // Deep reasoning, JSON
  interlocutor: 'llama-3.1-8b-instant',  // Low-latency chat
  fast: 'llama-3.1-8b-instant',
} as const;
