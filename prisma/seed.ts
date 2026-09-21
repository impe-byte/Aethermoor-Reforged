import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.rewardEntry.deleteMany();
  await prisma.wavePoolEntry.deleteMany();
  await prisma.wave.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.enemy.deleteMany();
  await prisma.itemModifier.deleteMany();
  await prisma.character.updateMany({ data: { armaId: null, accessorioId: null } });
  await prisma.item.deleteMany();
  await prisma.character.deleteMany();

  const spadaArrugginita = await prisma.item.create({
    data: {
      nome: "Spada Arrugginita",
      slot: "ARMA",
      rarita: "COMUNE",
      modificatori: { create: [{ stat: "forza", valore: 2 }] },
    },
  });

  const spadaAffilata = await prisma.item.create({
    data: {
      nome: "Spada Affilata",
      slot: "ARMA",
      rarita: "RARO",
      modificatori: { create: [{ stat: "forza", valore: 5 }] },
      effettoSpeciale: "+5% danno critico",
    },
  });

  const amuletoVitalita = await prisma.item.create({
    data: {
      nome: "Amuleto della Vitalità",
      slot: "ACCESSORIO",
      rarita: "COMUNE",
      modificatori: { create: [{ stat: "vitalita", valore: 3 }] },
    },
  });

  const anelloAgilita = await prisma.item.create({
    data: {
      nome: "Anello dell'Agilità",
      slot: "ACCESSORIO",
      rarita: "RARO",
      modificatori: { create: [{ stat: "agilita", valore: 4 }] },
    },
  });

  await prisma.character.create({
    data: {
      nome: "Aran",
      classe: "GUERRIERO",
      livello: 1,
      esperienza: 0,
      forza: 10,
      intelletto: 5,
      vitalita: 10,
      agilita: 8,
      armaId: spadaArrugginita.id,
    },
  });

  const goblin = await prisma.enemy.create({
    data: {
      nome: "Goblin",
      hpBase: 40,
      dannoBase: 6,
      agilitaBase: 6,
      comportamento: "ATTACCA_PIU_DEBOLE",
      tier: 1,
    },
  });

  const goblinArciere = await prisma.enemy.create({
    data: {
      nome: "Goblin Arciere",
      hpBase: 30,
      dannoBase: 8,
      agilitaBase: 9,
      comportamento: "ATTACCA_RANDOM",
      tier: 1,
    },
  });

  await prisma.mission.create({
    data: {
      nome: "Le Rovine di Aethermoor",
      ambientazione: "Rovine invase dalla vegetazione",
      tipoObiettivo: "ELIMINA_TUTTI",
      durataStimataMinuti: 15,
      hpMultiplierPerPlayer: 0.25,
      nemiciExtraPerPlayer: 1,
      ondate: {
        create: [
          {
            ordine: 1,
            numeroNemiciBase: 2,
            poolNemici: {
              create: [
                { enemyId: goblin.id, peso: 70 },
                { enemyId: goblinArciere.id, peso: 30 },
              ],
            },
          },
        ],
      },
      rewardTable: {
        create: [
          { tipo: "VALUTA", valoreOItemId: "50", probabilita: 1 },
          { tipo: "ITEM", valoreOItemId: spadaAffilata.id, probabilita: 0.15 },
          { tipo: "ITEM", valoreOItemId: amuletoVitalita.id, probabilita: 0.3 },
          { tipo: "ITEM", valoreOItemId: anelloAgilita.id, probabilita: 0.15 },
        ],
      },
    },
  });

  console.log("Seed completato.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
