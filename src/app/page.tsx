"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Modificatore {
  stat: string;
  valore: number;
}

interface Item {
  id: string;
  nome: string;
  slot: string;
  rarita: string;
  effettoSpeciale: string | null;
  modificatori: Modificatore[];
}

interface Character {
  id: string;
  nome: string;
  classe: string;
  livello: number;
  esperienza: number;
  forza: number;
  intelletto: number;
  vitalita: number;
  agilita: number;
  arma: Item | null;
  accessorio: Item | null;
}

const SOGLIA_LIVELLO = 500;

export default function SchermataPersonaggio() {
  const [character, setCharacter] = useState<Character | null>(null);

  useEffect(() => {
    fetch("/api/characters")
      .then((r) => r.json())
      .then((personaggi) => {
        if (personaggi[0]) {
          return fetch(`/api/characters/${personaggi[0].id}`).then((r) => r.json());
        }
        return null;
      })
      .then(setCharacter);
  }, []);

  if (!character) {
    return (
      <main>
        <p>Caricamento personaggio…</p>
      </main>
    );
  }

  return (
    <main>
      <nav>
        <a href="/">Personaggio</a>
        <Link href="/missioni">Missioni</Link>
      </nav>

      <h1>{character.nome}</h1>
      <p>
        {character.classe} — Livello {character.livello} ({character.esperienza}/{SOGLIA_LIVELLO} XP)
      </p>

      <div className="panel">
        <h2>Statistiche</h2>
        <div className="stat-grid">
          <div className="stat"><span>Forza</span><span>{character.forza}</span></div>
          <div className="stat"><span>Intelletto</span><span>{character.intelletto}</span></div>
          <div className="stat"><span>Vitalità</span><span>{character.vitalita}</span></div>
          <div className="stat"><span>Agilità</span><span>{character.agilita}</span></div>
        </div>
      </div>

      <div className="panel">
        <h2>Equipaggiamento</h2>
        <p>
          <strong>Arma:</strong> {character.arma ? character.arma.nome : "Nessuna"}
        </p>
        <p>
          <strong>Accessorio:</strong> {character.accessorio ? character.accessorio.nome : "Nessuno"}
        </p>
      </div>

      <Link href="/missioni">
        <button>Vai alle missioni</button>
      </Link>
    </main>
  );
}
