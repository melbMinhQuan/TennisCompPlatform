-- CreateEnum
CREATE TYPE "RubberOutcome" AS ENUM ('COMPLETED', 'RETIRED', 'WALKOVER', 'FORFEIT', 'ABANDONED');

-- CreateEnum
CREATE TYPE "VenueStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ScheduleChangeType" AS ENUM ('DATE_TIME_CHANGED', 'VENUE_CHANGED', 'POSTPONED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MATCH_DATE_CHANGED', 'VENUE_CHANGED', 'DRAW_RELEASED', 'MATCH_REMINDER', 'RESULT_ENTERED', 'RESULT_DISPUTED', 'EMERGENCY_PLAYER_REQUIRED', 'COMPETITION_UPDATE');

-- CreateEnum
CREATE TYPE "NotificationTargetType" AS ENUM ('FIXTURE', 'RUBBER', 'MATCH_RESULT', 'COMPETITION');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "Discipline" AS ENUM ('SINGLES', 'DOUBLES');

-- CreateEnum
CREATE TYPE "AwardType" AS ENUM ('COMPETITION_WINNER', 'SECTION_WINNER', 'RUNNER_UP', 'OTHER');

-- AlterEnum
ALTER TYPE "FixtureStatus" ADD VALUE 'POSTPONED';

-- AlterTable
ALTER TABLE "fixture" ADD COLUMN     "round_label" TEXT,
ADD COLUMN     "venue_id" TEXT;

-- AlterTable
ALTER TABLE "player" ADD COLUMN     "avatar_url" TEXT;

-- AlterTable
ALTER TABLE "rubber" ADD COLUMN     "outcome_type" "RubberOutcome",
ADD COLUMN     "played_at" TIMESTAMP(3),
ADD COLUMN     "winner_side" "Side";

-- AlterTable
ALTER TABLE "rubber_set" ADD COLUMN     "away_tiebreak_points" INTEGER,
ADD COLUMN     "home_tiebreak_points" INTEGER;

-- AlterTable
ALTER TABLE "team" ADD COLUMN     "home_venue_id" TEXT;

