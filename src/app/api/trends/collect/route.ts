import { NextResponse } from "next/server";
import { runCollection } from "@/lib/pipeline";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";

  try {
    const collection = await runCollection(force);
    return NextResponse.json(collection);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erreur lors de la collecte",
      },
      { status: 500 }
    );
  }
}
