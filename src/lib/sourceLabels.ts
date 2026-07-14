import type { SourceName } from "@/types/trend";

export const SOURCE_LABELS: Record<SourceName, string> = {
  google_trends: "Google Trends",
  reddit: "Reddit r/france",
  youtube: "YouTube FR",
  tiktok: "TikTok FR",
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source as SourceName] ?? source;
}
