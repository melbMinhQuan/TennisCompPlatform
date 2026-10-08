-- Deferred to commit time on purpose, like rubber_set. `seed:competition --sync`
-- reassigns role rows between users in one transaction, and a user can briefly
-- hold the row they are getting before the one they are losing has moved on.
-- Checking at commit still guarantees every user ends with at most one role.
DROP INDEX "user_role_user_id_key";

ALTER TABLE "user_role"
  ADD CONSTRAINT "user_role_user_id_key"
  UNIQUE ("user_id") DEFERRABLE INITIALLY DEFERRED;
