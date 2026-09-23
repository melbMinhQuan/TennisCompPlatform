/**
 * Audits competition_data.xlsx against three independent sources of truth:
 *   1. schema.prisma  - enum members, required scalars, unique constraints
 *   2. the Waverley Tennis match formats PDF - section size, rounds, courts, finals
 *   3. the dashboard mockup - every widget must be populatable for a real player
 */
const REPO = require('node:path').resolve(__dirname, '../..')
const XLSX = require(`${REPO}/node_modules/xlsx`)
const fs = require('node:fs')

const wb = XLSX.readFile(`${REPO}/backend/prisma/competition_data.xlsx`)
const S = {}
for (const n of wb.SheetNames) S[n] = XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: '' })

const schema = fs.readFileSync(`${REPO}/backend/prisma/schema.prisma`, 'utf8')
const issues = []
const warnings = []
const bad = m => issues.push(m)
const warn = m => warnings.push(m)

// ---------------------------------------------------------- parse schema.prisma
const enums = {}
for (const m of schema.matchAll(/enum\s+(\w+)\s*\{([^}]*)\}/g)) {
  enums[m[1]] = m[2].split('\n').map(l => l.replace(/\/\/.*/, '').trim()).filter(Boolean)
}

// sheet column -> prisma enum name
const ENUM_COLS = [
  ['Association', 'status', 'AssociationStatus'], ['Club', 'status', 'ClubStatus'],
  ['Venue', 'status', 'VenueStatus'], ['Competition', 'status', 'CompetitionStatus'],
  ['Season', 'status', 'SeasonStatus'], ['SectionGrade', 'gender', 'Gender'],
  ['Player', 'gender', 'Gender'], ['Player', 'status', 'PlayerStatus'],
  ['ClubMembership', 'status', 'MembershipStatus'], ['AssociationMembership', 'status', 'MembershipStatus'],
  ['TeamPlayer', 'status', 'TeamPlayerStatus'], ['UtrLink', 'status', 'LinkStatus'],
  ['UtrRatingSnapshot', 'discipline', 'Discipline'], ['RankingCohort', 'discipline', 'Discipline'],
  ['Fixture', 'status', 'FixtureStatus'], ['FixtureScheduleChange', 'change_type', 'ScheduleChangeType'],
  ['MatchResult', 'status', 'ResultStatus'], ['Rubber', 'rubber_type', 'RubberType'],
  ['Rubber', 'winner_side', 'Side'], ['Rubber', 'outcome_type', 'RubberOutcome'],
  ['RubberPlayer', 'side', 'Side'], ['PlayerAward', 'award_type', 'AwardType'],
  ['Notification', 'type', 'NotificationType'], ['Notification', 'target_type', 'NotificationTargetType'],
  ['Notification', 'channel', 'NotificationChannel'], ['Notification', 'delivery_status', 'NotificationDeliveryStatus'],
  ['UserRole', 'role_type', 'RoleType'], ['UserRole', 'context_type', 'ContextType'],
]
for (const [sheet, col, enumName] of ENUM_COLS) {
  const allowed = enums[enumName]
  if (!allowed) { bad(`schema has no enum ${enumName}`); continue }
  for (const row of S[sheet]) {
    const v = row[col]
    if (v === '') continue // blank = NULL
    if (!allowed.includes(String(v))) bad(`${sheet}.${col} = "${v}" is not a ${enumName} member`)
  }
}

