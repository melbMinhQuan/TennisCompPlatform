# Matching players from incomplete names

Scoresheets do not always record a player's full name. A surname may be missing ("Josh"), the
first name may be a short form ("Josh" for "Joshua", "Bill" for "William") or an initial
("J. Smith"). The same person can also end up registered twice under two forms of their name.

`backend/src/player-matching/` handles both, using what else the record says: the team, the
match date and, when known, the date of birth.

**Status:** this is the engine and its tests. Nothing calls it yet, because the app has no way
to enter or import results so far. When that is built, import `PlayerMatchingModule` and inject
`PlayerMatchingService`.

---

## Which player a scoresheet means

`matchRecordedPlayer({ name, teamName or teamId, matchDate, dateOfBirth? })`

1. **Team and season.** Only the roster of that team, in the season the match date falls in, is
   searched. A team name ignores case and spacing. Players of other teams are never considered.
2. **Name.** Each player on the roster is compared with the name as written:

   | Written | Fits the registered name when |
   | --- | --- |
   | First name | It is the same; an initial of it (`J`); the start of it, three letters or more (`Josh` for `Joshua`, either way round); or a nickname listed in [`nicknames.ts`](../backend/src/player-matching/nicknames.ts) (`Bill` for `William`) |
   | Surname | It is the same, or its initial (`S`). A missing surname fits anyone |
   | One word only | It fits as a first name, or it is the exact surname (`Smith`) |

   Case, accents and apostrophes are ignored (`O'Brien` = `obrien`). "Smith, Josh" is read
   surname first.
3. **Date of birth.** When it is given, a player born on a different day is ruled out.

| Players left | Result | What happens |
| --- | --- | --- |
| Exactly one | `matched`, with the reasons | The record belongs to that player |
| Two or more | `ambiguous`, with every candidate | An administrator chooses; the system never guesses |
| None | `unmatched`, with the reason | An administrator decides |

---

## Profiles that are probably one person

`findDuplicateProfiles()` pairs profiles that have the **same date of birth** and names that fit
each other by the rules above, such as "Josh Smith" and "Joshua Smith". It leaves out:

- profiles with different birthdays: the deliberate look-alikes in the test data (two Hiro
  Mitchells, two Amelia Lees) are different people;
- two profiles that played in the same match, who must be two people;
- pairs already in a `ProfileMergeRequest`, whatever its status, so a rejected pair stays rejected.

`raiseMergeRequests()` turns each new pair into a `PENDING` `ProfileMergeRequest`, with a note
saying why, for an administrator to confirm. **Nothing is ever merged automatically.**

From `backend/`:

```bash
npm run players:duplicates                        # list likely duplicates; writes nothing
npm run players:duplicates -- --create-requests   # also raise merge requests (only new pairs)
```

---

## Tests

| IDs | What | Run with |
| --- | --- | --- |
| MATCH-001 to MATCH-004 | Name rules, roster matching, never guessing, seasons | `npm test` ([player-matching.test.cjs](../backend/test/player-matching.test.cjs)) |
| DUP-001, DUP-002 | Duplicate scan and merge requests | `npm test` (same file) |
| MATCH-005, DUP-003 | Both on the real seeded data in Postgres, rolled back afterwards | `npm run test:database --workspace=backend` |

CI runs all of them on every push.

---

## Not handled yet

- **Emergency players** are not on a team's roster, so a scoresheet naming one comes back
  `unmatched` for an administrator.
- **Misspellings** ("Smyth" for "Smith") and a double surname written as one part do not fit.
- **Merging itself:** approving a merge request does not yet move the duplicate's records
  (rosters, matches, memberships, ratings) onto the kept profile.
