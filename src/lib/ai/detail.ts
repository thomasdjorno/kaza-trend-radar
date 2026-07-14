import { getAnthropicClient, CLAUDE_MODEL, extractJson } from "./client";
import { KAZA_BRAND_DNA } from "./brandDna";
import type { ScoredTrend, TrendDetail } from "@/types/trend";

const SYSTEM_PROMPT = `Tu es le/la responsable veille & contenu de Maison KAZA. On te demande une analyse approfondie d'UNE tendance précise pour décider comment (ou si) KAZA doit la surfer.

${KAZA_BRAND_DNA}

FORMAT DE SORTIE — STRICT :
- Réponds UNIQUEMENT avec un objet JSON valide, aucun texte avant ou après, aucun backtick markdown.
- Schéma exact :
{
  "decryptage": "origine du buzz, qui en parle, pourquoi maintenant — 3-5 phrases",
  "angles": [
    { "niveau": "sur", "angle": "...", "hook": "accroche prête à copier" },
    { "niveau": "modere", "angle": "...", "hook": "..." },
    { "niveau": "audacieux", "angle": "...", "hook": "..." }
  ],
  "produits_kaza": ["1 à 3 noms parmi les 6 mélanges signature"],
  "pieges": ["2-4 pièges concrets à éviter pour ne pas paraître cheap ou opportuniste"]
}
- Les 3 angles vont du plus sûr au plus audacieux.`;

export async function generateTrendDetail(
  trend: ScoredTrend
): Promise<Omit<TrendDetail, "id" | "generatedAt">> {
  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Tendance à analyser :\nTitre : ${trend.titre}\nSource : ${trend.source}\nRésumé rapide : ${trend.resume}\nAngle déjà pressenti : ${trend.angle_kaza}\nFenêtre : ${trend.fenetre}\nVolume : ${trend.volume}\nRisque estimé : ${trend.risque}\n\nProduis l'analyse approfondie au format JSON demandé.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Réponse Claude vide ou invalide");
  }

  return extractJson<Omit<TrendDetail, "id" | "generatedAt">>(textBlock.text);
}
