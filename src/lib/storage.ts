import { promises as fs } from "fs";
import path from "path";
import { getStore } from "@netlify/blobs";

export interface KeyValueStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
}

const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
const NETLIFY_BLOBS_TOKEN = process.env.NETLIFY_BLOBS_TOKEN;
const hasExplicitNetlifyConfig = Boolean(NETLIFY_SITE_ID && NETLIFY_BLOBS_TOKEN);

function fileStore(namespace: string): KeyValueStore {
  const dir = path.join(process.cwd(), "data", namespace);
  const fileFor = (key: string) => path.join(dir, `${key}.json`);

  return {
    async get<T>(key: string) {
      try {
        const raw = await fs.readFile(fileFor(key), "utf-8");
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    async set<T>(key: string, value: T) {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fileFor(key), JSON.stringify(value, null, 2), "utf-8");
    },
    async delete(key: string) {
      try {
        await fs.unlink(fileFor(key));
      } catch {
        // pas de fichier existant, rien à faire
      }
    },
    async list() {
      try {
        const files = await fs.readdir(dir);
        return files
          .filter((f) => f.endsWith(".json"))
          .map((f) => f.replace(/\.json$/, ""));
      } catch {
        return [];
      }
    },
  };
}

/**
 * Les fonctions serverless Netlify n'ont pas de disque persistant.
 * La détection automatique du contexte Netlify Blobs (via variables
 * injectées par leur plateforme) ne se propage pas de façon fiable
 * jusqu'aux route handlers Next.js sur Netlify — on configure donc le
 * store explicitement avec NETLIFY_SITE_ID + NETLIFY_BLOBS_TOKEN.
 */
function blobsStore(namespace: string): KeyValueStore {
  const store = hasExplicitNetlifyConfig
    ? getStore({
        name: namespace,
        siteID: NETLIFY_SITE_ID!,
        token: NETLIFY_BLOBS_TOKEN!,
      })
    : getStore(namespace);

  return {
    async get<T>(key: string) {
      const value = await store.get(key, { type: "json" });
      return (value ?? null) as T | null;
    },
    async set<T>(key: string, value: T) {
      await store.setJSON(key, value);
    },
    async delete(key: string) {
      await store.delete(key);
    },
    async list() {
      const { blobs } = await store.list();
      return blobs.map((b) => b.key);
    },
  };
}

export function getKeyValueStore(namespace: string): KeyValueStore {
  const isNetlify = hasExplicitNetlifyConfig || Boolean(process.env.NETLIFY);
  return isNetlify ? blobsStore(namespace) : fileStore(namespace);
}
