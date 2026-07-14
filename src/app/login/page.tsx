"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import KazaLogo from "@/components/KazaLogo";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Mot de passe incorrect");
      }
      router.push(params.get("next") || "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10 flex flex-col items-center">
          <KazaLogo className="h-16 mb-5" />
          <h1 className="font-display font-bold text-3xl">Trend Radar</h1>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white/60 border border-kaza-line rounded-2xl p-8 shadow-sm"
        >
          <label className="block text-sm font-medium text-kaza-ink-soft mb-2">
            Mot de passe
          </label>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-kaza-line bg-white px-4 py-3 text-kaza-ink outline-none focus:border-kaza-terracotta transition-colors"
            placeholder="••••••••"
          />
          {error && (
            <p className="mt-3 text-sm text-kaza-rouge">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="mt-6 w-full rounded-lg bg-kaza-ink text-kaza-cream font-medium py-3 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Vérification…" : "Entrer"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
