# KAZA Trend Radar

Outil interne de veille de tendances pour **Maison KAZA**. Détecte les tendances du moment en France (Google Trends, Reddit, YouTube, TikTok), les score selon leur compatibilité avec l'ADN de la marque via Claude, et génère des angles de contenu et des prompts vidéo prêts à l'emploi.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Anthropic Claude (`claude-sonnet-4-6`) pour le scoring et la génération de contenu
- Cache clé-valeur (`/data` en fichiers locaux sur VPS, Netlify Blobs sur Netlify — bascule automatique), pas de base de données
- Protection par mot de passe unique (middleware + cookie signé), pas de système d'utilisateurs

## Installation locale

```bash
npm install
cp .env.example .env.local
# renseigner APP_PASSWORD, ANTHROPIC_API_KEY, YOUTUBE_API_KEY dans .env.local
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) — l'app redirige vers `/login` tant que le mot de passe n'est pas saisi.

## Variables d'environnement

Voir `.env.example`. Toutes les clés restent côté serveur (routes API + middleware), jamais exposées au client.

| Variable | Description |
| --- | --- |
| `APP_PASSWORD` | Mot de passe unique d'accès à l'outil, sert aussi de secret de signature du cookie de session. |
| `ANTHROPIC_API_KEY` | Clé API Anthropic, utilisée pour le scoring et la génération de contenu. |
| `YOUTUBE_API_KEY` | Clé API YouTube Data v3. Si absente, la source YouTube est marquée indisponible sans bloquer les autres. |
| `PORT` | Port d'écoute en production (défaut 3000). |

## Architecture

```
src/
  middleware.ts              # gate mot de passe + cookie de session
  app/
    page.tsx                 # dashboard principal (top 3 + classement)
    login/page.tsx
    historique/page.tsx
    api/
      auth/route.ts                  # POST mot de passe → cookie
      trends/collect/route.ts        # pipeline complet (agrégation + scoring), caché 3h
      trends/analyze/route.ts        # scoring Claude isolé (réutilisable/testable)
      trends/detail/route.ts         # analyse approfondie d'une tendance, cachée par id
      trends/video-prompts/route.ts  # génération Sora / Reel / caption, cachée par id
      trends/history/route.ts        # lecture de l'historique des collectes
  lib/
    sources/{googleTrends,reddit,youtube,tiktok}.ts   # un fetcher par source, erreurs isolées
    ai/{client,brandDna,scoring,detail,videoPrompts}.ts
    pipeline.ts               # orchestration collecte + scoring + cache + historique
    storage.ts                 # backend clé-valeur : fichiers locaux, ou Netlify Blobs si NETLIFY est défini
    cache.ts                  # cache avec TTL (3h par défaut), au-dessus de storage.ts
    history.ts                # persistance des collectes, au-dessus de storage.ts
    auth.ts                   # signature/validation du cookie de session
  components/                 # UI (cartes, drawer, badges, filtres, skeletons...)
data/
  cache/                      # (VPS/local uniquement) dernière collecte + réponses détail/vidéo par tendance
  history/                    # (VPS/local uniquement) une entrée par jour, une collecte par appel forcé
```

Sur Netlify, `data/cache` et `data/history` ne sont pas utilisés : `src/lib/storage.ts` détecte la variable d'environnement `NETLIFY` (injectée automatiquement par leur plateforme) et bascule sur [Netlify Blobs](https://docs.netlify.com/blobs/overview/), un store clé-valeur managé, gratuit sur le plan de base. Aucune configuration supplémentaire n'est nécessaire.

### Résilience des sources

Chaque source (`src/lib/sources/*.ts`) gère ses propres erreurs et retourne toujours un objet `{ ok, error, signals }` — si une source tombe (quota, changement de format, blocage géo), les autres continuent et l'UI affiche un badge "indisponible" pour la source en question. TikTok Creative Center n'étant pas une API publique documentée, elle est explicitement traitée comme fragile.

### Cache et coût des appels Anthropic

- La collecte complète (agrégation + scoring IA) est mise en cache sur disque (`data/cache/current-collection.json`) pendant **3 heures**. Un appel `GET /api/trends/collect` dans cette fenêtre renvoie le cache sans rappeler Claude.
- Le bouton **Rafraîchir** dans l'UI force un nouvel appel (`?force=true`), donc un nouveau coût de scoring — à utiliser avec discernement.
- Chaque analyse détaillée (`/api/trends/detail`) et chaque génération de prompts vidéo (`/api/trends/video-prompts`) est cachée **par tendance** (30 jours) : re-cliquer sur une tendance déjà consultée ne redéclenche pas d'appel IA.

**Estimation de coût** (ordre de grandeur, `claude-sonnet-4-6`) : un scoring de 25-50 tendances consomme quelques milliers de tokens d'entrée/sortie, de l'ordre de quelques centimes par appel. Avec le cache de 3h, l'usage naturel (consultation dans la journée + un rafraîchissement manuel occasionnel) reste de l'ordre de **quelques dizaines de centimes par jour**. Pour limiter davantage : augmenter le TTL du cache dans `src/lib/cache.ts`, ou restreindre l'accès au bouton Rafraîchir.

## Déploiement rapide sur Netlify (test interne)

Pratique pour tester l'app en interne sans mettre en place le VPS tout de suite. L'URL Netlify reste protégée par le mot de passe de l'app (`APP_PASSWORD`), donc pas besoin de la partager largement.

1. Pousser le code sur un repo GitHub (privé de préférence).
2. Sur [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project** → choisir le repo. Netlify détecte Next.js automatiquement (`@netlify/plugin-nextjs`, déjà déclaré dans `netlify.toml`).
3. Dans **Site configuration → Environment variables**, ajouter `APP_PASSWORD`, `ANTHROPIC_API_KEY`, `YOUTUBE_API_KEY` (les mêmes valeurs que dans `.env.local`).
4. Déployer. L'URL fournie par Netlify (`*.netlify.app`) est utilisable immédiatement.

Le cache et l'historique utilisent Netlify Blobs automatiquement sur cette plateforme (voir plus haut) — pas de perte de fonctionnalité par rapport au VPS.

## Déploiement (VPS Ubuntu / Hetzner + Nginx + pm2)

```bash
# Sur le serveur
git clone <repo> kaza-trend-radar
cd kaza-trend-radar
npm install
cp .env.example .env.local   # renseigner les vraies valeurs
npm run build

# pm2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # suivre les instructions affichées pour le démarrage au boot
```

### Nginx

Copier `deploy/nginx.trends.conf` vers `/etc/nginx/sites-available/trends.maisonkaza.fr`, l'activer, puis obtenir un certificat :

```bash
ln -s /etc/nginx/sites-available/trends.maisonkaza.fr /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d trends.maisonkaza.fr
```

### Mise à jour

```bash
git pull
npm install
npm run build
pm2 restart kaza-trend-radar
```

## Test de bout en bout (checklist)

1. `npm run dev`, se connecter via `/login` avec `APP_PASSWORD`.
2. Page principale : la collecte se déclenche automatiquement, badges de statut par source visibles.
3. Cliquer **Rafraîchir** : force une nouvelle collecte + un nouveau scoring IA.
4. Cliquer une tendance : le panneau latéral charge le décryptage, les 3 angles, les produits KAZA, les pièges.
5. Cliquer **Générer les prompts vidéo** : prompt Sora, script de Reel, caption + hashtags apparaissent, boutons Copier fonctionnels.
6. Re-cliquer la même tendance : détail et prompts vidéo réapparaissent instantanément (cache).
7. Onglet **Historique** : les collectes passées s'affichent par jour.
