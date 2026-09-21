import { Combatant, Azione, CombatEvent, TurnoRisultato } from "./types";
import { dannoAttaccoBase, dannoAbilitaClasse, curaPozioneBase } from "./formulas";

function ordinaPerAgilita(combattenti: Combatant[]): Combatant[] {
  return [...combattenti].sort((a, b) => b.agilita - a.agilita);
}

function vivi(combattenti: Combatant[], team: Combatant["team"]): Combatant[] {
  return combattenti.filter((c) => c.team === team && c.hp > 0);
}

/**
 * Sceglie il bersaglio per un nemico secondo il suo comportamento.
 * "attacca_piu_debole": HP% più basso tra i giocatori vivi.
 * "attacca_random": bersaglio casuale tra i giocatori vivi.
 */
export function decidiBersaglioNemico(
  nemico: Combatant,
  giocatoriVivi: Combatant[],
  random: () => number = Math.random
): Combatant | null {
  if (giocatoriVivi.length === 0) return null;
  if (nemico.comportamento === "attacca_random") {
    const idx = Math.floor(random() * giocatoriVivi.length);
    return giocatoriVivi[idx];
  }
  // attacca_piu_debole (default)
  return giocatoriVivi.reduce((piuDebole, corrente) => {
    const pctPiuDebole = piuDebole.hp / piuDebole.hpMax;
    const pctCorrente = corrente.hp / corrente.hpMax;
    return pctCorrente < pctPiuDebole ? corrente : piuDebole;
  });
}

/**
 * Genera le azioni dei nemici per il turno corrente (IA minimale, fase 0).
 */
export function generaAzioniNemici(
  combattenti: Combatant[],
  random: () => number = Math.random
): Azione[] {
  const nemiciVivi = vivi(combattenti, "nemici");
  const giocatoriVivi = vivi(combattenti, "giocatori");
  const azioni: Azione[] = [];

  for (const nemico of nemiciVivi) {
    const bersaglio = decidiBersaglioNemico(nemico, giocatoriVivi, random);
    if (!bersaglio) break;
    azioni.push({ actorId: nemico.id, tipo: "attacco_base", targetId: bersaglio.id });
  }

  return azioni;
}

/**
 * Risolve un turno di combattimento: le azioni si applicano in ordine di
 * Agilità decrescente dell'attore. Un'azione il cui attore o bersaglio è
 * già a 0 HP quando viene il suo turno viene saltata.
 */
export function risolviTurno(
  combattentiIniziali: Combatant[],
  azioni: Azione[],
  numeroTurno: number
): TurnoRisultato {
  const combattenti = combattentiIniziali.map((c) => ({ ...c }));
  const eventi: CombatEvent[] = [];
  const azioniPerAttore = new Map(azioni.map((a) => [a.actorId, a]));
  const ordine = ordinaPerAgilita(combattenti);

  for (const attoreOrdine of ordine) {
    const attore = combattenti.find((c) => c.id === attoreOrdine.id)!;
    if (attore.hp <= 0) continue;

    const azione = azioniPerAttore.get(attore.id);
    if (!azione) continue;

    const bersaglio = combattenti.find((c) => c.id === azione.targetId);
    if (!bersaglio || bersaglio.hp <= 0) continue;

    if (azione.tipo === "oggetto") {
      const cura = curaPozioneBase(bersaglio.hpMax);
      bersaglio.hp = Math.min(bersaglio.hpMax, bersaglio.hp + cura);
      eventi.push({
        type: "azione_eseguita",
        actorId: attore.id,
        targetId: bersaglio.id,
        danno: -cura,
        hpResiduo: bersaglio.hp,
        turno: numeroTurno,
      });
      continue;
    }

    const danno =
      azione.tipo === "abilita_classe" ? dannoAbilitaClasse(attore) : dannoAttaccoBase(attore);
    bersaglio.hp = Math.max(0, bersaglio.hp - danno);

    eventi.push({
      type: "azione_eseguita",
      actorId: attore.id,
      targetId: bersaglio.id,
      danno,
      hpResiduo: bersaglio.hp,
      turno: numeroTurno,
    });

    if (bersaglio.hp === 0) {
      eventi.push({ type: "ko", targetId: bersaglio.id, turno: numeroTurno });
    }
  }

  const giocatoriVivi = vivi(combattenti, "giocatori");
  const nemiciVivi = vivi(combattenti, "nemici");

  if (giocatoriVivi.length === 0) {
    eventi.push({ type: "sconfitta_giocatori", turno: numeroTurno });
    return { eventi, combattenti, finito: true, vittoriaGiocatori: false };
  }

  if (nemiciVivi.length === 0) {
    eventi.push({ type: "vittoria_giocatori", turno: numeroTurno });
    return { eventi, combattenti, finito: true, vittoriaGiocatori: true };
  }

  return { eventi, combattenti, finito: false };
}
