-- A club or player inserted without a code gets the next free one: CLB13 after
-- CLB12, PLR113 after PLR112. It is done here rather than in the API so that every
-- way of adding one gets a code: the club administrator's Add player page, the
-- demo seed, a script. The competition seed writes the workbook's own codes, which
-- this leaves alone. Prisma has no syntax for triggers, so schema.prisma only
-- mentions it.
CREATE FUNCTION "assign_next_code"() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  prefix text := TG_ARGV[0];
  width int := TG_ARGV[1]::int;
  next_number int;
BEGIN
  IF NEW."code" IS NOT NULL THEN
    RETURN NEW;
  END IF;
  -- One code at a time per table, held until the transaction ends, so two
  -- inserts at once never pick the same number.
  PERFORM pg_advisory_xact_lock(hashtext('assign_next_code:' || TG_TABLE_NAME));
  -- Rows inserted earlier by the same statement are visible here, so a
  -- multi-row insert numbers its rows one after another.
  EXECUTE format(
    'SELECT coalesce(max(substring("code" FROM %L)::int), 0) + 1 FROM %I',
    '^' || prefix || '([0-9]+)$', TG_TABLE_NAME
  ) INTO next_number;
  -- Zero-padded to the workbook's width (PLR005), and wider once the numbers outgrow it.
  NEW."code" := prefix || lpad(next_number::text, greatest(width, length(next_number::text)), '0');
  RETURN NEW;
END
$$;

-- CreateTrigger
CREATE TRIGGER "club_assign_code" BEFORE INSERT ON "club"
  FOR EACH ROW EXECUTE FUNCTION "assign_next_code"('CLB', '2');

CREATE TRIGGER "player_assign_code" BEFORE INSERT ON "player"
  FOR EACH ROW EXECUTE FUNCTION "assign_next_code"('PLR', '3');
