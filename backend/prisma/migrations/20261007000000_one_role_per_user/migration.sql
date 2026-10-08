-- A user now holds exactly one role. Existing users with several roles keep the
-- most privileged one: RoleType is declared from most to least privileged, and
-- Postgres orders enum values by declaration.
DELETE FROM "user_role"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", ROW_NUMBER() OVER (
      PARTITION BY "user_id" ORDER BY "role_type", "created_at", "id"
    ) AS rn
    FROM "user_role"
  ) ranked
  WHERE rn > 1
);

-- CreateIndex
CREATE UNIQUE INDEX "user_role_user_id_key" ON "user_role"("user_id");
