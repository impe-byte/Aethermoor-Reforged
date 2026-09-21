/**
 * Simulazione di bilanciamento — punto 10.4 del brief.
 * Fa combattere N gruppi di test contro un'ondata di nemici scalata, per
 * verificare che gli HP residui per giocatore restino stabili tra N=1 e N=4.
 * Uso: npm run simulate
 */
import { Combatant, risolviTurno, generaAzioniNemici, scalaHpNemico, scalaNumeroNemici } from "../src/lib/combat";

interface EsitoSimulazione {
  vittoria: boolean;
  turniImpiegati: number;
  hpResiduoPctMedio: number;
}

function creaGiocatore(id: string): Combatant {
  return {
    id,
    nome: `Eroe-${id}`,
    team: "giocatori",
    hp: 100,
    hpMax: 100,
    forza: 10,
    intelletto: 5,
    vitalita: 10,
    agilita: 10,
    tipoDanno: "fisico",
  };
}

function creaNemico(id: string, hp: number): Combatant {
  return {
    id,
    nome: `Goblin-${id}`,
    team: "nemici",
    hp,
    hpMax: hp,
    forza: 6,
    intelletto: 0,
    vitalita: hp / 10,
    agilita: 6,
    tipoDanno: "fisico",
    comportamento: "attacca_piu_debole",
  };
}

function simulaMissione(numeroGiocatori: number, seed: number): EsitoSimulazione {
  let rngState = seed;
  const random = () => {
    // LCG semplice, deterministico per riproducibilità
    rngState = (rngState * 1103515245 + 12345) % 2147483648;
    return rngState / 2147483648;
  };

  const giocatori: Combatant[] = Array.from({ length: numeroGiocatori }, (_, i) =>
    creaGiocatore(`p${i + 1}`)
  );

  const hpMultiplierPerPlayer = 0.25;
  const nemiciExtraPerPlayer = 1;
  const numeroNemici = scalaNumeroNemici(2, nemiciExtraPerPlayer, numeroGiocatori);
  const hpNemico = scalaHpNemico(40, hpMultiplierPerPlayer, numeroGiocatori);

  let combattenti: Combatant[] = [
    ...giocatori,
    ...Array.from({ length: numeroNemici }, (_, i) => creaNemico(`e${i + 1}`, hpNemico)),
  ];

  let turno = 0;
  const maxTurni = 50;

  while (turno < maxTurni) {
    turno++;
    const giocatoriVivi = combattenti.filter((c) => c.team === "giocatori" && c.hp > 0);
    const nemiciVivi = combattenti.filter((c) => c.team === "nemici" && c.hp > 0);

    const azioniGiocatori = giocatoriVivi.map((g) => {
      const bersaglio = nemiciVivi.reduce((a, b) => (a.hp < b.hp ? a : b));
      return { actorId: g.id, tipo: "attacco_base" as const, targetId: bersaglio.id };
    });
    const azioniNemici = generaAzioniNemici(combattenti, random);

    const risultato = risolviTurno(combattenti, [...azioniGiocatori, ...azioniNemici], turno);
    combattenti = risultato.combattenti;

    if (risultato.finito) {
      const giocatoriFinali = combattenti.filter((c) => c.team === "giocatori");
      const hpResiduoPctMedio =
        giocatoriFinali.reduce((sum, g) => sum + g.hp / g.hpMax, 0) / giocatoriFinali.length;

      return {
        vittoria: !!risultato.vittoriaGiocatori,
        turniImpiegati: turno,
        hpResiduoPctMedio,
      };
    }
  }

  return { vittoria: false, turniImpiegati: maxTurni, hpResiduoPctMedio: 0 };
}

function eseguiBatch(numeroGiocatori: number, numeroSimulazioni: number): void {
  const esiti = Array.from({ length: numeroSimulazioni }, (_, i) =>
    simulaMissione(numeroGiocatori, i + 1)
  );

  const vittorie = esiti.filter((e) => e.vittoria).length;
  const hpMedio =
    esiti.reduce((sum, e) => sum + e.hpResiduoPctMedio, 0) / esiti.length;
  const turniMedi = esiti.reduce((sum, e) => sum + e.turniImpiegati, 0) / esiti.length;

  console.log(
    `N=${numeroGiocatori} giocatori | vittorie: ${vittorie}/${numeroSimulazioni} | ` +
      `HP residuo medio: ${(hpMedio * 100).toFixed(1)}% | turni medi: ${turniMedi.toFixed(1)}`
  );
}

console.log("Simulazione bilanciamento — Aethermoor: Reforged (fase 0)\n");
for (const n of [1, 2, 3, 4]) {
  eseguiBatch(n, 200);
}
