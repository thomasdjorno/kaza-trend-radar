export type SourceName = "google_trends" | "reddit" | "youtube" | "tiktok";

export interface RawSignal {
  source: SourceName;
  titre: string;
  extrait?: string;
  metrique?: string;
  url?: string;
}

export interface SourceResult {
  source: SourceName;
  ok: boolean;
  error?: string;
  signals: RawSignal[];
  fetchedAt: string;
}

export type Categorie = "surfer_maintenant" | "a_surveiller" | "ignorer";
export type Risque = "faible" | "moyen" | "eleve";
export type TypeTendance =
  | "actualite"
  | "format_viral"
  | "musique_son"
  | "produit_objet"
  | "autre";

export interface ScoredTrend {
  id: string;
  titre: string;
  source: SourceName | string;
  score_kaza: number;
  categorie: Categorie;
  type_tendance: TypeTendance;
  resume: string;
  fenetre: string;
  angle_kaza: string;
  risque: Risque;
  volume: string;
}

export interface TrendCollection {
  collectedAt: string;
  sources: Record<SourceName, { ok: boolean; error?: string; count: number }>;
  trends: ScoredTrend[];
  scoringError?: string;
}

export interface TrendDetail {
  id: string;
  decryptage: string;
  angles: Array<{
    niveau: "sur" | "modere" | "audacieux";
    angle: string;
    hook: string;
  }>;
  produits_kaza: string[];
  pieges: string[];
  generatedAt: string;
}

export interface VideoPrompts {
  id: string;
  sora_prompt: string;
  reel_script: {
    hook: string;
    plans: string[];
    texte_ecran: string[];
    audio_suggestion: string;
  };
  caption: {
    texte: string;
    hashtags: string[];
  };
  generatedAt: string;
}

export const KAZA_PRODUCTS = [
  "Rouge Obsidienne",
  "Bois Fauve",
  "Éveil Floral",
  "Dunes d'Or",
  "Douceur des Flammes",
  "Vertige du Midi",
] as const;
