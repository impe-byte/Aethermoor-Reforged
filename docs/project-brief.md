# Aethermoor: Reforged — Project Brief per sviluppo AI-assisted

> Documento di riferimento per avviare lo sviluppo con Cursor/Claude. Contiene tutte le decisioni di design prese, lo schema dati, il flusso di gioco e il piano del vertical slice. Da tenere aggiornato come fonte di verità durante lo sviluppo.

---

## 1. Visione del progetto

**Genere:** RPG a missioni/istanze con personaggio persistente, combattimento a turni automatico.

**Obiettivo di design:** permettere di giocare sia in solitaria che con amici sullo stesso personaggio, senza gating di progressione — nessuna missione bloccata da requisiti che costringano a "recuperare" contenuti prima di giocare insieme. Ogni missione è un ciclo autoconclusivo di 10-20 minuti, senza debiti di quest residui tra una sessione e l'altra.

**Ispirazione di riferimento:** struttura a istanze tipo Warframe (personaggio persistente + missioni brevi indipendenti), filosofia non-p2w e sviluppo sostenibile da team ridotto tipo Melvor Idle.

**Obiettivo di progetto:** costruire un prodotto reale e completo, non un prototipo infinito — vertical slice giocabile e validato entro 4-6 settimane prima di aggiungere qualsiasi feature secondaria.

**Nome:** provvisorio "Aethermoor: Reforged" (da confermare — restart completo rispetto alla versione precedente del progetto, di cui non si riusano codice né documentazione).

---

## 2. Decisioni architetturali chiave

- **Combattimento a turni automatico**, non azione in tempo reale — scelto per essere compatibile con sviluppo AI-assisted (logica deterministica, testabile senza rete complessa) e per rendere banale il multiplayer (nessun netcode, solo calcolo server-side condiviso).
- **Struttura a missioni/istanze**, non mondo MMO persistente — ogni sessione di gioco è un'istanza temporanea isolata per il gruppo che la gioca, generata al momento e distrutta al termine.
- **Tutto data-driven**: classi, stat, nemici, missioni, oggetti vivono come dati (DB), non come logica hardcoded nel codice — prerequisito per un futuro editor via UI, e per bilanciamento validabile tramite simulazione automatica.
- **Editor UI per classi/oggetti/missioni**: obiettivo a lungo termine, NON nella fase 0. Arriva solo dopo che il modello dati è stabile e il vertical slice è validato come divertente.

---

## 3. Stack tecnico

| Livello | Scelta | Motivo |
|---|---|---|
| Frontend + Backend | Next.js + TypeScript (full-stack) | Un solo linguaggio, riduce context-switching per Cursor/Claude |
| Database | Postgres | Affidabile, standard, ben supportato da Prisma |
| ORM / schema | Prisma | Schema come fonte di verità unica, condivisa da motore ed eventuale editor futuro |
| Multiplayer | Nessun netcode real-time — stato risolto server-side, trasmesso ai client al termine del calcolo turno | Coerente con combattimento a turni, elimina complessità di sincronizzazione |
| Deploy | Vercel (app) + Supabase o Neon (DB gestito) | Stesso ecosistema già in uso per altri progetti |

---

## 4. Schema dati (fase 0)

```typescript
Character {
  id
  nome
  classe: "Guerriero" | "Mago" | "Ranger" (fase 0: partire con 1 sola classe giocabile)
  livello, esperienza
  stat: {
    forza: number      // → danno fisico
    intelletto: number // → danno magico / effetti
    vitalità: number   // → HP massimi (HP = vitalità × 10)
    agilità: number    // → ordine turno, schivata/critico
  }
  equipaggiamento: {
    arma: Item | null
    accessorio: Item | null
  }
}

Item {
  id, nome
  slot: "arma" | "accessorio"
  rarità: "comune" | "raro" | "epico"
  modificatori: { stat: string, valore: number }[]
  effetto_speciale?: string  // es. "+5% danno critico" (opzionale, fase 0 minimale)
}

Enemy {
  id, nome
  hp_base, danno_base, agilità_base
  comportamento: "attacca_più_debole" | "attacca_random"
  tier: number  // livello di potenza per adattarsi a missioni diverse
}

Mission {
  id, nome, ambientazione
  tipo_obiettivo: "elimina_tutti"  // unico tipo per fase 0
  ondate: {
    pool_nemici: { enemy_id: string, peso: number }[]
    numero_nemici_base: number
  }[]
  scaling_rule: {
    hp_multiplier_per_player: number   // es. 0.25
    nemici_extra_per_player: number    // es. +1 nemico oltre il primo giocatore
  }
  reward_table: { tipo: "valuta" | "item", valore_o_item_id: string, probabilità: number }[]
  durata_stimata_minuti: number
}
```

---

## 5. Sistema di combattimento

**Meccanica:** turni "a intenzione simultanea" — ogni partecipante (giocatori e nemici) sceglie un'azione per il turno, poi le azioni si risolvono in ordine di Agilità decrescente.

**Formula base (fase 0, da validare/affinare con simulazione):**
- HP = Vitalità × 10
- Danno attacco base = Forza × 1.5 (fisico) o Intelletto × 1.5 (magico, per classi caster)
- Ordine turno = Agilità decrescente

**Scelte del giocatore per turno (max 3 opzioni in fase 0):**
1. Attacco base
2. Abilità di classe (1 sola in fase 0)
3. Oggetto/pozione

