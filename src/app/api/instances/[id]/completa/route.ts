import { NextRequest, NextResponse } from "next/server";
import { completaMissione } from "@/lib/mission/instance";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const risultato = await completaMissione(id);
    return NextResponse.json(risultato);
  } catch (e) {
    return NextResponse.json({ errore: (e as Error).message }, { status: 404 });
  }
}
