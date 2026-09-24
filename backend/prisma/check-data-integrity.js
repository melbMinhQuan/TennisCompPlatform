/**
 * Structural check of competition_data.xlsx against schema.prisma:
 * unique ids, resolvable foreign keys, required fields, unique constraints,
 * enum members, and scores that agree with the rubber they belong to.
 *
 *   npm run data:check   (runs this and the requirements check)
 */
const REPO = require('node:path').resolve(__dirname, '../..')
const XLSX = require(`${REPO}/node_modules/xlsx`)
const fs = require('node:fs')
const path = require('node:path')

const file = process.argv[2] || path.join(__dirname, 'competition_data.xlsx')
const wb = XLSX.readFile(file)
const S = {}
for (const n of wb.SheetNames) S[n] = XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: '' })
const schema = fs.readFileSync(path.join(__dirname, 'schema.prisma'), 'utf8')

const problems = []
const bad = m => problems.push(m)
const ids = n => new Set((S[n] ?? []).map(r => r.id))

// ── unique ids
for (const [name, rows] of Object.entries(S)) {
  if (name === 'README' || !rows.length || !('id' in rows[0])) continue
  const list = rows.map(r => r.id)
  if (new Set(list).size !== list.length) bad(`${name}: duplicate id`)
}

// ── foreign keys
const FK = [
  ['Club', 'association_id', 'Association'], ['Venue', 'club_id', 'Club'],
  ['Competition', 'association_id', 'Association'], ['MatchFormat', 'competition_id', 'Competition'],
  ['EligibilityRule', 'competition_id', 'Competition'], ['Season', 'competition_id', 'Competition'],
  ['SectionGrade', 'season_id', 'Season'], ['Team', 'club_id', 'Club'],
  ['Team', 'section_id', 'SectionGrade'], ['Team', 'home_venue_id', 'Venue'],
  ['ClubMembership', 'player_id', 'Player'], ['ClubMembership', 'club_id', 'Club'],
  ['AssociationMembership', 'player_id', 'Player'], ['AssociationMembership', 'association_id', 'Association'],
  ['TeamPlayer', 'team_id', 'Team'], ['TeamPlayer', 'player_id', 'Player'],
  ['UtrLink', 'player_id', 'Player'], ['UtrRatingSnapshot', 'player_id', 'Player'],
  ['RankingCohort', 'association_id', 'Association'],
  ['RankingEntry', 'cohort_id', 'RankingCohort'], ['RankingEntry', 'player_id', 'Player'],
  ['Fixture', 'section_id', 'SectionGrade'], ['Fixture', 'home_team_id', 'Team'],
  ['Fixture', 'away_team_id', 'Team'], ['Fixture', 'venue_id', 'Venue'],
  ['FixtureScheduleChange', 'fixture_id', 'Fixture'],
  ['FixtureScheduleChange', 'previous_venue_id', 'Venue'], ['FixtureScheduleChange', 'new_venue_id', 'Venue'],
  ['MatchResult', 'fixture_id', 'Fixture'], ['ResultConfirmation', 'match_result_id', 'MatchResult'],
  ['CorrectionRequest', 'match_result_id', 'MatchResult'],
  ['Rubber', 'match_result_id', 'MatchResult'], ['Rubber', 'match_format_id', 'MatchFormat'],
  ['RubberSet', 'rubber_id', 'Rubber'], ['RubberPlayer', 'rubber_id', 'Rubber'],
  ['RubberPlayer', 'player_id', 'Player'],
  ['LadderEntry', 'section_id', 'SectionGrade'], ['LadderEntry', 'team_id', 'Team'],
  ['PlayerStanding', 'section_id', 'SectionGrade'], ['PlayerStanding', 'player_id', 'Player'],
  ['PlayerAward', 'player_id', 'Player'], ['PlayerAward', 'competition_id', 'Competition'],
  ['PlayerAward', 'season_id', 'Season'], ['PlayerAward', 'team_id', 'Team'],
  ['ProfileMergeRequest', 'player_a_id', 'Player'], ['ProfileMergeRequest', 'player_b_id', 'Player'],
  ['ProfileMergeRequest', 'requesting_association_id', 'Association'],
  ['UserRole', 'association_id', 'Association'], ['UserRole', 'club_id', 'Club'],
  ['UserRole', 'team_id', 'Team'], ['UserRole', 'competition_id', 'Competition'],
]
for (const [sheet, col, target] of FK) {
  const valid = ids(target)
  for (const row of S[sheet] ?? []) {
    if (row[col] !== '' && !valid.has(row[col])) bad(`${sheet}.${col} = "${row[col]}" not in ${target}`)
  }
}