**Comportamento nemici:** IA minimale — "attacca il partecipante più debole" (HP% più basso) o "attacca a caso", assegnata per tipo di nemico.

**Condizione di sconfitta gruppo:** se tutti i giocatori arrivano a 0 HP, la missione fallisce; ritorno all'HUB senza ricompense, nessuna penalità aggiuntiva (design non punitivo).

---

## 6. Scaling multiplayer

**Formula di riferimento (validata con simulazione nel documento precedente):**

```
HP_nemico_scalato = HP_base × (1 + hp_multiplier_per_player × (N-1))
Numero_nemici_ondata = numero_base + (nemici_extra_per_player × (N-1))
```

**Principio:** il danno subito *per giocatore* deve restare pressoché costante tra N=1 e N=4 — verificato nella simulazione: ~80% HP residui a fine missione in entrambi i casi con i valori di esempio (moltiplicatore 0.25, +1 nemico per giocatore oltre il primo).

**Danno nemici NON scala con N** — solo HP e quantità, per evitare overkill sul singolo giocatore in gruppi numerosi.

**Ricompense:** piene e individuali per ciascun giocatore, mai divise per N.

**Punto aperto da testare:** senza coordinamento tattico (focus fire), un gruppo numeroso potrebbe subire più danno totale distribuito per la presenza di più nemici attivi contemporaneamente — da verificare in playtest.

---

## 7. Flusso completo di una missione

```
1. SELEZIONE (HUB)
   → giocatore/capogruppo sceglie missione, invita eventuali amici
   → tutti confermano ingresso

2. GENERAZIONE ISTANZA (server)
   → legge schema missione, applica scaling in base a N giocatori presenti
   → crea istanza temporanea isolata per quel gruppo

3. SVOLGIMENTO (per ogni ondata)
   → combattimento a turni (vedi punto 5) finché ondata sconfitta o gruppo eliminato
   → breve pausa tra ondate (uso oggetti/cure se previsto)
   → ripete per ondate successive (1-3 in fase 0)

4. COMPLETAMENTO
   → se tutte le ondate sconfitte: tira reward_table per ciascun giocatore individualmente
   → mostra risultato (ricompense, XP, eventuale level up)
   → se gruppo eliminato: ritorno HUB senza ricompense

5. RITORNO HUB
   → personaggi aggiornati (equipaggiamento, XP, livello)
   → nessun debito residuo — ogni missione è autoconclusiva
   → possibilità di rientrare subito, cambiare missione, o sciogliere il gruppo
```

**Punto di design da fissare prima dello sviluppo multiplayer:** comportamento in caso di disconnessione di un giocatore a metà missione. Proposta: la missione continua con chi resta, con eventuale malus di scaling residuo (da definire nel dettaglio in fase di implementazione).

---

## 8. HUB / interfaccia minima (fase 0)

Solo 4 schermate, nient'altro:

1. **Schermata personaggio** — stat, equipaggiamento attuale, livello/esperienza
2. **Selezione missione** — lista missioni disponibili con difficoltà stimata, durata, anteprima ricompense
3. **Schermata combattimento** — log azioni, scelta azione turno, HP di tutti i partecipanti
4. **Schermata risultato** — ricompense ottenute, XP, eventuale level up, pulsante ritorno HUB

**Esplicitamente fuori scope fase 0:** editor di qualsiasi tipo, chat in-game (coordinamento esterno via Discord), inventario con filtri avanzati, sistema di trade tra giocatori, narrativa/lore estesa.

---

## 9. Definizione di "fatto" per il vertical slice

Il vertical slice è completo quando:

- [ ] 1 personaggio con le 4 stat base, 1 classe giocabile
- [ ] 1 missione funzionante (1 tipo obiettivo, 1-2 tipi di nemico, scaling 1-4 giocatori)
- [ ] Combattimento a turni end-to-end (scelta azione → risoluzione → risultato)
- [ ] 2 slot equipaggiamento con almeno 3-4 oggetti diversi ottenibili come drop
- [ ] HUB minimo con le 4 schermate del punto 8
- [ ] Giocabile in solo e in gruppo fino a 4, senza bug bloccanti

**Criterio di validazione:** testato da te e almeno 2-3 amici, con la domanda "questo ciclo è divertente ripetuto 5-10 volte?" come metro di giudizio prima di procedere oltre.

**Esplicitamente fuori scope fino a validazione completata:** editor UI, seconda tipologia di missione, classi multiple, narrativa estesa, monetizzazione.

---

## 10. Prossimi passi operativi

1. Setup progetto Next.js + TypeScript + Prisma + Postgres (repo, ambiente locale, DB gestito)
2. Definire schema Prisma completo a partire dallo schema dati (punto 4)
3. Implementare motore di combattimento come modulo isolato e testabile (punto 5), con test automatici sui casi base (1 e 4 giocatori, come simulato)
4. Costruire script di simulazione bilanciamento (combattimenti automatici massivi per validare formule prima del playtest umano)
5. Implementare HUB minimo (punto 8) e collegare al motore
6. Playtest interno con 2-3 amici, iterare su bilanciamento/ritmo
7. Solo dopo validazione: pianificare la fase successiva (editor, contenuti aggiuntivi)

---

*Documento vivo — aggiornare man mano che le decisioni di design evolvono durante lo sviluppo, così da mantenere sempre coerenza tra quello che è stato deciso e quello che viene effettivamente implementato.*