// Columns the schema declares NOT NULL must never be blank.
const REQUIRED = [
  ['Association', ['name', 'status']], ['Club', ['association_id', 'name', 'status']],
  ['Venue', ['name', 'time_zone', 'status']], ['Competition', ['association_id', 'name', 'status']],
  ['MatchFormat', ['competition_id', 'name']], ['EligibilityRule', ['competition_id', 'rule_type']],
  ['Season', ['competition_id', 'status']], ['SectionGrade', ['season_id', 'name']],
  ['Team', ['club_id', 'section_id', 'name']],
  ['Player', ['first_name', 'last_name', 'date_of_birth', 'gender', 'status']],
  ['ClubMembership', ['player_id', 'club_id', 'status']],
  ['AssociationMembership', ['player_id', 'association_id', 'status']],
  ['TeamPlayer', ['team_id', 'player_id', 'status']], ['UtrLink', ['player_id', 'status']],
  ['UtrRatingSnapshot', ['player_id', 'rating', 'recorded_at']],
  ['RankingCohort', ['name']], ['RankingEntry', ['cohort_id', 'player_id', 'rank', 'as_of']],
  ['Fixture', ['section_id', 'home_team_id', 'away_team_id', 'status']],
  ['FixtureScheduleChange', ['fixture_id', 'change_type']],
  ['MatchResult', ['fixture_id', 'status']], ['Rubber', ['match_result_id', 'rubber_type']],
  ['RubberSet', ['rubber_id']], ['RubberPlayer', ['rubber_id', 'player_id', 'side']],
  ['LadderEntry', ['section_id', 'team_id', 'calculated_at']],
  ['PlayerStanding', ['section_id', 'player_id', 'calculated_at']],
  ['PlayerAward', ['player_id', 'award_type', 'title']],
  ['Notification', ['_lookup_user_email', 'type', 'title', 'message', 'channel', 'delivery_status', 'created_at']],
  ['UserRole', ['_lookup_user_email', 'role_type', 'context_type']],
]
for (const [sheet, cols] of REQUIRED) {
  for (const row of S[sheet]) {
    for (const c of cols) if (row[c] === '' || row[c] === undefined) bad(`${sheet}.${c} is blank on row id=${row.id}`)
  }
}

// @@unique constraints declared in the schema
const UNIQUE = [
  ['ClubMembership', ['player_id', 'club_id']], ['AssociationMembership', ['player_id', 'association_id']],
  ['TeamPlayer', ['team_id', 'player_id']], ['UtrLink', ['player_id']],
  ['UtrRatingSnapshot', ['player_id', 'discipline', 'recorded_at']],
  ['RankingEntry', ['cohort_id', 'player_id', 'as_of']],
  ['LadderEntry', ['section_id', 'team_id']], ['PlayerStanding', ['section_id', 'player_id']],
  ['MatchResult', ['fixture_id']], ['Player', ['_lookup_user_email']],
]
for (const [sheet, cols] of UNIQUE) {
  const seen = new Set()
  for (const row of S[sheet]) {
    const key = cols.map(c => row[c]).join('|')
    if (seen.has(key)) bad(`${sheet}: duplicate ${cols.join('+')} = ${key}`)
    seen.add(key)
  }
}

// ------------------------------------------------- PDF rules: Weekend Senior
// "Either 6 or 8 team section with 14 rounds of matches per season + finals"
for (const sec of S.SectionGrade.filter(s => ['SEC01', 'SEC02'].includes(s.id))) {
  if (![6, 8].includes(sec.team_count)) bad(`${sec.id}: team_count ${sec.team_count}, PDF allows 6 or 8`)
  const actual = S.Team.filter(t => t.section_id === sec.id).length
  if (actual !== sec.team_count) bad(`${sec.id}: team_count says ${sec.team_count} but ${actual} teams exist`)
  const regular = S.Fixture.filter(f => f.section_id === sec.id && f.is_finals !== true)
  const rounds = new Set(regular.map(f => f.round_number))
  if (rounds.size !== 14) bad(`${sec.id}: ${rounds.size} home-and-away rounds, PDF says 14`)
  // Every team plays exactly once per round.
  for (const r of rounds) {
    const inRound = regular.filter(f => f.round_number === r)
    const sides = inRound.flatMap(f => [f.home_team_id, f.away_team_id])
    if (new Set(sides).size !== sides.length) bad(`${sec.id} round ${r}: a team is scheduled twice`)
    if (sides.length !== sec.team_count) bad(`${sec.id} round ${r}: ${sides.length} team slots, expected ${sec.team_count}`)
  }
  // Each pairing should meet exactly twice over 14 rounds (home and away).
  const meetings = new Map()
  for (const f of regular) {
    const k = [f.home_team_id, f.away_team_id].sort().join('|')
    meetings.set(k, (meetings.get(k) || 0) + 1)
  }
  for (const [k, n] of meetings) if (n !== 2) bad(`${sec.id}: ${k} meet ${n} times, expected 2`)
  // Home/away should balance across the double round robin.
  for (const t of S.Team.filter(x => x.section_id === sec.id)) {
    const h = regular.filter(f => f.home_team_id === t.id).length
    const a = regular.filter(f => f.away_team_id === t.id).length
    if (h !== a) warn(`${t.id}: ${h} home vs ${a} away fixtures`)
  }
}

