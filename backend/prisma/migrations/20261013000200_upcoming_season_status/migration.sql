-- A season that has been announced but has not started yet. The status alone
-- does not allow or block anything, such as entering teams.
ALTER TYPE "SeasonStatus" ADD VALUE 'UPCOMING' BEFORE 'ACTIVE';
