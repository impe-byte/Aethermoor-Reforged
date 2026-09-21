import { NextRequest, NextResponse } from "next/server";
import { eseguiTurno } from "@/lib/mission/instance";
import { Azione } from "@/lib/combat";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const azioni = body.azioni as Azione[];

  try {
    const istanza = await eseguiTurno(id, azioni);
    return NextResponse.json(istanza);
  } catch (e) {
    return NextResponse.json({ errore: (e as Error).message }, { status: 404 });
  }
}