// "Matches commence at 1:00 p.m." and Weekend Senior plays Saturday pm
for (const f of S.Fixture) {
  if (f.status === 'POSTPONED') {
    // A postponed fixture has had its date and time cleared, and must say why.
    if (f.schedule_date !== '' || f.schedule_time !== '') bad(`${f.id}: POSTPONED but still carries a date/time`)
    if (!S.FixtureScheduleChange.some(c => c.fixture_id === f.id && c.change_type === 'POSTPONED')) {
      bad(`${f.id}: POSTPONED with no matching schedule-change row`)
    }
    continue
  }
  if (f.schedule_date === '' || f.schedule_time === '') bad(`${f.id}: ${f.status} fixture with no date/time`)
  if (f.schedule_time !== '13:00') bad(`${f.id}: start ${f.schedule_time}, PDF says 1:00 p.m.`)
  const dow = new Date(`${f.schedule_date}T00:00:00Z`).getUTCDay()
  if (dow !== 6) {
    const moved = S.FixtureScheduleChange.some(c => c.fixture_id === f.id && c.change_type === 'DATE_TIME_CHANGED')
    if (!moved) bad(`${f.id}: ${f.schedule_date} is not a Saturday and has no reschedule row`)
  }
}

// "Min courts required: 1 or 2 (2 for finals)" - a venue cannot overbook itself
const courts = Object.fromEntries(S.Venue.map(v => [v.id, v.court_count || 0]))
const byVenueDate = new Map()
for (const f of S.Fixture) {
  if (!f.schedule_date) continue // postponed: no date to clash on yet
  const k = `${f.venue_id}|${f.schedule_date}`
  byVenueDate.set(k, (byVenueDate.get(k) || 0) + 1)
}
for (const [k, n] of byVenueDate) {
  const [venueId] = k.split('|')
  const needed = n * 2 // MF01 needs 2 courts per fixture
  if (needed > courts[venueId]) bad(`${k}: ${n} fixtures need ${needed} courts, venue has ${courts[venueId]}`)
}

// "Players must play a minimum of 3 times during the season to play finals"
const appearances = new Map()
for (const rp of S.RubberPlayer) appearances.set(rp.player_id, (appearances.get(rp.player_id) || 0) + 1)
const rostered = S.TeamPlayer.filter(tp => tp.status === 'ACTIVE')
const ineligible = rostered.filter(tp => (appearances.get(tp.player_id) || 0) < 3)
if (ineligible.length) warn(`${ineligible.length} rostered players have fewer than 3 matches (finals-ineligible under ELIG01)`)

// Finals must be flagged, labelled and after the last home-and-away round
const lastRound = Math.max(...S.Fixture.filter(f => f.is_finals !== true).map(f => f.schedule_date.replace(/-/g, '') | 0))
for (const f of S.Fixture.filter(x => x.is_finals === true)) {
  if (!f.round_label) bad(`${f.id}: finals fixture without a round_label`)
  if ((f.schedule_date.replace(/-/g, '') | 0) <= lastRound) bad(`${f.id}: finals scheduled before the last round`)
  if (courts[f.venue_id] < 2) bad(`${f.id}: finals venue has fewer than the 2 required courts`)
}

