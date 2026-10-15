-- Back to a plain, immediately checked unique index on user_role.user_id.
-- The deferred constraint from 20261007000100 made Postgres reject every
-- ON CONFLICT (user_id), so prisma.userRole.upsert({ where: { userId } }) failed
-- whether or not the user already had a role. It was deferred only because
-- `seed:competition --sync` moved role rows between users; role codes now
-- follow the user (USR005 -> UR005), so a row never changes user_id.
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_user_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "user_role_user_id_key" ON "user_role"("user_id");