-- CreateTable
CREATE TABLE "venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "time_zone" TEXT NOT NULL,
    "court_count" INTEGER,
    "club_id" TEXT,
    "status" "VenueStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixture_schedule_change" (
    "id" TEXT NOT NULL,
    "fixture_id" TEXT NOT NULL,
    "change_type" "ScheduleChangeType" NOT NULL,
    "previous_date" DATE,
    "previous_time" TIME,
    "new_date" DATE,
    "new_time" TIME,
    "previous_venue_id" TEXT,
    "new_venue_id" TEXT,
    "reason" TEXT,
    "changed_by" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fixture_schedule_change_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "target_type" "NotificationTargetType",
    "target_id" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "delivery_status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utr_rating_snapshot" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "discipline" "Discipline",
    "rating" DECIMAL(5,2) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utr_rating_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_cohort" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "association_id" TEXT,
    "discipline" "Discipline",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_cohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_entry" (
    "id" TEXT NOT NULL,
    "cohort_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "rating" DECIMAL(5,2),
    "percentile_rank" DECIMAL(5,2),
    "as_of" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_award" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "award_type" "AwardType" NOT NULL,
    "title" TEXT NOT NULL,
    "competition_id" TEXT,
    "season_id" TEXT,
    "team_id" TEXT,
    "awarded_on" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ladder_entry" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "position" INTEGER,
    "played" INTEGER NOT NULL DEFAULT 0,
    "won" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "drawn" INTEGER NOT NULL DEFAULT 0,
    "rubbers_for" INTEGER NOT NULL DEFAULT 0,
    "rubbers_against" INTEGER NOT NULL DEFAULT 0,
    "sets_for" INTEGER NOT NULL DEFAULT 0,
    "sets_against" INTEGER NOT NULL DEFAULT 0,
    "games_for" INTEGER NOT NULL DEFAULT 0,
    "games_against" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "calculated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ladder_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_standing" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "position" INTEGER,
    "rubbers_played" INTEGER NOT NULL DEFAULT 0,
    "rubbers_won" INTEGER NOT NULL DEFAULT 0,
    "rubbers_lost" INTEGER NOT NULL DEFAULT 0,
    "sets_won" INTEGER NOT NULL DEFAULT 0,
    "sets_lost" INTEGER NOT NULL DEFAULT 0,
    "games_won" INTEGER NOT NULL DEFAULT 0,
    "games_lost" INTEGER NOT NULL DEFAULT 0,
    "win_percentage" DECIMAL(5,2),
    "calculated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_standing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "venue_club_id_idx" ON "venue"("club_id");

-- CreateIndex
CREATE INDEX "fixture_schedule_change_fixture_id_changed_at_idx" ON "fixture_schedule_change"("fixture_id", "changed_at");

-- CreateIndex
CREATE INDEX "notification_user_id_created_at_idx" ON "notification"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notification_user_id_channel_read_at_idx" ON "notification"("user_id", "channel", "read_at");

-- CreateIndex
CREATE INDEX "utr_rating_snapshot_player_id_discipline_recorded_at_idx" ON "utr_rating_snapshot"("player_id", "discipline", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "utr_rating_snapshot_player_id_discipline_recorded_at_key" ON "utr_rating_snapshot"("player_id", "discipline", "recorded_at");

-- CreateIndex
CREATE INDEX "ranking_entry_cohort_id_as_of_rank_idx" ON "ranking_entry"("cohort_id", "as_of", "rank");

-- CreateIndex
CREATE INDEX "ranking_entry_player_id_as_of_idx" ON "ranking_entry"("player_id", "as_of");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_entry_cohort_id_player_id_as_of_key" ON "ranking_entry"("cohort_id", "player_id", "as_of");

-- CreateIndex
CREATE INDEX "player_award_player_id_awarded_on_idx" ON "player_award"("player_id", "awarded_on");

-- CreateIndex
CREATE INDEX "ladder_entry_section_id_position_idx" ON "ladder_entry"("section_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ladder_entry_section_id_team_id_key" ON "ladder_entry"("section_id", "team_id");

-- CreateIndex
CREATE INDEX "player_standing_section_id_position_idx" ON "player_standing"("section_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "player_standing_section_id_player_id_key" ON "player_standing"("section_id", "player_id");

-- CreateIndex
CREATE INDEX "fixture_venue_id_schedule_date_idx" ON "fixture"("venue_id", "schedule_date");

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_home_venue_id_fkey" FOREIGN KEY ("home_venue_id") REFERENCES "venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixture" ADD CONSTRAINT "fixture_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue" ADD CONSTRAINT "venue_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixture_schedule_change" ADD CONSTRAINT "fixture_schedule_change_fixture_id_fkey" FOREIGN KEY ("fixture_id") REFERENCES "fixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixture_schedule_change" ADD CONSTRAINT "fixture_schedule_change_previous_venue_id_fkey" FOREIGN KEY ("previous_venue_id") REFERENCES "venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixture_schedule_change" ADD CONSTRAINT "fixture_schedule_change_new_venue_id_fkey" FOREIGN KEY ("new_venue_id") REFERENCES "venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utr_rating_snapshot" ADD CONSTRAINT "utr_rating_snapshot_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_cohort" ADD CONSTRAINT "ranking_cohort_association_id_fkey" FOREIGN KEY ("association_id") REFERENCES "association"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_entry" ADD CONSTRAINT "ranking_entry_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "ranking_cohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_entry" ADD CONSTRAINT "ranking_entry_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_award" ADD CONSTRAINT "player_award_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_award" ADD CONSTRAINT "player_award_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_award" ADD CONSTRAINT "player_award_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_award" ADD CONSTRAINT "player_award_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ladder_entry" ADD CONSTRAINT "ladder_entry_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "section_grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ladder_entry" ADD CONSTRAINT "ladder_entry_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_standing" ADD CONSTRAINT "player_standing_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "section_grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_standing" ADD CONSTRAINT "player_standing_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