// ---------------------------------------------- age / grade consistency
const ageOn = (dob, on) => {
  const [y, m, d] = dob.split('-').map(Number); const [Y, M, D] = on.split('-').map(Number)
  return Y - y - (M < m || (M === m && D < d) ? 1 : 0)
}
for (const sec of S.SectionGrade.filter(s => ['SEC01', 'SEC02'].includes(s.id))) {
  for (const t of S.Team.filter(x => x.section_id === sec.id)) {
    for (const tp of S.TeamPlayer.filter(x => x.team_id === t.id)) {
      const p = S.Player.find(x => x.id === tp.player_id)
      const age = ageOn(p.date_of_birth, '2026-09-22')
      if (sec.min_age && age < sec.min_age) bad(`${p.id}: age ${age} below section min ${sec.min_age}`)
      if (p.is_junior === true) bad(`${p.id}: junior in an adult section`)
    }
  }
}

// ------------------------------------------- dashboard mockup: can we fill it?
const sample = S.Player[0]
const tp = S.TeamPlayer.find(x => x.player_id === sample.id)
const team = S.Team.find(t => t.id === tp.team_id)
const section = S.SectionGrade.find(s => s.id === team.section_id)
const club = S.Club.find(c => c.id === team.club_id)
const myRubbers = S.RubberPlayer.filter(rp => rp.player_id === sample.id)
const played = myRubbers.length
const won = myRubbers.filter(rp => S.Rubber.find(r => r.id === rp.rubber_id).winner_side === rp.side).length
const singlesSnaps = S.UtrRatingSnapshot.filter(s => s.player_id === sample.id && s.discipline === 'SINGLES')
const rank = S.RankingEntry.find(r => r.player_id === sample.id && r.cohort_id === 'COH01')
const notes = S.Notification.filter(n => n._lookup_user_email === sample._lookup_user_email && n.channel === 'IN_APP')
const titles = S.PlayerAward.filter(a => a.player_id === sample.id && a.award_type === 'SECTION_WINNER')
const upcoming = S.Fixture
  .filter(f => [f.home_team_id, f.away_team_id].includes(team.id) && f.schedule_date >= '2026-09-22')
  .sort((a, b) => a.schedule_date.localeCompare(b.schedule_date))

const widgets = {
  'Avatar': sample.avatar_url || '(null - renders initials)',
  'Name / Status': `${sample.first_name} ${sample.last_name} / ${sample.status}`,
  'Age / Sex': `${ageOn(sample.date_of_birth, '2026-09-22')} / ${sample.gender}`,
  // Mirrors dashboard.service.ts: `player.email ?? loginEmail`
  'Email / Phone': `${sample.email || sample._lookup_user_email + ' (fallback)'} / ${sample.phone}`,
  'Club / Association / Team': `${club.name} / Waverley Tennis / ${team.name}`,
  'UTR score tiles (3)': singlesSnaps.slice(-3).map(s => s.rating).reverse().join(', '),
  'UTR percentile': rank ? `rank ${rank.rank}, Top ${(100 - Number(rank.percentile_rank)).toFixed(0)}%` : 'MISSING',
  'Notifications (unread)': `${notes.length} total, ${notes.filter(n => n.read_at === '').length} unread`,
  'Recent Activity': `${played} rubbers, latest vs opponents resolvable`,
  'Career: Matches / Win%': `${played} / ${played ? (won / played * 100).toFixed(1) : 'n/a'}%`,
  'Career: Titles': titles.length,
  'Upcoming (next)': upcoming.length ? `${upcoming[0].schedule_date} ${upcoming[0].round_label || 'Round ' + upcoming[0].round_number}` : 'MISSING',
  'Upcoming venue': upcoming.length ? S.Venue.find(v => v.id === upcoming[0].venue_id).name : 'MISSING',
  'Rescheduled badge': S.FixtureScheduleChange.some(c => upcoming.some(f => f.id === c.fixture_id)),
  'Standings & Rankings': S.PlayerStanding.find(s => s.player_id === sample.id) ? 'present' : 'MISSING',
}
for (const [k, v] of Object.entries(widgets)) if (String(v).includes('MISSING')) bad(`dashboard widget "${k}" cannot be filled`)

