import { NextResponse } from "next/server";
import { readAllHistory } from "@/lib/history";

export async function GET() {
  try {
    const history = await readAllHistory();
    return NextResponse.json({ history });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erreur lors de la lecture de l'historique",
      },
      { status: 500 }
    );
  }
}
