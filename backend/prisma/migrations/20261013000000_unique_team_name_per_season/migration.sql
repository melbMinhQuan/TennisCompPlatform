-- Team names are unique within a season, ignoring case and surrounding spaces.
-- A team reaches its season only through its section, and a unique index cannot
-- span tables, so team carries a copy of the season id. The composite foreign
-- key below makes that copy match the section's season and follow it on update.

-- AlterTable: add the column, backfill it from the section, then require it.
ALTER TABLE "team" ADD COLUMN "season_id" TEXT;

UPDATE "team" t
SET "season_id" = s."season_id"
FROM "section_grade" s
WHERE s."id" = t."section_id";

ALTER TABLE "team" ALTER COLUMN "season_id" SET NOT NULL;

-- CreateIndex: the target of the composite foreign key.
CREATE UNIQUE INDEX "section_grade_id_season_id_key" ON "section_grade"("id", "season_id");

-- AddForeignKey: replaces the plain section_id key.
ALTER TABLE "team" DROP CONSTRAINT "team_section_id_fkey";

ALTER TABLE "team"
  ADD CONSTRAINT "team_section_id_season_id_fkey"
  FOREIGN KEY ("section_id", "season_id") REFERENCES "section_grade"("id", "season_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex: an expression index, which Prisma has no syntax for (see the
-- note on model Team). Fails here if a season already holds a duplicate name.
CREATE UNIQUE INDEX "team_season_id_name_key" ON "team"("season_id", lower(btrim("name")));
