import { prisma } from "@/lib/prisma";
import {
  Azione,
  Combatant,
  CombatEvent,
  generaAzioniNemici,
  hpMassimi,
  risolviTurno,
  scalaHpNemico,
  scalaNumeroNemici,
} from "@/lib/combat";

interface StatoIstanza {
  id: string;
  missionId: string;
  characterIds: string[];
  numeroGiocatori: number;
  ondate: { numeroNemiciBase: number; poolNemici: { enemyId: string; peso: number }[] }[];
  ondataCorrente: number;
  combattenti: Combatant[];
  terminata: boolean;
  vittoria: boolean;
  turno: number;
  log: CombatEvent[];
}

// Store in-memory delle istanze attive. Per il vertical slice (singolo processo
// Next.js) è sufficiente; una vera architettura multi-processo richiederebbe
// uno store condiviso (Redis) — non necessario finché non si scala oltre un'istanza server.
const globalForIstanze = globalThis as unknown as { istanze?: Map<string, StatoIstanza> };
const istanze = globalForIstanze.istanze ?? new Map<string, StatoIstanza>();
globalForIstanze.istanze = istanze;

function classeATipoDanno(classe: string): "fisico" | "magico" {
  return classe === "MAGO" ? "magico" : "fisico";
}

async function caricaCombattentiGiocatori(characterIds: string[]): Promise<Combatant[]> {
  const personaggi = await prisma.character.findMany({
    where: { id: { in: characterIds } },
    include: { arma: { include: { modificatori: true } }, accessorio: { include: { modificatori: true } } },
  });

  return personaggi.map((p) => {
    const modificatori = [...(p.arma?.modificatori ?? []), ...(p.accessorio?.modificatori ?? [])];
    const bonus = (stat: string) =>
      modificatori.filter((m) => m.stat === stat).reduce((sum, m) => sum + m.valore, 0);

    const forza = p.forza + bonus("forza");
    const intelletto = p.intelletto + bonus("intelletto");
    const vitalita = p.vitalita + bonus("vitalita");
    const agilita = p.agilita + bonus("agilita");
    const hpMax = hpMassimi(vitalita);

    return {
      id: p.id,
      nome: p.nome,
      team: "giocatori",
      hp: hpMax,
      hpMax,
      forza,
      intelletto,
      vitalita,
      agilita,
      tipoDanno: classeATipoDanno(p.classe),
    };
  });
}

function selezionaNemicoDaPool(
  pool: { enemyId: string; peso: number }[],
  random: () => number
): string {
  const totale = pool.reduce((sum, p) => sum + p.peso, 0);
  let soglia = random() * totale;
  for (const entry of pool) {
    soglia -= entry.peso;
    if (soglia <= 0) return entry.enemyId;
  }
  return pool[pool.length - 1].enemyId;
}

async function generaCombattentiOndata(
  ondata: StatoIstanza["ondate"][number],
  mission: { hpMultiplierPerPlayer: number; nemiciExtraPerPlayer: number },
  numeroGiocatori: number,
  random: () => number = Math.random
): Promise<Combatant[]> {
  const numeroNemici = scalaNumeroNemici(
    ondata.numeroNemiciBase,
    mission.nemiciExtraPerPlayer,
    numeroGiocatori
  );

  const enemyIds = Array.from({ length: numeroNemici }, () =>
    selezionaNemicoDaPool(ondata.poolNemici, random)
  );
  const nemiciDb = await prisma.enemy.findMany({ where: { id: { in: enemyIds } } });
  const nemiciById = new Map(nemiciDb.map((e) => [e.id, e]));

  return enemyIds.map((enemyId, i) => {
    const nemico = nemiciById.get(enemyId)!;
    const hpMax = scalaHpNemico(nemico.hpBase, mission.hpMultiplierPerPlayer, numeroGiocatori);
    return {
      id: `${enemyId}-${i}`,
      nome: nemico.nome,
      team: "nemici",
      hp: hpMax,
      hpMax,
      forza: nemico.dannoBase,
      intelletto: 0,
      vitalita: hpMax / 10,
      agilita: nemico.agilitaBase,
      tipoDanno: "fisico",
      comportamento:
        nemico.comportamento === "ATTACCA_RANDOM" ? "attacca_random" : "attacca_piu_debole",
    };
  });
}

