-- AlterTable
-- A junior's parent or guardian: who a team manager contacts about matches. The
-- junior's own phone and login email stay private to the junior, their club and
-- the association (see docs/junior-privacy.md). Blank for an adult.
ALTER TABLE "player" ADD COLUMN "guardian_name" TEXT;

ALTER TABLE "player" ADD COLUMN "guardian_email" TEXT;

ALTER TABLE "player" ADD COLUMN "guardian_phone" TEXT;
