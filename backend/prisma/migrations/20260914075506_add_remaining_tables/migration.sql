-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('ADMINISTRATOR', 'RECORDS_SECRETARY', 'CLUB_ADMIN', 'TEAM_MANAGER', 'PLAYER', 'PUBLIC');

-- CreateEnum
CREATE TYPE "ContextType" AS ENUM ('ASSOCIATION', 'CLUB', 'TEAM', 'COMPETITION', 'GLOBAL');

-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MergeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TeamPlayerStatus" AS ENUM ('ACTIVE', 'EMERGENCY', 'INACTIVE');

-- CreateEnum
CREATE TYPE "FixtureStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('DRAFT', 'PENDING_CONFIRMATION', 'FINALISED', 'UNDER_CORRECTION');

-- CreateEnum
CREATE TYPE "RubberType" AS ENUM ('SINGLES', 'DOUBLES');

-- CreateEnum
CREATE TYPE "Side" AS ENUM ('HOME', 'AWAY');

-- CreateEnum
CREATE TYPE "ConfirmationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "CorrectionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "user_role" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_type" "RoleType" NOT NULL,
    "context_type" "ContextType" NOT NULL,
    "association_id" TEXT,
    "club_id" TEXT,
    "team_id" TEXT,
    "competition_id" TEXT,
    "granted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utr_link" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "utr_account_id" TEXT,
    "utr_rating" DECIMAL(5,2),
    "last_synced_at" TIMESTAMP(3),
    "status" "LinkStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "utr_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "association_membership" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "association_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "association_membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_merge_request" (
    "id" TEXT NOT NULL,
    "status" "MergeStatus" NOT NULL DEFAULT 'PENDING',
    "player_a_id" TEXT NOT NULL,
    "player_b_id" TEXT NOT NULL,
    "requesting_association_id" TEXT,
    "note" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_merge_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition" (
    "id" TEXT NOT NULL,
    "association_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "status" "CompetitionStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_format" (
    "id" TEXT NOT NULL,
    "competition_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rubber_count" INTEGER,
    "set_format" TEXT,
    "set_to_win" INTEGER,
    "tiebreak_rule" TEXT,
    "match_tiebreak" TEXT,
    "winner_determined_by" TEXT,
    "allow_draw" BOOLEAN NOT NULL DEFAULT false,
    "singles_count" INTEGER,
    "doubles_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_format_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season" (
    "id" TEXT NOT NULL,
    "competition_id" TEXT NOT NULL,
    "year" INTEGER,
    "season_type" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "status" "SeasonStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_grade" (
    "id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "Gender",
    "age_group" TEXT,
    "min_age" INTEGER,
    "max_age" INTEGER,
    "team_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "contact_user_id" TEXT,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_player" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "status" "TeamPlayerStatus" NOT NULL DEFAULT 'ACTIVE',
    "register_at" TIMESTAMP(3),

    CONSTRAINT "team_player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixture" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "home_team_id" TEXT NOT NULL,
    "away_team_id" TEXT NOT NULL,
    "round_number" INTEGER,
    "schedule_date" DATE,
    "schedule_time" TIME,
    "status" "FixtureStatus" NOT NULL DEFAULT 'SCHEDULED',
    "is_finals" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_result" (
    "id" TEXT NOT NULL,
    "fixture_id" TEXT NOT NULL,
    "home_rubbers" INTEGER,
    "away_rubbers" INTEGER,
    "status" "ResultStatus" NOT NULL DEFAULT 'DRAFT',
    "outcome" TEXT,
    "notes" TEXT,
    "entered_by" TEXT,
    "finalised_by" TEXT,
    "entered_at" TIMESTAMP(3),
    "finalised_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubber" (
    "id" TEXT NOT NULL,
    "match_result_id" TEXT NOT NULL,
    "match_format_id" TEXT,
    "rubber_number" INTEGER,
    "rubber_type" "RubberType" NOT NULL,
    "incomplete_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rubber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubber_set" (
    "id" TEXT NOT NULL,
    "rubber_id" TEXT NOT NULL,
    "set_number" INTEGER,
    "home_games" INTEGER,
    "away_games" INTEGER,
    "is_tiebreak" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "rubber_set_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubber_player" (
    "id" TEXT NOT NULL,
    "rubber_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "is_emergency" BOOLEAN NOT NULL DEFAULT false,
    "side" "Side" NOT NULL,
    "player_order" INTEGER,

    CONSTRAINT "rubber_player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_confirmation" (
    "id" TEXT NOT NULL,
    "match_result_id" TEXT NOT NULL,
    "status" "ConfirmationStatus" NOT NULL DEFAULT 'PENDING',
    "home_entered_by" TEXT,
    "away_confirmed_by" TEXT,
    "home_entered_at" TIMESTAMP(3),
    "away_confirmed_at" TIMESTAMP(3),
    "score_correct" BOOLEAN,
    "comments_correct" BOOLEAN,
    "dispute_reason" TEXT,

    CONSTRAINT "result_confirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correction_request" (
    "id" TEXT NOT NULL,
    "match_result_id" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3),
    "requested_by" TEXT,
    "reason" TEXT,
    "status" "CorrectionStatus" NOT NULL DEFAULT 'PENDING',
    "review_by" TEXT,
    "review_at" TIMESTAMP(3),
    "reviewed_notes" TEXT,

    CONSTRAINT "correction_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eligibility_rule" (
    "id" TEXT NOT NULL,
    "competition_id" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "scope" TEXT,
    "min_matches_played" INTEGER,
    "grade_restriction" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eligibility_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "action" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_summary" TEXT,
    "changed_by" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utr_link_player_id_key" ON "utr_link"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "association_membership_player_id_association_id_key" ON "association_membership"("player_id", "association_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_player_team_id_player_id_key" ON "team_player"("team_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_result_fixture_id_key" ON "match_result"("fixture_id");

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utr_link" ADD CONSTRAINT "utr_link_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "association_membership" ADD CONSTRAINT "association_membership_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "association_membership" ADD CONSTRAINT "association_membership_association_id_fkey" FOREIGN KEY ("association_id") REFERENCES "association"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition" ADD CONSTRAINT "competition_association_id_fkey" FOREIGN KEY ("association_id") REFERENCES "association"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_format" ADD CONSTRAINT "match_format_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season" ADD CONSTRAINT "season_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_grade" ADD CONSTRAINT "section_grade_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "section_grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_player" ADD CONSTRAINT "team_player_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_player" ADD CONSTRAINT "team_player_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixture" ADD CONSTRAINT "fixture_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "section_grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixture" ADD CONSTRAINT "fixture_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixture" ADD CONSTRAINT "fixture_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_result" ADD CONSTRAINT "match_result_fixture_id_fkey" FOREIGN KEY ("fixture_id") REFERENCES "fixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubber" ADD CONSTRAINT "rubber_match_result_id_fkey" FOREIGN KEY ("match_result_id") REFERENCES "match_result"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubber" ADD CONSTRAINT "rubber_match_format_id_fkey" FOREIGN KEY ("match_format_id") REFERENCES "match_format"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubber_set" ADD CONSTRAINT "rubber_set_rubber_id_fkey" FOREIGN KEY ("rubber_id") REFERENCES "rubber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubber_player" ADD CONSTRAINT "rubber_player_rubber_id_fkey" FOREIGN KEY ("rubber_id") REFERENCES "rubber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubber_player" ADD CONSTRAINT "rubber_player_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_confirmation" ADD CONSTRAINT "result_confirmation_match_result_id_fkey" FOREIGN KEY ("match_result_id") REFERENCES "match_result"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correction_request" ADD CONSTRAINT "correction_request_match_result_id_fkey" FOREIGN KEY ("match_result_id") REFERENCES "match_result"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eligibility_rule" ADD CONSTRAINT "eligibility_rule_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