export async function creaIstanza(missionId: string, characterIds: string[]) {
  const mission = await prisma.mission.findUniqueOrThrow({
    where: { id: missionId },
    include: { ondate: { include: { poolNemici: true }, orderBy: { ordine: "asc" } } },
  });

  const giocatori = await caricaCombattentiGiocatori(characterIds);
  const numeroGiocatori = giocatori.length;
  const nemici = await generaCombattentiOndata(mission.ondate[0], mission, numeroGiocatori);

  const id = crypto.randomUUID();
  const stato: StatoIstanza = {
    id,
    missionId,
    characterIds,
    numeroGiocatori,
    ondate: mission.ondate,
    ondataCorrente: 0,
    combattenti: [...giocatori, ...nemici],
    terminata: false,
    vittoria: false,
    turno: 0,
    log: [],
  };

  istanze.set(id, stato);
  return stato;
}

export function ottieniIstanza(id: string): StatoIstanza | undefined {
  return istanze.get(id);
}

export async function eseguiTurno(id: string, azioniGiocatori: Azione[]) {
  const stato = istanze.get(id);
  if (!stato) throw new Error("Istanza non trovata");
  if (stato.terminata) return stato;

  stato.turno += 1;
  const azioniNemici = generaAzioniNemici(stato.combattenti);
  const risultato = risolviTurno(stato.combattenti, [...azioniGiocatori, ...azioniNemici], stato.turno);

  stato.combattenti = risultato.combattenti;
  stato.log.push(...risultato.eventi);

  if (risultato.finito && !risultato.vittoriaGiocatori) {
    stato.terminata = true;
    stato.vittoria = false;
    return stato;
  }

  if (risultato.finito && risultato.vittoriaGiocatori) {
    const mission = await prisma.mission.findUniqueOrThrow({
      where: { id: stato.missionId },
      include: { ondate: { include: { poolNemici: true }, orderBy: { ordine: "asc" } } },
    });

    const prossimaOndata = stato.ondataCorrente + 1;
    if (prossimaOndata < mission.ondate.length) {
      stato.ondataCorrente = prossimaOndata;
      const nemici = await generaCombattentiOndata(
        mission.ondate[prossimaOndata],
        mission,
        stato.numeroGiocatori
      );
      stato.combattenti = [
        ...stato.combattenti.filter((c) => c.team === "giocatori"),
        ...nemici,
      ];
    } else {
      stato.terminata = true;
      stato.vittoria = true;
    }
  }

  return stato;
}

export async function completaMissione(id: string) {
  const stato = istanze.get(id);
  if (!stato) throw new Error("Istanza non trovata");
  if (!stato.terminata) throw new Error("Missione non ancora terminata");

  if (!stato.vittoria) {
    istanze.delete(id);
    return { vittoria: false, ricompense: {} as Record<string, unknown> };
  }

  const mission = await prisma.mission.findUniqueOrThrow({
    where: { id: stato.missionId },
    include: { rewardTable: true },
  });

  const ricompense: Record<string, { valuta: number; items: string[]; livelloPrecedente: number; livelloNuovo: number; esperienza: number }> = {};

  for (const characterId of stato.characterIds) {
    let valuta = 0;
    const items: string[] = [];

    for (const reward of mission.rewardTable) {
      if (Math.random() > reward.probabilita) continue;
      if (reward.tipo === "VALUTA") {
        valuta += Number(reward.valoreOItemId);
      } else {
        items.push(reward.valoreOItemId);
      }
    }

    const esperienzaGuadagnata = 100;
    const personaggio = await prisma.character.findUniqueOrThrow({ where: { id: characterId } });
    const livelloPrecedente = personaggio.livello;
    const esperienzaTotale = personaggio.esperienza + esperienzaGuadagnata;
    const sogliaLivello = 500;
    const livelliGuadagnati = Math.floor(esperienzaTotale / sogliaLivello);
    const livelloNuovo = livelloPrecedente + livelliGuadagnati;

    await prisma.character.update({
      where: { id: characterId },
      data: {
        esperienza: esperienzaTotale % sogliaLivello,
        livello: livelloNuovo,
        ...(items.length > 0
          ? { inventario: { connect: items.map((itemId) => ({ id: itemId })) } }
          : {}),
      },
    });

    ricompense[characterId] = {
      valuta,
      items,
      livelloPrecedente,
      livelloNuovo,
      esperienza: esperienzaGuadagnata,
    };
  }

  istanze.delete(id);
  return { vittoria: true, ricompense };
}
