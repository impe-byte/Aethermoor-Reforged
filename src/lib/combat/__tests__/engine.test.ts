import { describe, expect, it } from "vitest";
import { risolviTurno, decidiBersaglioNemico, generaAzioniNemici } from "../engine";
import { Combatant } from "../types";

function giocatore(overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: "p1",
    nome: "Eroe",
    team: "giocatori",
    hp: 100,
    hpMax: 100,
    forza: 10,
    intelletto: 5,
    vitalita: 10,
    agilita: 10,
    tipoDanno: "fisico",
    ...overrides,
  };
}

function nemico(overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: "e1",
    nome: "Goblin",
    team: "nemici",
    hp: 50,
    hpMax: 50,
    forza: 8,
    intelletto: 0,
    vitalita: 5,
    agilita: 5,
    tipoDanno: "fisico",
    comportamento: "attacca_piu_debole",
    ...overrides,
  };
}

describe("risolviTurno", () => {
  it("risolve le azioni in ordine di agilità decrescente", () => {
    const veloce = giocatore({ id: "p1", agilita: 20 });
    const lento = nemico({ id: "e1", agilita: 1, hp: 15 });

    const risultato = risolviTurno(
      [veloce, lento],
      [{ actorId: "p1", tipo: "attacco_base", targetId: "e1" }],
      1
    );

    // Forza 10 × 1.5 = 15 danno → il nemico con 15 hp muore prima di poter agire
    expect(risultato.combattenti.find((c) => c.id === "e1")!.hp).toBe(0);
    expect(risultato.finito).toBe(true);
    expect(risultato.vittoriaGiocatori).toBe(true);
  });

  it("un'azione contro un bersaglio già KO viene ignorata", () => {
    const p1 = giocatore({ id: "p1", agilita: 20 });
    const p2 = giocatore({ id: "p2", agilita: 15, nome: "Eroe2" });
    const e1 = nemico({ id: "e1", agilita: 1, hp: 10 });

    const risultato = risolviTurno(
      [p1, p2, e1],
      [
        { actorId: "p1", tipo: "attacco_base", targetId: "e1" },
        { actorId: "p2", tipo: "attacco_base", targetId: "e1" },
      ],
      1
    );

    const koEvents = risultato.eventi.filter((e) => e.type === "ko");
    expect(koEvents).toHaveLength(1);
  });

  it("segnala sconfitta_giocatori quando tutti i giocatori sono a 0 HP", () => {
    const p1 = giocatore({ id: "p1", hp: 5, agilita: 1 });
    const e1 = nemico({ id: "e1", agilita: 20, forza: 20 });

    const risultato = risolviTurno(
      [p1, e1],
      [{ actorId: "e1", tipo: "attacco_base", targetId: "p1" }],
      1
    );

    expect(risultato.finito).toBe(true);
    expect(risultato.vittoriaGiocatori).toBe(false);
    expect(risultato.eventi.some((e) => e.type === "sconfitta_giocatori")).toBe(true);
  });

  it("l'oggetto/pozione cura invece di infliggere danno", () => {
    const p1 = giocatore({ id: "p1", hp: 40, hpMax: 100, agilita: 10 });
    const p2 = giocatore({ id: "p2", hp: 100, agilita: 5, nome: "Eroe2" });
    const e1 = nemico({ id: "e1", agilita: 1 });

    const risultato = risolviTurno(
      [p1, p2, e1],
      [{ actorId: "p2", tipo: "oggetto", targetId: "p1" }],
      1
    );

    expect(risultato.combattenti.find((c) => c.id === "p1")!.hp).toBe(70);
  });
});

describe("decidiBersaglioNemico", () => {
  it("attacca_piu_debole sceglie il giocatore con HP% più basso", () => {
    const forte = giocatore({ id: "p1", hp: 90, hpMax: 100 });
    const debole = giocatore({ id: "p2", hp: 20, hpMax: 100 });
    const attaccante = nemico({ comportamento: "attacca_piu_debole" });

    const bersaglio = decidiBersaglioNemico(attaccante, [forte, debole]);
    expect(bersaglio?.id).toBe("p2");
  });

  it("attacca_random usa il generatore random iniettato", () => {
    const p1 = giocatore({ id: "p1" });
    const p2 = giocatore({ id: "p2" });
    const attaccante = nemico({ comportamento: "attacca_random" });

    const bersaglio = decidiBersaglioNemico(attaccante, [p1, p2], () => 0.9);
    expect(bersaglio?.id).toBe("p2");
  });

  it("ritorna null se non ci sono giocatori vivi", () => {
    const attaccante = nemico();
    expect(decidiBersaglioNemico(attaccante, [])).toBeNull();
  });
});

describe("generaAzioniNemici", () => {
  it("genera un'azione di attacco per ogni nemico vivo", () => {
    const p1 = giocatore({ id: "p1" });
    const e1 = nemico({ id: "e1" });
    const e2 = nemico({ id: "e2", hp: 0 }); // KO, non deve agire

    const azioni = generaAzioniNemici([p1, e1, e2]);
    expect(azioni).toHaveLength(1);
    expect(azioni[0].actorId).toBe("e1");
    expect(azioni[0].targetId).toBe("p1");
  });
});
