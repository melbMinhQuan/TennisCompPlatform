-- AlterTable
-- A player's email is the address on their login account, reached through
-- player.user_id. The column held a contact address meant to override it, but
-- nothing in the product sets one or treats it differently, so the only thing
-- it carried was fixture data for a feature that does not exist.
ALTER TABLE "player" DROP COLUMN "email";
