import { getAnthropicClient, CLAUDE_MODEL, extractJson } from "./client";
import { KAZA_BRAND_DNA } from "./brandDna";
import type { ScoredTrend, VideoPrompts } from "@/types/trend";

const SYSTEM_PROMPT = `Tu es le/la responsable contenu de Maison KAZA. On te demande de produire des livrables de production prêts à l'emploi pour surfer une tendance précise.

${KAZA_BRAND_DNA}

FORMAT DE SORTIE — STRICT :
- Réponds UNIQUEMENT avec un objet JSON valide, aucun texte avant ou après, aucun backtick markdown.
- Schéma exact :
{
  "sora_prompt": "prompt EN ANGLAIS, détaillé, pour génération vidéo IA (type Sora) : décrit la scène, la lumière, le mouvement de caméra, l'ambiance lifestyle premium, et la présence d'un pot KAZA design coloré (jamais de kraft). Durée cible 8-12 secondes.",
  "reel_script": {
    "hook": "les 3 premières secondes, en français",
    "plans": ["plan 1 : ...", "plan 2 : ...", "plan 3 : ..."],
    "texte_ecran": ["texte à l'écran plan par plan"],
    "audio_suggestion": "suggestion d'audio/son tendance"
  },
  "caption": {
    "texte": "caption Instagram dans le ton KAZA : espiègle, mordant, jamais 'instagram motivation'",
    "hashtags": ["#...", "#..."]
  }
}`;

export async function generateVideoPrompts(
  trend: ScoredTrend
): Promise<Omit<VideoPrompts, "id" | "generatedAt">> {
  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Tendance : ${trend.titre}\nAngle KAZA retenu : ${trend.angle_kaza}\nRésumé : ${trend.resume}\nFenêtre : ${trend.fenetre}\n\nProduis les livrables de production au format JSON demandé.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Réponse Claude vide ou invalide");
  }

  return extractJson<Omit<VideoPrompts, "id" | "generatedAt">>(textBlock.text);
}
