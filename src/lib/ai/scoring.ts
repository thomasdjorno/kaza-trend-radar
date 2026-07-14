import { getAnthropicClient, CLAUDE_MODEL, extractJson } from "./client";
import { KAZA_BRAND_DNA } from "./brandDna";
import type { RawSignal, ScoredTrend } from "@/types/trend";

const SYSTEM_PROMPT = `Tu es le/la responsable veille & contenu de Maison KAZA. Tu analyses des signaux bruts de tendances françaises (Google Trends, Reddit, YouTube, TikTok) et tu les scores selon leur compatibilité avec l'ADN de la marque.

${KAZA_BRAND_DNA}

CONSIGNE DE SCORING — SOIS SÉVÈRE :
- La majorité des tendances doivent finir en "a_surveiller" ou "ignorer".
- La catégorie "surfer_maintenant" est réservée aux 0 à 3 tendances qui cochent VRAIMENT les 4 critères de rétention. S'il n'y en a aucune, n'en force aucune.
- score_kaza reflète la compatibilité réelle avec la marque, pas juste le volume/buzz de la tendance.
- risque "eleve" si la tendance est délicate (politique, drame, santé, deuil, polémique) ou si un angle KAZA pourrait paraître opportuniste/cheap.

FORMAT DE SORTIE — STRICT :
- Réponds UNIQUEMENT avec un tableau JSON valide, aucun texte avant ou après, aucun backtick markdown.
- Chaque élément du tableau respecte exactement ce schéma :
{
  "id": "slug-court-unique",
  "titre": "...",
  "source": "...",
  "score_kaza": 0-100,
  "categorie": "surfer_maintenant" | "a_surveiller" | "ignorer",
  "resume": "pourquoi ça buzz, en 1-2 phrases",
  "fenetre": "ex: 24-48h",
  "angle_kaza": "angle de contenu concret en 1 phrase",
  "risque": "faible" | "moyen" | "eleve",
  "volume": "..."
}
- Analyse entre 25 et 50 tendances parmi les signaux fournis (fusionne les doublons entre sources si pertinent).`;

function buildUserPrompt(signals: RawSignal[]): string {
  const lines = signals
    .slice(0, 200)
    .map((s, i) => {
      const parts = [`${i + 1}. [${s.source}] ${s.titre}`];
      if (s.metrique) parts.push(`(${s.metrique})`);
      if (s.extrait) parts.push(`— ${s.extrait}`);
      return parts.join(" ");
    })
    .join("\n");

  return `Voici les signaux bruts collectés aujourd'hui en France. Analyse-les et retourne le tableau JSON des tendances scorées selon les consignes du system prompt.\n\n${lines}`;
}

export async function scoreTrends(signals: RawSignal[]): Promise<ScoredTrend[]> {
  if (signals.length === 0) return [];

  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(signals) }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Réponse Claude vide ou invalide");
  }

  const parsed = extractJson<ScoredTrend[]>(textBlock.text);
  if (!Array.isArray(parsed)) {
    throw new Error("Le JSON retourné par Claude n'est pas un tableau");
  }
  return parsed;
}
