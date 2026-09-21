"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface RicompensaPersonaggio {
  valuta: number;
  items: string[];
  livelloPrecedente: number;
  livelloNuovo: number;
  esperienza: number;
}

interface RisultatoMissione {
  vittoria: boolean;
  ricompense: Record<string, RicompensaPersonaggio>;
}

export default function SchermataRisultato() {
  const { id } = useParams<{ id: string }>();
  const [risultato, setRisultato] = useState<RisultatoMissione | null>(null);

  useEffect(() => {
    fetch(`/api/instances/${id}/completa`, { method: "POST" })
      .then((r) => r.json())
      .then(setRisultato);
  }, [id]);

  if (!risultato) {
    return (
      <main>
        <p>Calcolo ricompense…</p>
      </main>
    );
  }

  if (!risultato.vittoria) {
    return (
      <main>
        <h1>Missione fallita</h1>
        <p>Il gruppo è stato sconfitto. Nessuna ricompensa, nessuna penalità.</p>
        <Link href="/">
          <button>Torna all&apos;HUB</button>
        </Link>
      </main>
    );
  }

  const ricompense = Object.values(risultato.ricompense);

  return (
    <main>
      <h1>Missione completata!</h1>
      {ricompense.map((r, i) => (
        <div key={i} className="panel">
          <p>+{r.esperienza} XP · +{r.valuta} valuta</p>
          {r.livelloNuovo > r.livelloPrecedente && (
            <p style={{ color: "var(--success)" }}>
              Level up! {r.livelloPrecedente} → {r.livelloNuovo}
            </p>
          )}
          {r.items.length > 0 && <p>Oggetti ottenuti: {r.items.length}</p>}
        </div>
      ))}
      <Link href="/missioni">
        <button>Rientra in missione</button>
      </Link>{" "}
      <Link href="/">
        <button className="secondary">Torna all&apos;HUB</button>
      </Link>
    </main>
  );
}
