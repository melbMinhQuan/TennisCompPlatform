-- CreateIndex
-- Deferred to commit time on purpose. `seed:competition --sync` rewrites whole
-- runs of sets in one transaction after the workbook is regenerated, and a row
-- on its way to (rubber, set) can briefly hold a pair another row has not
-- vacated yet. Checking per statement would reject that halfway state; checking
-- at commit still guarantees no rubber ends up with two of the same set number.
ALTER TABLE "rubber_set"
  ADD CONSTRAINT "rubber_set_rubber_id_set_number_key"
  UNIQUE ("rubber_id", "set_number") DEFERRABLE INITIALLY DEFERRED;
