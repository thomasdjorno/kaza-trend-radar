import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY manquante dans l'environnement");
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export const CLAUDE_MODEL = "claude-sonnet-4-6";

/**
 * Claude peut entourer sa réponse de ```json ... ``` malgré la consigne.
 * Nettoyage défensif avant JSON.parse.
 */
export function extractJson<T>(text: string): T {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/```\s*$/i, "");
  const firstBrace = Math.min(
    ...[cleaned.indexOf("{"), cleaned.indexOf("[")].filter((i) => i >= 0)
  );
  if (Number.isFinite(firstBrace) && firstBrace > 0) {
    cleaned = cleaned.slice(firstBrace);
  }
  return JSON.parse(cleaned) as T;
}
