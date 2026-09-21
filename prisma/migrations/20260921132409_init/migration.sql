-- CreateEnum
CREATE TYPE "CharacterClass" AS ENUM ('GUERRIERO', 'MAGO', 'RANGER');

-- CreateEnum
CREATE TYPE "ItemSlot" AS ENUM ('ARMA', 'ACCESSORIO');

-- CreateEnum
CREATE TYPE "ItemRarity" AS ENUM ('COMUNE', 'RARO', 'EPICO');

-- CreateEnum
CREATE TYPE "EnemyBehavior" AS ENUM ('ATTACCA_PIU_DEBOLE', 'ATTACCA_RANDOM');

-- CreateEnum
CREATE TYPE "MissionObjectiveType" AS ENUM ('ELIMINA_TUTTI');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('VALUTA', 'ITEM');

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "classe" "CharacterClass" NOT NULL,
    "livello" INTEGER NOT NULL DEFAULT 1,
    "esperienza" INTEGER NOT NULL DEFAULT 0,
    "forza" INTEGER NOT NULL DEFAULT 10,
    "intelletto" INTEGER NOT NULL DEFAULT 10,
    "vitalita" INTEGER NOT NULL DEFAULT 10,
    "agilita" INTEGER NOT NULL DEFAULT 10,
    "armaId" TEXT,
    "accessorioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slot" "ItemSlot" NOT NULL,
    "rarita" "ItemRarity" NOT NULL,
    "effettoSpeciale" TEXT,
    "characterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemModifier" (
    "id" TEXT NOT NULL,
    "stat" TEXT NOT NULL,
    "valore" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "ItemModifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enemy" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "hpBase" INTEGER NOT NULL,
    "dannoBase" INTEGER NOT NULL,
    "agilitaBase" INTEGER NOT NULL,
    "comportamento" "EnemyBehavior" NOT NULL,
    "tier" INTEGER NOT NULL,

    CONSTRAINT "Enemy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ambientazione" TEXT NOT NULL,
    "tipoObiettivo" "MissionObjectiveType" NOT NULL DEFAULT 'ELIMINA_TUTTI',
    "durataStimataMinuti" INTEGER NOT NULL,
    "hpMultiplierPerPlayer" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "nemiciExtraPerPlayer" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wave" (
    "id" TEXT NOT NULL,
    "ordine" INTEGER NOT NULL,
    "numeroNemiciBase" INTEGER NOT NULL,
    "missionId" TEXT NOT NULL,

    CONSTRAINT "Wave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WavePoolEntry" (
    "id" TEXT NOT NULL,
    "peso" INTEGER NOT NULL,
    "waveId" TEXT NOT NULL,
    "enemyId" TEXT NOT NULL,

    CONSTRAINT "WavePoolEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardEntry" (
    "id" TEXT NOT NULL,
    "tipo" "RewardType" NOT NULL,
    "valoreOItemId" TEXT NOT NULL,
    "probabilita" DOUBLE PRECISION NOT NULL,
    "missionId" TEXT NOT NULL,

    CONSTRAINT "RewardEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_armaId_fkey" FOREIGN KEY ("armaId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_accessorioId_fkey" FOREIGN KEY ("accessorioId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemModifier" ADD CONSTRAINT "ItemModifier_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wave" ADD CONSTRAINT "Wave_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WavePoolEntry" ADD CONSTRAINT "WavePoolEntry_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "Wave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WavePoolEntry" ADD CONSTRAINT "WavePoolEntry_enemyId_fkey" FOREIGN KEY ("enemyId") REFERENCES "Enemy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardEntry" ADD CONSTRAINT "RewardEntry_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
