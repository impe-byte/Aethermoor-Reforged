"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Mission {
  id: string;
  nome: string;
  ambientazione: string;
  durataStimataMinuti: number;
  _count: { ondate: number };
}

export default function SelezioneMissione() {
  const router = useRouter();
  const [missioni, setMissioni] = useState<Mission[]>([]);
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [avvio, setAvvio] = useState(false);

  useEffect(() => {
    fetch("/api/missions").then((r) => r.json()).then(setMissioni);
    fetch("/api/characters")
      .then((r) => r.json())
      .then((personaggi) => setCharacterId(personaggi[0]?.id ?? null));
  }, []);

  async function avviaMissione(missionId: string) {
    if (!characterId || avvio) return;
    setAvvio(true);
    const res = await fetch("/api/instances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId, characterIds: [characterId] }),
    });
    const istanza = await res.json();
    router.push(`/combattimento/${istanza.id}`);
  }

  return (
    <main>
      <nav>
        <Link href="/">Personaggio</Link>
        <a href="/missioni">Missioni</a>
      </nav>

      <h1>Seleziona missione</h1>
      <p style={{ opacity: 0.7 }}>Fase 0: gioco in solitaria — l&apos;invito amici arriva in una fase successiva.</p>

      {missioni.map((m) => (
        <div key={m.id} className="panel">
          <h2>{m.nome}</h2>
          <p>{m.ambientazione}</p>
          <p>
            {m._count.ondate} ondata/e · ~{m.durataStimataMinuti} min
          </p>
          <button onClick={() => avviaMissione(m.id)} disabled={avvio || !characterId}>
            {avvio ? "Generazione istanza…" : "Entra nella missione"}
          </button>
        </div>
      ))}
    </main>
  );
}
