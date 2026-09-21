import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      arma: { include: { modificatori: true } },
      accessorio: { include: { modificatori: true } },
      inventario: { include: { modificatori: true } },
    },
  });

  if (!character) {
    return NextResponse.json({ errore: "Personaggio non trovato" }, { status: 404 });
  }

  return NextResponse.json(character);
}