// ── _lookup_user_email must name a row in the User sheet
const accounts = new Set(S.User.map(u => u.email))
for (const sheet of ['Player', 'Notification', 'UserRole']) {
  for (const r of S[sheet]) {
    if (!accounts.has(r._lookup_user_email)) bad(`${sheet}: no User row for ${r._lookup_user_email}`)
  }
}

// ── enum members, read from schema.prisma
const enums = {}
for (const m of schema.matchAll(/enum\s+(\w+)\s*\{([^}]*)\}/g)) {
  enums[m[1]] = m[2].split('\n').map(l => l.replace(/\/\/.*/, '').trim()).filter(Boolean)
}
const ENUM_COLS = [
  ['User', 'status', 'UserStatus'], ['Association', 'status', 'AssociationStatus'],
  ['Club', 'status', 'ClubStatus'], ['Venue', 'status', 'VenueStatus'],
  ['Competition', 'status', 'CompetitionStatus'], ['Season', 'status', 'SeasonStatus'],
  ['SectionGrade', 'gender', 'Gender'], ['Player', 'gender', 'Gender'], ['Player', 'status', 'PlayerStatus'],
  ['ClubMembership', 'status', 'MembershipStatus'], ['AssociationMembership', 'status', 'MembershipStatus'],
  ['TeamPlayer', 'status', 'TeamPlayerStatus'], ['UtrLink', 'status', 'LinkStatus'],
  ['UtrRatingSnapshot', 'discipline', 'Discipline'], ['RankingCohort', 'discipline', 'Discipline'],
  ['Fixture', 'status', 'FixtureStatus'], ['FixtureScheduleChange', 'change_type', 'ScheduleChangeType'],
  ['MatchResult', 'status', 'ResultStatus'], ['ResultConfirmation', 'status', 'ConfirmationStatus'],
  ['CorrectionRequest', 'status', 'CorrectionStatus'], ['ProfileMergeRequest', 'status', 'MergeStatus'],
  ['Rubber', 'rubber_type', 'RubberType'], ['Rubber', 'winner_side', 'Side'],
  ['Rubber', 'outcome_type', 'RubberOutcome'], ['RubberPlayer', 'side', 'Side'],
  ['PlayerAward', 'award_type', 'AwardType'], ['Notification', 'type', 'NotificationType'],
  ['Notification', 'target_type', 'NotificationTargetType'], ['Notification', 'channel', 'NotificationChannel'],
  ['Notification', 'delivery_status', 'NotificationDeliveryStatus'],
  ['UserRole', 'role_type', 'RoleType'], ['UserRole', 'context_type', 'ContextType'],
]
for (const [sheet, col, name] of ENUM_COLS) {
  const allowed = enums[name]
  if (!allowed) { bad(`schema.prisma has no enum ${name}`); continue }
  for (const r of S[sheet] ?? []) {
    if (r[col] !== '' && !allowed.includes(String(r[col]))) bad(`${sheet}.${col} = "${r[col]}" is not a ${name}`)
  }
}

