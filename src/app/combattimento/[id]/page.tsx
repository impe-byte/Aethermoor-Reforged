"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Combattente {
  id: string;
  nome: string;
  team: "giocatori" | "nemici";
  hp: number;
  hpMax: number;
  agilita: number;
}

interface EventoLog {
  type: string;
  actorId?: string;
  targetId?: string;
  danno?: number;
  turno: number;
}

interface Istanza {
  id: string;
  combattenti: Combattente[];
  terminata: boolean;
  vittoria: boolean;
  turno: number;
  log: EventoLog[];
  characterIds: string[];
}

function nomeDi(combattenti: Combattente[], id?: string): string {
  return combattenti.find((c) => c.id === id)?.nome ?? "???";
}

export default function SchermataCombattimento() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [istanza, setIstanza] = useState<Istanza | null>(null);
  const [bersaglio, setBersaglio] = useState<string | null>(null);
  const [inCorso, setInCorso] = useState(false);

  useEffect(() => {
    fetch(`/api/instances/${id}`).then((r) => r.json()).then(setIstanza);
  }, [id]);

  useEffect(() => {
    if (istanza?.terminata) {
      router.push(`/risultato/${id}`);
    }
  }, [istanza?.terminata, id, router]);

  if (!istanza) {
    return (
      <main>
        <p>Caricamento missione…</p>
      </main>
    );
  }

  const mioPersonaggioId = istanza.characterIds[0];
  const nemiciVivi = istanza.combattenti.filter((c) => c.team === "nemici" && c.hp > 0);

  async function eseguiAzione(tipo: "attacco_base" | "abilita_classe" | "oggetto") {
    if (inCorso) return;
    const target = tipo === "oggetto" ? mioPersonaggioId : bersaglio;
    if (!target) return;

    setInCorso(true);
    const res = await fetch(`/api/instances/${id}/turno`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ azioni: [{ actorId: mioPersonaggioId, tipo, targetId: target }] }),
    });
    const aggiornata = await res.json();
    setIstanza(aggiornata);
    setBersaglio(null);
    setInCorso(false);
  }

  return (
    <main>
      <h1>Combattimento — turno {istanza.turno}</h1>

      <div className="panel">
        {istanza.combattenti.map((c) => (
          <div key={c.id} className="combattente-row">
            <span>{c.nome} {c.team === "nemici" ? "🗡️" : "🛡️"}</span>
            <div style={{ width: 140 }}>
              <div className="hp-bar">
                <div
                  className={`hp-bar-fill ${c.hp / c.hpMax < 0.3 ? "basso" : ""}`}
                  style={{ width: `${(c.hp / c.hpMax) * 100}%` }}
                />
              </div>
              <small>{c.hp}/{c.hpMax} HP</small>
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>Scegli il bersaglio</h2>
        <div className="azioni-row">
          {nemiciVivi.map((n) => (
            <button
              key={n.id}
              className={bersaglio === n.id ? "" : "secondary"}
              onClick={() => setBersaglio(n.id)}
            >
              {n.nome}
            </button>
          ))}
        </div>

        <h2>Azione</h2>
        <div className="azioni-row">
          <button disabled={!bersaglio || inCorso} onClick={() => eseguiAzione("attacco_base")}>
            Attacco base
          </button>
          <button disabled={!bersaglio || inCorso} onClick={() => eseguiAzione("abilita_classe")}>
            Abilità di classe
          </button>
          <button disabled={inCorso} onClick={() => eseguiAzione("oggetto")}>
            Usa pozione
          </button>
        </div>
      </div>

      <div className="panel">
        <h2>Log</h2>
        {istanza.log
          .slice()
          .reverse()
          .slice(0, 12)
          .map((e, i) => (
            <div key={i} className="log-entry">
              {e.type === "azione_eseguita" &&
                `T${e.turno}: ${nomeDi(istanza.combattenti, e.actorId)} → ${nomeDi(istanza.combattenti, e.targetId)} (${
                  (e.danno ?? 0) < 0 ? `cura ${-(e.danno ?? 0)}` : `${e.danno} danno`
                })`}
              {e.type === "ko" && `T${e.turno}: ${nomeDi(istanza.combattenti, e.targetId)} è KO!`}
            </div>
          ))}
      </div>
    </main>
  );
}
