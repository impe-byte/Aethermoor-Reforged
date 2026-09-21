import { NextRequest, NextResponse } from "next/server";
import { creaIstanza } from "@/lib/mission/instance";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { missionId, characterIds } = body as { missionId: string; characterIds: string[] };

  if (!missionId || !Array.isArray(characterIds) || characterIds.length === 0) {
    return NextResponse.json({ errore: "missionId e characterIds sono obbligatori" }, { status: 400 });
  }

  const istanza = await creaIstanza(missionId, characterIds);
  return NextResponse.json(istanza);
}
