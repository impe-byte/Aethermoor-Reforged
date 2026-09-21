import { NextRequest, NextResponse } from "next/server";
import { ottieniIstanza } from "@/lib/mission/instance";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const istanza = ottieniIstanza(id);

  if (!istanza) {
    return NextResponse.json({ errore: "Istanza non trovata" }, { status: 404 });
  }

  return NextResponse.json(istanza);
}
