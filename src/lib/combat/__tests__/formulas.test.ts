import { describe, expect, it } from "vitest";
import {
  hpMassimi,
  dannoAttaccoBase,
  dannoAbilitaClasse,
  curaPozioneBase,
  scalaHpNemico,
  scalaNumeroNemici,
} from "../formulas";

describe("formule base", () => {
  it("HP = Vitalità × 10", () => {
    expect(hpMassimi(10)).toBe(100);
    expect(hpMassimi(25)).toBe(250);
  });

  it("danno fisico = Forza × 1.5", () => {
    expect(dannoAttaccoBase({ forza: 10, intelletto: 5, tipoDanno: "fisico" })).toBe(15);
  });

  it("danno magico = Intelletto × 1.5", () => {
    expect(dannoAttaccoBase({ forza: 5, intelletto: 10, tipoDanno: "magico" })).toBe(15);
  });

  it("abilità di classe infligge più danno dell'attacco base", () => {
    const attaccante = { forza: 10, intelletto: 5, tipoDanno: "fisico" as const };
    expect(dannoAbilitaClasse(attaccante)).toBeGreaterThan(dannoAttaccoBase(attaccante));
  });

  it("la pozione cura una percentuale degli HP massimi", () => {
    expect(curaPozioneBase(100)).toBe(30);
  });

  it("scaling HP nemico con 1 giocatore è invariato", () => {
    expect(scalaHpNemico(100, 0.25, 1)).toBe(100);
  });

  it("scaling HP nemico con 4 giocatori applica il moltiplicatore", () => {
    // 100 * (1 + 0.25 * 3) = 175
    expect(scalaHpNemico(100, 0.25, 4)).toBe(175);
  });

  it("scaling numero nemici aggiunge nemici extra per giocatore oltre il primo", () => {
    expect(scalaNumeroNemici(3, 1, 1)).toBe(3);
    expect(scalaNumeroNemici(3, 1, 4)).toBe(6);
  });
});
