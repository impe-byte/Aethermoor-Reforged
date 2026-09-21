import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const characters = await prisma.character.findMany({
    select: { id: true, nome: true, classe: true, livello: true },
  });
  return NextResponse.json(characters);
}
