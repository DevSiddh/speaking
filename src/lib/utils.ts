import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function clampBand(score: number): number {
  return Math.max(0, Math.min(9, Math.round(score * 2) / 2));
}

export function bandColor(score: number): string {
  if (score >= 7.5) return "text-emerald-600 bg-emerald-50";
  if (score >= 6.5) return "text-amber-600 bg-amber-50";
  if (score >= 5.5) return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
}

export function criterionLabel(c: string): string {
  const map: Record<string, string> = {
    lexical_resource: "Lexical Resource",
    grammatical_range_accuracy: "Grammatical Range & Accuracy",
    coherence_cohesion: "Coherence & Cohesion",
    task_response_pronunciation: "Task Response / Pronunciation",
  };
  return map[c] || c;
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
