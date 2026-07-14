"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // presse-papiers indisponible (permissions navigateur) — pas d'action
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs font-semibold uppercase tracking-wide text-kaza-terracotta hover:text-kaza-rouge transition-colors"
    >
      {copied ? "Copié !" : "Copier"}
    </button>
  );
}
