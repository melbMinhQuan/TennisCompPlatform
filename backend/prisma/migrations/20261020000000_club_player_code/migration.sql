-- AlterTable
-- The test-data workbook's readable IDs (CLB01, PLR005). The seed turns them into
-- the UUID primary keys, which cannot be turned back, so they are kept here.
-- Rows created any other way have none. A database seeded before this change
-- gets them filled in by its next `npm run seed:competition`.
ALTER TABLE "club" ADD COLUMN "code" TEXT;

ALTER TABLE "player" ADD COLUMN "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "club_code_key" ON "club"("code");

CREATE UNIQUE INDEX "player_code_key" ON "player"("code");
