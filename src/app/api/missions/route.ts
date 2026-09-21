import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const missions = await prisma.mission.findMany({
    select: {
      id: true,
      nome: true,
      ambientazione: true,
      durataStimataMinuti: true,
      _count: { select: { ondate: true } },
    },
  });

  return NextResponse.json(missions);
}
