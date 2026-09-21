# Aethermoor: Reforged

RPG a missioni/istanze con personaggio persistente e combattimento a turni
automatico. Vedi `docs/project-brief.md` per la visione completa e le
decisioni di design (fonte di verità del progetto).

## Stack

Next.js (App Router) + TypeScript, Prisma + PostgreSQL, Vitest per i test.

## Setup con Docker (consigliato se non hai Node.js installato)

Serve solo [Docker Desktop](https://www.docker.com/products/docker-desktop/)
installato — nessun bisogno di Node.js in locale.

1. Crea il file `.env` nella root del progetto con la connection string del
   tuo database (es. [Neon](https://neon.tech), free tier):

   ```
   DATABASE_URL="postgresql://utente:password@host/db?sslmode=require"
   ```

2. Avvia il container:

   ```bash
   docker compose up
   ```

   La prima volta impiega qualche minuto (installa le dipendenze dentro
   l'immagine). Le volte successive è quasi immediato.

3. In un altro terminale, applica lo schema e i dati di esempio (dentro il
   container in esecuzione):

   ```bash
   docker compose exec app npx prisma migrate dev
   docker compose exec app npm run prisma:seed
   ```

4. Apri [http://localhost:3000](http://localhost:3000).

Il codice sorgente è montato come volume: modifichi i file sul tuo computer
con un editor qualsiasi (es. VS Code) e il server dentro il container si
aggiorna automaticamente (hot reload), senza dover ricostruire l'immagine.

## Setup locale (con Node.js installato)

1. Installa le dipendenze:

   ```bash
   npm install
   ```

2. Configura `DATABASE_URL` in `.env` (una Postgres locale va bene; per il
   deploy si useranno Supabase/Neon). Esempio già presente in `.env`.

3. Applica lo schema e popola dati di esempio (1 personaggio, 1 missione,
   2 nemici, 4 oggetti):

   ```bash
   npx prisma migrate dev
   npm run prisma:seed
   ```

4. Avvia il dev server:

   ```bash
   npm run dev
   ```

   Apri [http://localhost:3000](http://localhost:3000): schermata personaggio
   → selezione missione → combattimento → risultato.

## Test e bilanciamento

```bash
npm run test        # test automatici del motore di combattimento
npm run simulate    # simulazione bilanciamento N=1..4 giocatori
```

Lo script `scripts/simulate-balance.ts` fa combattere gruppi simulati contro
i nemici scalati e stampa % HP residuo medio e turni impiegati per verificare
che le formule di scaling reggano prima del playtest umano.

## Struttura del codice

- `prisma/schema.prisma` — schema dati (Character, Item, Enemy, Mission, ...)
- `src/lib/combat/` — motore di combattimento, puro e testato in isolamento
  (`engine.ts`, `formulas.ts`), indipendente da Prisma/Next.js
- `src/lib/mission/instance.ts` — generazione istanza missione (scaling
  multiplayer), risoluzione turni, calcolo ricompense a fine missione
- `src/app/` — le 4 schermate dell'HUB (personaggio, missioni, combattimento,
  risultato) + API routes che espongono il motore

## Stato attuale / limiti noti

- Solo la classe Guerriero è giocabile (fase 0, come da brief).
- Le istanze di missione vivono in memoria nel processo Next.js: adeguato per
  sviluppo/playtest locale, non ancora per un deploy multi-processo (in quel
  caso serve uno store condiviso tipo Redis).
- Il flusso multiplayer reale (più giocatori umani nella stessa istanza,
  invito amici) non è ancora implementato: il motore supporta N giocatori e
  lo scaling è testato, ma manca la parte di sincronizzazione client-server
  per una sessione condivisa — da progettare come prossimo passo.