// ── NOT NULL columns
const REQUIRED = [
  ['User', ['email', 'password_hash', 'status']],
  ['Association', ['name', 'status']], ['Club', ['association_id', 'name', 'status']],
  ['Venue', ['name', 'time_zone', 'status']], ['Competition', ['association_id', 'name', 'status']],
  ['MatchFormat', ['competition_id', 'name']], ['EligibilityRule', ['competition_id', 'rule_type']],
  ['Season', ['competition_id', 'status']], ['SectionGrade', ['season_id', 'name']],
  ['Team', ['club_id', 'section_id', 'name']],
  ['Player', ['first_name', 'last_name', 'date_of_birth', 'gender', 'status']],
  ['ClubMembership', ['player_id', 'club_id', 'status']],
  ['TeamPlayer', ['team_id', 'player_id', 'status']],
  ['UtrRatingSnapshot', ['player_id', 'rating', 'recorded_at']],
  ['RankingEntry', ['cohort_id', 'player_id', 'rank', 'as_of']],
  ['Fixture', ['section_id', 'home_team_id', 'away_team_id', 'status']],
  ['FixtureScheduleChange', ['fixture_id', 'change_type', 'changed_at']],
  ['MatchResult', ['fixture_id', 'status']], ['Rubber', ['match_result_id', 'rubber_type']],
  ['RubberPlayer', ['rubber_id', 'player_id', 'side']],
  ['LadderEntry', ['section_id', 'team_id', 'calculated_at']],
  ['PlayerStanding', ['section_id', 'player_id', 'calculated_at']],
  ['PlayerAward', ['player_id', 'award_type', 'title']],
  ['Notification', ['_lookup_user_email', 'type', 'title', 'message', 'channel', 'delivery_status', 'created_at']],
  ['UserRole', ['_lookup_user_email', 'role_type', 'context_type']],
  ['AuditLog', ['entity_type', 'action', 'changed_at']],
]
for (const [sheet, cols] of REQUIRED) {
  for (const r of S[sheet] ?? []) {
    for (const c of cols) if (r[c] === '' || r[c] === undefined) bad(`${sheet}.${c} blank on ${r.id}`)
  }
}

// ── @@unique constraints
const UNIQUE = [
  ['User', ['email']], ['Player', ['_lookup_user_email']],
  ['ClubMembership', ['player_id', 'club_id']], ['AssociationMembership', ['player_id', 'association_id']],
  ['TeamPlayer', ['team_id', 'player_id']], ['UtrLink', ['player_id']],
  ['UtrRatingSnapshot', ['player_id', 'discipline', 'recorded_at']],
  ['RankingEntry', ['cohort_id', 'player_id', 'as_of']],
  ['LadderEntry', ['section_id', 'team_id']], ['PlayerStanding', ['section_id', 'player_id']],
  ['MatchResult', ['fixture_id']],
]
for (const [sheet, cols] of UNIQUE) {
  const seen = new Set()
  for (const r of S[sheet] ?? []) {
    const key = cols.map(c => r[c]).join('|')
    if (seen.has(key)) bad(`${sheet}: duplicate ${cols.join('+')} = ${key}`)
    seen.add(key)
  }
}

// ── a completed rubber's winner comes from its sets, so winner_side stays blank
const setsOf = new Map()
for (const s of S.RubberSet) {
  if (!setsOf.has(s.rubber_id)) setsOf.set(s.rubber_id, [])
  setsOf.get(s.rubber_id).push(s)
}
const winnerOf = r => {
  if (r.winner_side) return r.winner_side
  const sets = setsOf.get(r.id) ?? []
  const h = sets.filter(s => s.home_games > s.away_games).length
  return h > sets.length - h ? 'HOME' : 'AWAY'
}
for (const r of S.Rubber) {
  const sets = setsOf.get(r.id) ?? []
  if (r.outcome_type === 'COMPLETED') {
    if (r.winner_side !== '') bad(`${r.id}: completed rubber stores winner_side; it should be derived`)
    if (!sets.length) bad(`${r.id}: completed rubber with no sets`)
  }
  if (['WALKOVER', 'FORFEIT'].includes(r.outcome_type)) {
    if (sets.length) bad(`${r.id}: ${r.outcome_type} should have no sets`)
    if (!r.winner_side) bad(`${r.id}: ${r.outcome_type} needs an explicit winner_side`)
  }
  for (const s of sets) if (s.home_games === s.away_games) bad(`${s.id}: tied set`)
  const want = r.rubber_type === 'SINGLES' ? 1 : 2
  for (const side of ['HOME', 'AWAY']) {
    const n = S.RubberPlayer.filter(p => p.rubber_id === r.id && p.side === side).length
    if (n !== want) bad(`${r.id}: ${side} has ${n} players, expected ${want}`)
  }
}

