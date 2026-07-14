import { getKeyValueStore } from "./storage";
import type { TrendCollection } from "@/types/trend";

const store = getKeyValueStore("history");

function keyForDate(isoDate: string) {
  return isoDate.slice(0, 10); // YYYY-MM-DD
}

export async function appendHistory(
  collection: TrendCollection
): Promise<void> {
  const key = keyForDate(collection.collectedAt);
  const existing = (await store.get<TrendCollection[]>(key)) ?? [];
  existing.push(collection);
  await store.set(key, existing);
}

export async function listHistoryDays(): Promise<string[]> {
  const days = await store.list();
  return days.sort((a, b) => b.localeCompare(a));
}

export async function readHistoryDay(
  day: string
): Promise<TrendCollection[]> {
  return (await store.get<TrendCollection[]>(day)) ?? [];
}

export async function readAllHistory(): Promise<
  Array<{ day: string; collections: TrendCollection[] }>
> {
  const days = await listHistoryDays();
  const results = await Promise.all(
    days.map(async (day) => ({ day, collections: await readHistoryDay(day) }))
  );
  return results;
}
