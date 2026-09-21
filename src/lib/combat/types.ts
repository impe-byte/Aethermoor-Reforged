export type Team = "giocatori" | "nemici";

export type TipoDanno = "fisico" | "magico";

export type ComportamentoNemico = "attacca_piu_debole" | "attacca_random";

export interface Combatant {
  id: string;
  nome: string;
  team: Team;
  hp: number;
  hpMax: number;
  forza: number;
  intelletto: number;
  vitalita: number;
  agilita: number;
  tipoDanno: TipoDanno;
  comportamento?: ComportamentoNemico;
}

export type AzioneTipo = "attacco_base" | "abilita_classe" | "oggetto";

export interface Azione {
  actorId: string;
  tipo: AzioneTipo;
  targetId: string;
}

export type CombatEventType =
  | "azione_eseguita"
  | "ko"
  | "vittoria_giocatori"
  | "sconfitta_giocatori";

export interface CombatEvent {
  type: CombatEventType;
  actorId?: string;
  targetId?: string;
  danno?: number;
  hpResiduo?: number;
  turno: number;
}

export interface TurnoRisultato {
  eventi: CombatEvent[];
  combattenti: Combatant[];
  finito: boolean;
  vittoriaGiocatori?: boolean;
}
