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

NE TE LIMITE PAS À L'ACTUALITÉ — les formats et sons viraux comptent AUTANT :
- Les signaux ne sont pas que des sujets d'actu (élections, météo, faits divers). Beaucoup sont des formats de vidéo, des challenges, des transitions de montage, des sons/musiques qui explosent sur TikTok/YouTube — repère-les activement, ce sont souvent les meilleurs candidats "surfer_maintenant" car exécutables en 24-48h sans lien avec un sujet sensible.
- Un hashtag ou une chanson qui buzz (ex: un titre musical, un effet, un type de transition) vaut autant d'attention qu'un sujet d'actualité — parfois plus, car le risque de paraître opportuniste est souvent plus faible.
- Classe chaque tendance dans "type_tendance" :
  - "actualite" : sujet d'actu, événement, personnalité, fait de société
  - "format_viral" : challenge, transition de montage, structure de vidéo, meme reproductible
  - "musique_son" : chanson, son, effet audio qui buzz
  - "produit_objet" : objet, produit, ustensile qui devient viral
  - "autre" : ne rentre dans aucune des catégories ci-dessus

FORMAT DE SORTIE — STRICT :
- Réponds UNIQUEMENT avec un tableau JSON valide, aucun texte avant ou après, aucun backtick markdown.
- Chaque élément du tableau respecte exactement ce schéma :
{
  "id": "slug-court-unique",
  "titre": "...",
  "source": "...",
  "score_kaza": 0-100,
  "categorie": "surfer_maintenant" | "a_surveiller" | "ignorer",
  "type_tendance": "actualite" | "format_viral" | "musique_son" | "produit_objet" | "autre",
  "resume": "pourquoi ça buzz, en 1-2 phrases",
  "fenetre": "ex: 24-48h",
  "angle_kaza": "angle de contenu concret en 1 phrase",
  "risque": "faible" | "moyen" | "eleve",
  "volume": "..."
}
- Analyse au maximum 25 tendances parmi les signaux fournis (fusionne les doublons entre sources si pertinent). Vise le meilleur compromis pertinence/rapidité : ne dépasse pas 25 même si plus de signaux sont fournis. Assure une diversité de type_tendance dans le résultat plutôt que de ne remonter que de l'actualité.`;

function buildUserPrompt(signals: RawSignal[]): string {
  const lines = signals
    .slice(0, 60)
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
    max_tokens: 6000,
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