// ── result totals match the rubbers
const rubbersOf = new Map()
for (const r of S.Rubber) {
  if (!rubbersOf.has(r.match_result_id)) rubbersOf.set(r.match_result_id, [])
  rubbersOf.get(r.match_result_id).push(r)
}
for (const res of S.MatchResult) {
  const rs = rubbersOf.get(res.id) ?? []
  const h = rs.filter(r => winnerOf(r) === 'HOME').length
  const a = rs.length - h
  if (h !== res.home_rubbers || a !== res.away_rubbers) bad(`${res.id}: rubbers ${h}-${a} != ${res.home_rubbers}-${res.away_rubbers}`)
  const expected = h > a ? 'HOME_WIN' : h < a ? 'AWAY_WIN' : 'DRAW'
  if (res.outcome !== expected) bad(`${res.id}: outcome ${res.outcome} != ${expected}`)
}

// ── only completed fixtures carry a result
for (const f of S.Fixture) {
  const n = S.MatchResult.filter(m => m.fixture_id === f.id).length
  if (f.status === 'COMPLETED' && n !== 1) bad(`${f.id}: COMPLETED with ${n} results`)
  if (f.status !== 'COMPLETED' && n !== 0) bad(`${f.id}: ${f.status} but has a result`)
  if (f.home_team_id === f.away_team_id) bad(`${f.id}: team plays itself`)
}

// ── ladder recount
for (const sec of S.SectionGrade) {
  const entries = S.LadderEntry.filter(l => l.section_id === sec.id)
  if (!entries.length) continue
  for (const e of entries) {
    let played = 0, won = 0, rf = 0, points = 0
    for (const f of S.Fixture.filter(x => x.section_id === sec.id && x.is_finals !== true)) {
      const res = S.MatchResult.find(m => m.fixture_id === f.id)
      // Only a confirmed result moves the ladder; one still awaiting
      // confirmation or under correction must not.
      if (!res || res.status !== 'FINALISED') continue
      const home = f.home_team_id === e.team_id, away = f.away_team_id === e.team_id
      if (!home && !away) continue
      played++
      const mine = home ? res.home_rubbers : res.away_rubbers
      rf += mine; points += mine
      if ((res.outcome === 'HOME_WIN' ? f.home_team_id : f.away_team_id) === e.team_id) { won++; points += 4 }
    }
    if (played !== e.played) bad(`${e.id}: played ${e.played} != ${played}`)
    if (won !== e.won) bad(`${e.id}: won ${e.won} != ${won}`)
    if (rf !== e.rubbers_for) bad(`${e.id}: rubbers_for ${e.rubbers_for} != ${rf}`)
    if (points !== e.points) bad(`${e.id}: points ${e.points} != ${points}`)
    if (e.won + e.lost + e.drawn !== e.played) bad(`${e.id}: W/L/D != played`)
  }
  const pos = entries.map(e => e.position).sort((a, b) => a - b)
  if (pos.join() !== entries.map((_, i) => i + 1).join()) bad(`${sec.id}: ladder positions not 1..${entries.length}`)
}

// ── players only appear for a team they are registered to, unless they are an
// emergency, who by definition is not on the roster
const registered = new Set(S.TeamPlayer.map(t => `${t.team_id}|${t.player_id}`))
for (const rp of S.RubberPlayer) {
  if (rp.is_emergency === true) continue
  const r = S.Rubber.find(x => x.id === rp.rubber_id)
  const res = S.MatchResult.find(x => x.id === r.match_result_id)
  const f = S.Fixture.find(x => x.id === res.fixture_id)
  const team = rp.side === 'HOME' ? f.home_team_id : f.away_team_id
  if (!registered.has(`${team}|${rp.player_id}`)) bad(`${rp.id}: ${rp.player_id} not registered to ${team}`)
}

console.log(problems.length ? `INTEGRITY: ${problems.length} problem(s)` : 'Integrity: all checks passed')
for (const p of problems.slice(0, 25)) console.log('  x ' + p)
process.exitCode = problems.length ? 1 : 0