// ------------------------------------- coverage: which tables got no data at all
const MODELS = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map(m => m[1])
const empty = MODELS.filter(m => !wb.SheetNames.includes(m))
if (empty.length) warn(`no sheet at all for: ${empty.join(', ')}`)

// User story: "multiple competitions running concurrently, with their own
// seasons, sections, teams, fixtures, results and rules"
for (const c of S.Competition) {
  const seasons = S.Season.filter(s => s.competition_id === c.id)
  const sections = S.SectionGrade.filter(s => seasons.some(x => x.id === s.season_id))
  const fixtures = S.Fixture.filter(f => sections.some(x => x.id === f.section_id))
  if (!fixtures.length) warn(`competition "${c.name}" has ${seasons.length} season(s) but 0 fixtures`)
}
// Seasons that carry awards but no matches
for (const s of S.Season) {
  const sections = S.SectionGrade.filter(x => x.season_id === s.id)
  const fx = S.Fixture.filter(f => sections.some(x => x.id === f.section_id)).length
  const aw = S.PlayerAward.filter(a => a.season_id === s.id).length
  if (aw && !fx) warn(`season ${s.id} (${s.season_type} ${s.year}) has ${aw} awards but 0 fixtures`)
}

// User story: "record important administrative changes, including who made the
// change and when" - these audit columns are all blank in the generated data.
for (const [sheet, cols] of [['MatchResult', ['entered_by', 'finalised_by']], ['FixtureScheduleChange', ['changed_by']]]) {
  for (const c of cols) {
    const filled = S[sheet].filter(r => r[c] !== '').length
    if (!filled) warn(`${sheet}.${c} is blank on all ${S[sheet].length} rows (no "who did it" trail)`)
  }
}

// Percentile sanity: best player should read as a low "Top n%", worst as high.
const singlesRanks = S.RankingEntry.filter(r => r.cohort_id === 'COH01').sort((a, b) => a.rank - b.rank)
const top = singlesRanks[0], bottom = singlesRanks[singlesRanks.length - 1]
if (Number(top.percentile_rank) < 90) bad(`top-ranked player has percentile ${top.percentile_rank}`)
if (Number(bottom.percentile_rank) !== 0) warn(`last-ranked player percentile is ${bottom.percentile_rank}, displays as "Top 100%"`)

// RankingEntry.rating must equal that player's newest snapshot for the discipline
for (const r of singlesRanks) {
  const snaps = S.UtrRatingSnapshot.filter(s => s.player_id === r.player_id && s.discipline === 'SINGLES')
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
  if (Math.abs(Number(snaps[snaps.length - 1].rating) - Number(r.rating)) > 0.001) {
    bad(`${r.player_id}: ranking rating ${r.rating} != newest snapshot ${snaps[snaps.length - 1].rating}`)
  }
}

// UTR values should sit in a plausible band for club players.
const ratings = S.UtrRatingSnapshot.map(s => Number(s.rating))
const lo = Math.min(...ratings), hi = Math.max(...ratings)
if (lo < 1 || hi > 16.5) bad(`UTR ratings out of range: ${lo.toFixed(2)}..${hi.toFixed(2)}`)

// Notification payloads: venue changes should name the venue the UI has to show
for (const n of S.Notification.filter(x => x.type === 'VENUE_CHANGED')) {
  const d = JSON.parse(n.details)
  if (/^VEN\d+$/.test(String(d.newVenue))) { warn('VENUE_CHANGED details carry venue ids, not names/objects'); break }
}

// ------------------------------------------------------------------- report
console.log(`Sample dashboard - ${sample.first_name} ${sample.last_name} <${sample.email}>  [${section.name}]`)
for (const [k, v] of Object.entries(widgets)) console.log(`   ${k.padEnd(28)} ${v}`)
console.log()
console.log(issues.length ? `ERRORS (${issues.length})` : 'No errors')
for (const p of issues.slice(0, 30)) console.log('  x ' + p)
console.log(warnings.length ? `\nWARNINGS (${warnings.length})` : '')
for (const p of warnings) console.log('  ! ' + p)
process.exitCode = issues.length ? 1 : 0
