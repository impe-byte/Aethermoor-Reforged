/**
 * Formule di combattimento — fase 0 (brief, sezione 5).
 * Valori placeholder da affinare tramite scripts/simulate-balance.ts prima del playtest umano.
 */

export function hpMassimi(vitalita: number): number {
  return vitalita * 10;
}

export function dannoAttaccoBase(attaccante: {
  forza: number;
  intelletto: number;
  tipoDanno: "fisico" | "magico";
}): number {
  const stat = attaccante.tipoDanno === "magico" ? attaccante.intelletto : attaccante.forza;
  return Math.round(stat * 1.5);
}

// Abilità di classe: unica abilità disponibile in fase 0, colpo singolo più forte dell'attacco base.
export function dannoAbilitaClasse(attaccante: {
  forza: number;
  intelletto: number;
  tipoDanno: "fisico" | "magico";
}): number {
  const stat = attaccante.tipoDanno === "magico" ? attaccante.intelletto : attaccante.forza;
  return Math.round(stat * 1.8);
}

// Pozione base: cura una percentuale degli HP massimi del bersaglio.
export function curaPozioneBase(hpMax: number): number {
  return Math.round(hpMax * 0.3);
}

export function scalaHpNemico(hpBase: number, hpMultiplierPerPlayer: number, numeroGiocatori: number): number {
  return Math.round(hpBase * (1 + hpMultiplierPerPlayer * (numeroGiocatori - 1)));
}

export function scalaNumeroNemici(numeroBase: number, nemiciExtraPerPlayer: number, numeroGiocatori: number): number {
  return numeroBase + nemiciExtraPerPlayer * (numeroGiocatori - 1);
}
