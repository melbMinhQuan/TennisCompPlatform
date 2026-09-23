/**
 * Generates competition_data.xlsx: one sheet per database table.
 *
 * Reference data (competitions, match formats, eligibility rules) is transcribed
 * from "Competition match formats 28082026.pdf" (Waverley Tennis). Everything
 * else is synthetic but internally consistent: every foreign key resolves, every
 * score adds up to its rubber's winner, and every ladder row is counted from the
 * fixtures in this workbook rather than made up.
 *
 * IDs are short readable codes (CLB01, TEAM003, FIX0042) so the sheets can be
 * reviewed and edited by hand; the seed script maps each code to a UUID.
 */
const REPO = require('node:path').resolve(__dirname, '../..')
const XLSX = require(`${REPO}/node_modules/xlsx`)

const OUT = process.argv[2] || require('node:path').join(__dirname, 'competition_data.xlsx')
const SOURCE_XLSX = `${REPO}/backend/prisma/players_login_data.xlsx`
const TZ = 'Australia/Melbourne'
const TODAY = '2026-09-22'

// Deterministic PRNG so re-running produces an identical workbook.
let seed = 20260922
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
const pick = arr => arr[Math.floor(rnd() * arr.length)]
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1))
const pad = (n, w) => String(n).padStart(w, '0')

const day = (iso, offset) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}
const stamp = (iso, hhmm) => `${iso}T${hhmm}:00Z`

// ---------------------------------------------------------------- association
const ASSOC = { id: 'ASSOC01', name: 'Waverley Tennis', email: 'info@waverleytennis.example', address: '1 Sample Street, Glen Waverley VIC 3150', phone: '03 9000 0000', status: 'ACTIVE' }

// ---------------------------------------------------------------------- clubs
const CLUB_SUBURBS = [
  'Glen Waverley', 'Mount Waverley', 'Syndal', 'Pinewood', 'Wheelers Hill',
  'Mulgrave', 'Ashwood', 'Burwood', 'Chadstone', 'Notting Hill',
  'Forest Hill', 'Vermont South',
]
const clubs = CLUB_SUBURBS.map((suburb, i) => ({
  id: `CLB${pad(i + 1, 2)}`,
  association_id: ASSOC.id,
  name: `${suburb} Tennis Club`,
  address: `${int(1, 200)} ${pick(['Park', 'Station', 'High', 'Church', 'Reserve'])} Road, ${suburb} VIC ${3100 + i * 3}`,
  email: `admin@${suburb.toLowerCase().replace(/\s+/g, '')}tc.example`,
  phone: `03 9${int(100, 899)} ${int(1000, 9999)}`,
  status: 'ACTIVE',
}))

// --------------------------------------------------------------------- venues
const venues = clubs.map((c, i) => ({
  id: `VEN${pad(i + 1, 2)}`,
  club_id: c.id,
  name: `${c.name.replace(' Tennis Club', '')} Tennis Centre`,
  address: c.address,
  time_zone: TZ,
  court_count: [6, 8, 4, 10, 6, 8, 4, 6, 8, 4, 6, 10][i],
  status: 'ACTIVE',
}))
// Neutral finals venue, owned by no club.
venues.push({ id: 'VEN99', club_id: '', name: 'Waverley Tennis Regional Centre', address: '500 Springvale Road, Glen Waverley VIC 3150', time_zone: TZ, court_count: 16, status: 'ACTIVE' })

// --------------------------------------------------------------- competitions
// Straight from the PDF's "Competition" column.
const competitions = [
  { id: 'COMP01', association_id: ASSOC.id, name: 'Weekend Senior', type: 'Saturday pm. Winter and Summer Seasons', status: 'ACTIVE' },
  { id: 'COMP02', association_id: ASSOC.id, name: 'Weekend Junior', type: 'Saturday and Sunday am. Winter and Summer Seasons', status: 'ACTIVE' },
  { id: 'COMP03', association_id: ASSOC.id, name: 'Mid-Week Mens', type: 'Wednesday am. Autumn and Spring Seasons', status: 'ACTIVE' },
  { id: 'COMP04', association_id: ASSOC.id, name: 'Mid-Week Ladies', type: 'Thursday am. Autumn and Spring Seasons', status: 'ACTIVE' },
  { id: 'COMP05', association_id: ASSOC.id, name: 'Night Tennis', type: 'Monday and Tuesday nights. Autumn and Spring Seasons', status: 'ACTIVE' },
]

// -------------------------------------------------------------- match formats
// Every row transcribed from the PDF. rubber_count is the number of scored
// units the format produces (rubbers for rubber formats, sets for set formats).
const matchFormats = [
  { id: 'MF01', competition_id: 'COMP01', name: 'Singles/Doubles Rubbers (incl. Ron Horne Challenge Cup)', rubber_count: 3, singles_count: 2, doubles_count: 1, set_format: 'Best of 3 full sets', set_to_win: 2, tiebreak_rule: '12-pt tiebreak at 6 games all', match_tiebreak: '', winner_determined_by: 'Majority of rubbers; if tied then sets then games', allow_draw: false },
  { id: 'MF02', competition_id: 'COMP01', name: 'Doubles Rubbers', rubber_count: 4, singles_count: 0, doubles_count: 4, set_format: 'Best of 2 sets', set_to_win: 2, tiebreak_rule: '', match_tiebreak: 'If 1-1, match tiebreak to 10 (recorded as 7-6)', winner_determined_by: 'Majority of rubbers; if tied then sets then games', allow_draw: false },
  { id: 'MF03', competition_id: 'COMP02', name: "President's Cup", rubber_count: 3, singles_count: 2, doubles_count: 1, set_format: 'Best of 2 sets', set_to_win: 2, tiebreak_rule: '', match_tiebreak: 'If 1-1, match tiebreak to 10 (recorded as 7-6)', winner_determined_by: 'Majority of rubbers; if tied then sets then games', allow_draw: false },
  { id: 'MF04', competition_id: 'COMP02', name: 'Singles/Doubles Rubbers (Junior)', rubber_count: 3, singles_count: 2, doubles_count: 1, set_format: 'Best of 2 sets', set_to_win: 2, tiebreak_rule: '', match_tiebreak: 'If 1-1, match tiebreak to 10 (recorded as 7-6)', winner_determined_by: 'Majority of rubbers; if tied then sets then games', allow_draw: false },
  { id: 'MF05', competition_id: 'COMP02', name: 'Junior Triples', rubber_count: 6, singles_count: 3, doubles_count: 3, set_format: 'Six-game sets, played concurrently in rotation', set_to_win: 1, tiebreak_rule: 'Tiebreak at 6-all', match_tiebreak: '', winner_determined_by: 'Most sets; if tied then games', allow_draw: false },
  { id: 'MF06', competition_id: 'COMP02', name: 'Green Ball Series', rubber_count: 6, singles_count: 3, doubles_count: 3, set_format: 'Six-game sets, first team to 6 games wins', set_to_win: 1, tiebreak_rule: 'No tiebreaks are played in this competition', match_tiebreak: '', winner_determined_by: 'Most sets; if tied then games', allow_draw: false },
  { id: 'MF07', competition_id: 'COMP02', name: 'L Series', rubber_count: 1, singles_count: 0, doubles_count: 1, set_format: 'Doubles, best of 8 game sets', set_to_win: 1, tiebreak_rule: 'No tiebreaks; at 4-all the set is a draw', match_tiebreak: '', winner_determined_by: 'Most sets; if tied then games', allow_draw: true },
  { id: 'MF08', competition_id: 'COMP02', name: 'G Series', rubber_count: 6, singles_count: 3, doubles_count: 3, set_format: 'Six-game sets, played concurrently in rotation', set_to_win: 1, tiebreak_rule: 'Tiebreak at 6-all', match_tiebreak: '', winner_determined_by: 'Highest team on the ladder', allow_draw: false },
  { id: 'MF09', competition_id: 'COMP03', name: 'Doubles 8 Game Sets (Mens)', rubber_count: 6, singles_count: 0, doubles_count: 6, set_format: '8-game sets; each player partners every teammate once', set_to_win: 1, tiebreak_rule: 'Set tiebreak at 7-all; lowest section 6-game sets with 12-pt tiebreak at 6-all', match_tiebreak: '', winner_determined_by: 'Most sets; if tied then games', allow_draw: false },
  { id: 'MF10', competition_id: 'COMP04', name: 'Doubles 8 Game Sets (Ladies)', rubber_count: 6, singles_count: 0, doubles_count: 6, set_format: '8-game sets; each player partners every teammate once', set_to_win: 1, tiebreak_rule: 'Set tiebreak at 7 games all', match_tiebreak: '', winner_determined_by: 'Most sets; if tied then games', allow_draw: false },
  { id: 'MF11', competition_id: 'COMP05', name: 'Open Doubles Rubbers', rubber_count: 4, singles_count: 0, doubles_count: 4, set_format: 'Best of 2 sets', set_to_win: 2, tiebreak_rule: 'Set tiebreak at 7-all (recorded as 7-6)', match_tiebreak: '', winner_determined_by: 'Majority of rubbers; if tied then sets then games', allow_draw: false },
  { id: 'MF12', competition_id: 'COMP05', name: 'Open Triples', rubber_count: 6, singles_count: 3, doubles_count: 3, set_format: 'Six-game sets (singles and doubles)', set_to_win: 1, tiebreak_rule: 'Set tiebreak at 6-all', match_tiebreak: '', winner_determined_by: 'Most sets; if tied then games', allow_draw: false },
  { id: 'MF13', competition_id: 'COMP05', name: 'Open Singles/Doubles Rubbers', rubber_count: 3, singles_count: 2, doubles_count: 1, set_format: 'Singles six-game sets; doubles 8-game set', set_to_win: 1, tiebreak_rule: 'Singles tiebreak at 6-all; doubles tiebreak at 7 games all', match_tiebreak: '', winner_determined_by: 'Most sets; if tied then games', allow_draw: false },
]

// ---------------------------------------------------------- eligibility rules
// From the PDF's "Other rules", "Emergency players" and "Finals" columns.
const eligibilityRules = [
  { id: 'ELIG01', competition_id: 'COMP01', rule_type: 'FINALS_MIN_MATCHES', scope: 'Season', min_matches_played: 3, grade_restriction: '', description: 'Players must play a minimum of 3 times during the season to be eligible to play finals. Washout or heat-out matches are not included in qualifying requirements.' },
  { id: 'ELIG02', competition_id: 'COMP01', rule_type: 'SINGLES_PLAYER_ORDER', scope: 'Season', min_matches_played: '', grade_restriction: '', description: 'Players in singles must play in the order submitted when the team is entered. Player order may be changed once during the season, no later than round 10.' },
  { id: 'ELIG03', competition_id: 'COMP01', rule_type: 'EMERGENCY_PLAYER', scope: 'Competition', min_matches_played: '', grade_restriction: '', description: 'Emergency players must not strengthen the team or play for another club in the same competition. Use should be approved by the competition convenor/records secretary and recorded on the scoresheet with an (E).' },
  { id: 'ELIG04', competition_id: 'COMP02', rule_type: 'FINALS_SQUAD_SIZE', scope: 'Finals', min_matches_played: '', grade_restriction: 'Up to 5 players', description: 'Up to 5 players may play finals according to the scoresheet specified order.' },
  { id: 'ELIG05', competition_id: 'COMP02', rule_type: 'TEAM_NOMINATION', scope: 'Fixture', min_matches_played: '', grade_restriction: '', description: 'All players to be nominated prior to the commencement of the match and recorded on the scoresheet.' },
  { id: 'ELIG06', competition_id: 'COMP02', rule_type: 'AGE_RESTRICTION', scope: 'Competition', min_matches_played: '', grade_restriction: '18 and under', description: 'Weekend Junior is an 18-and-under competition. L Series runs 12-and-under and 10-and-under sections.' },
  { id: 'ELIG07', competition_id: 'COMP03', rule_type: 'EMERGENCY_PLAYER', scope: 'Competition', min_matches_played: '', grade_restriction: 'Tennis Victoria affiliated club member', description: 'This competition maintains a pool of emergency players who can be contacted to play for any club in the competition. They may play for more than one club but must be a member of a Tennis Victoria affiliated club.' },
  { id: 'ELIG08', competition_id: 'COMP03', rule_type: 'GENDER_RESTRICTION', scope: 'Competition', min_matches_played: '', grade_restriction: 'Adult men', description: 'Females may be included as listed team members, play as emergencies, and participate in finals subject to all other guidelines.' },
  { id: 'ELIG09', competition_id: 'COMP04', rule_type: 'FINALS_EMERGENCY_APPROVAL', scope: 'Finals', min_matches_played: 3, grade_restriction: '', description: 'A request must be made to the Records Secretary prior to using any pool emergencies in finals. Loan emergencies may only play finals for their own team if they have played more than 3 matches. Guest emergencies are not permitted in finals.' },
  { id: 'ELIG10', competition_id: 'COMP04', rule_type: 'GENDER_RESTRICTION', scope: 'Competition', min_matches_played: '', grade_restriction: 'Adult women', description: 'Adult women. Each team shall field 4 players, but 5 or 6 players can be used.' },
  { id: 'ELIG11', competition_id: 'COMP05', rule_type: 'TEAM_NOMINATION', scope: 'Fixture', min_matches_played: '', grade_restriction: '', description: 'All players to be nominated prior to the commencement of the match and recorded on the scoresheet.' },
]

// -------------------------------------------------------------------- seasons
// One live season carrying all the fixture data, plus two completed seasons
// that exist only to carry historical awards (no fixtures were generated
// for them - see the README sheet).
const seasons = [
  { id: 'SEA01', competition_id: 'COMP01', year: 2026, season_type: 'Winter', start_date: '2026-07-04', end_date: '2026-10-24', status: 'ACTIVE' },
  { id: 'SEA02', competition_id: 'COMP01', year: 2025, season_type: 'Summer', start_date: '2025-10-04', end_date: '2026-03-28', status: 'COMPLETED' },
  { id: 'SEA03', competition_id: 'COMP01', year: 2025, season_type: 'Winter', start_date: '2025-07-05', end_date: '2025-10-25', status: 'COMPLETED' },
]

// PDF: "Either 6 or 8 team section with 14 rounds of matches per season + finals"
const sections = [
  { id: 'SEC01', season_id: 'SEA01', name: 'Section 1', gender: '', age_group: 'Adult', min_age: 18, max_age: '', team_count: 8 },
  { id: 'SEC02', season_id: 'SEA01', name: 'Section 2', gender: '', age_group: 'Adult', min_age: 18, max_age: '', team_count: 8 },
  { id: 'SEC03', season_id: 'SEA02', name: 'Section 1', gender: '', age_group: 'Adult', min_age: 18, max_age: '', team_count: 8 },
  { id: 'SEC04', season_id: 'SEA03', name: 'Section 1', gender: '', age_group: 'Adult', min_age: 18, max_age: '', team_count: 8 },
]

// ---------------------------------------------------------------------- teams
// 16 live teams: each of the 12 clubs fields one, the 4 largest field a second.
const teams = []
const liveSections = ['SEC01', 'SEC02']
for (let s = 0; s < 2; s++) {
  for (let t = 0; t < 8; t++) {
    const clubIndex = (s * 8 + t) % clubs.length
    const club = clubs[clubIndex]
    const suffix = s === 0 ? 'A' : 'B'
    teams.push({
      id: `TEAM${pad(teams.length + 1, 3)}`,
      club_id: club.id,
      section_id: liveSections[s],
      home_venue_id: venues[clubIndex].id,
      name: `${club.name.replace(' Tennis Club', '')} ${suffix}`,
    })
  }
}

// -------------------------------------------------------------------- players
const source = XLSX.utils.sheet_to_json(XLSX.readFile(SOURCE_XLSX).Sheets.Players)
const players = source.map((row, i) => {
  const parts = String(row.full_name).trim().split(/\s+/)
  // Synthetic adult DOB and gender: never inferred from the person's name.
  const birthYear = 1979 + (i % 26)
  return {
    id: `PLR${pad(i + 1, 3)}`,
    _lookup_user_email: String(row.email).trim().toLowerCase(),
    first_name: parts[0],
    last_name: parts.slice(1).join(' ') || parts[0],
    date_of_birth: `${birthYear}-${pad((i % 12) + 1, 2)}-${pad((i % 28) + 1, 2)}`,
    gender: ['MALE', 'FEMALE', 'OTHER'][i % 3],
    // player.email is the contact address on the profile, which is not the
    // login address. dashboard.service.ts already resolves it as
    // `player.email ?? loginEmail`, so copying the login email in here would
    // be dead weight and would stop that fallback from ever being exercised.
    // Fill it only where a player genuinely uses a different address.
    email: i % 7 === 3 ? `${parts[0]}.${parts.slice(1).join('')}@contact.example`.toLowerCase() : '',
    phone: `04${pad(int(10, 99), 2)} ${pad(int(0, 999), 3)} ${pad(int(0, 999), 3)}`,
    avatar_url: '',
    is_junior: false,
    status: 'ACTIVE',
  }
})

// 6 players per team = 96; the remaining 4 are the competition emergency pool.
const ROSTER = 6
const rosters = teams.map((_, t) => players.slice(t * ROSTER, t * ROSTER + ROSTER))
const emergencyPool = players.slice(teams.length * ROSTER)

const teamPlayers = []
const clubMemberships = []
const associationMemberships = []
teams.forEach((team, t) => {
  rosters[t].forEach((p, i) => {
    teamPlayers.push({ id: `TP${pad(teamPlayers.length + 1, 3)}`, team_id: team.id, player_id: p.id, status: 'ACTIVE', register_at: stamp('2026-06-15', '09:00') })
    clubMemberships.push({ id: `CM${pad(clubMemberships.length + 1, 3)}`, player_id: p.id, club_id: team.club_id, is_primary: true, start_date: '2026-01-15', end_date: '', status: 'ACTIVE' })
    void i
  })
})
emergencyPool.forEach((p, i) => {
  const club = clubs[i % clubs.length]
  clubMemberships.push({ id: `CM${pad(clubMemberships.length + 1, 3)}`, player_id: p.id, club_id: club.id, is_primary: true, start_date: '2026-01-15', end_date: '', status: 'ACTIVE' })
  // Pool emergencies are registered against a team with EMERGENCY status.
  teamPlayers.push({ id: `TP${pad(teamPlayers.length + 1, 3)}`, team_id: teams[i % teams.length].id, player_id: p.id, status: 'EMERGENCY', register_at: stamp('2026-06-15', '09:00') })
})
players.forEach((p, i) => {
  associationMemberships.push({ id: `AM${pad(i + 1, 3)}`, player_id: p.id, association_id: ASSOC.id, is_primary: true, status: 'ACTIVE' })
})

// ------------------------------------------------------------------ UTR links
const utrLinks = players.map((p, i) => ({
  id: `UTR${pad(i + 1, 3)}`,
  player_id: p.id,
  utr_account_id: `UTR-${100000 + i * 7}`,
  utr_rating: (3.2 + ((i * 53) % 780) / 100).toFixed(2),
  last_synced_at: stamp('2026-09-21', '02:00'),
  status: 'ACTIVE',
}))

// Four dated snapshots per player per discipline, newest last.
const utrSnapshots = []
players.forEach((p, i) => {
  const base = Number(utrLinks[i].utr_rating)
  for (const [discipline, offset] of [['SINGLES', 0], ['DOUBLES', -0.35]]) {
    ;['2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01'].forEach((date, k) => {
      const drift = ((i + k * 3) % 7 - 3) / 100
      utrSnapshots.push({
        id: `SNAP${pad(utrSnapshots.length + 1, 4)}`,
        player_id: p.id,
        discipline,
        rating: Math.max(1, base + offset + drift + (k - 3) * 0.06).toFixed(2),
        recorded_at: stamp(date, '00:00'),
        source: 'UTR_API',
      })
    })
  }
})

// -------------------------------------------------------------------- rankings
const cohorts = [
  { id: 'COH01', name: 'Waverley Tennis adult singles', description: 'All adult players with a singles rating in a Waverley Tennis competition.', association_id: ASSOC.id, discipline: 'SINGLES' },
  { id: 'COH02', name: 'Waverley Tennis adult doubles', description: 'All adult players with a doubles rating in a Waverley Tennis competition.', association_id: ASSOC.id, discipline: 'DOUBLES' },
]
const rankingEntries = []
for (const cohort of cohorts) {
  const latest = players.map(p => {
    const snaps = utrSnapshots.filter(s => s.player_id === p.id && s.discipline === cohort.discipline)
    return { player_id: p.id, rating: Number(snaps[snaps.length - 1].rating) }
  }).sort((a, b) => b.rating - a.rating)
  latest.forEach((row, i) => {
    rankingEntries.push({
      id: `RANK${pad(rankingEntries.length + 1, 4)}`,
      cohort_id: cohort.id,
      player_id: row.player_id,
      rank: i + 1,
      rating: row.rating.toFixed(2),
      // Percentile of the cohort this player sits above, 0-100.
      percentile_rank: (((latest.length - (i + 1)) / latest.length) * 100).toFixed(2),
      as_of: stamp('2026-09-01', '00:00'),
    })
  })
}

// ------------------------------------------------------------------- fixtures
// Circle-method round robin: 7 rounds for 8 teams, run twice (14 rounds) with
// home and away swapped in the second half, exactly as the PDF describes.
function roundRobin(ids) {
  const list = ids.slice()
  const rounds = []
  for (let r = 0; r < list.length - 1; r++) {
    const pairs = []
    for (let i = 0; i < list.length / 2; i++) pairs.push([list[i], list[list.length - 1 - i]])
    rounds.push(pairs)
    list.splice(1, 0, list.pop())
  }
  return rounds
}

const SEASON_START = '2026-07-04' // first Saturday of the Winter season
const fixtures = []
const matchResults = []
const rubbers = []
const rubberSets = []
const rubberPlayers = []

liveSections.forEach(sectionId => {
  const sectionTeams = teams.filter(t => t.section_id === sectionId)
  const base = roundRobin(sectionTeams.map(t => t.id))
  for (let round = 1; round <= 14; round++) {
    const cycle = base[(round - 1) % 7]
    const secondHalf = round > 7
    const date = day(SEASON_START, (round - 1) * 7)
    cycle.forEach(([a, b]) => {
      const homeId = secondHalf ? b : a
      const awayId = secondHalf ? a : b
      const homeTeam = teams.find(t => t.id === homeId)
      const completed = date < TODAY
      const fixture = {
        id: `FIX${pad(fixtures.length + 1, 4)}`,
        section_id: sectionId,
        home_team_id: homeId,
        away_team_id: awayId,
        venue_id: homeTeam.home_venue_id,
        round_number: round,
        round_label: '',
        schedule_date: date,
        schedule_time: '13:00', // PDF: matches commence at 1:00 p.m.
        status: completed ? 'COMPLETED' : 'SCHEDULED',
        is_finals: false,
      }
      fixtures.push(fixture)
      if (completed) buildResult(fixture, homeId, awayId, round)
    })
  }
})

// A team of 6 fields 4 players each round. The starting point rotates with the
// round so everyone gets matches, then the four are sorted back into roster
// order because the PDF requires singles to be played in order of merit.
function availableFour(roster, round) {
  const offset = (round - 1) % roster.length
  return Array.from({ length: 4 }, (_, i) => (offset + i) % roster.length)
    .sort((a, b) => a - b)
    .map(i => roster[i])
}

// MF01: 2 singles rubbers + 1 doubles rubber, best of 3 full sets.
function buildResult(fixture, homeId, awayId, round) {
  const home = availableFour(rosters[teams.findIndex(t => t.id === homeId)], round)
  const away = availableFour(rosters[teams.findIndex(t => t.id === awayId)], round)
  const resultId = `RES${pad(matchResults.length + 1, 4)}`
  let homeWon = 0

  const layout = [
    { number: 1, type: 'SINGLES', slots: [0] },
    { number: 2, type: 'SINGLES', slots: [1] },
    { number: 3, type: 'DOUBLES', slots: [2, 3] },
  ]
  for (const rubber of layout) {
    const rubberId = `RUB${pad(rubbers.length + 1, 4)}`
    const homeWins = rnd() < 0.5
    if (homeWins) homeWon++

    // One rubber per fixture may end early; the winner is still explicit.
    const early = rnd() < 0.04
    const outcome = early ? pick(['RETIRED', 'WALKOVER', 'FORFEIT']) : 'COMPLETED'
    rubbers.push({
      id: rubberId,
      match_result_id: resultId,
      match_format_id: 'MF01',
      rubber_number: rubber.number,
      rubber_type: rubber.type,
      winner_side: homeWins ? 'HOME' : 'AWAY',
      outcome_type: outcome,
      played_at: stamp(fixture.schedule_date, rubber.number === 3 ? '13:00' : '14:30'),
      incomplete_reason: outcome === 'COMPLETED' ? '' : `Opponent ${outcome.toLowerCase()}`,
    })

    rubber.slots.forEach((slot, order) => {
      for (const [side, roster] of [['HOME', home], ['AWAY', away]]) {
        rubberPlayers.push({
          id: `RP${pad(rubberPlayers.length + 1, 5)}`,
          rubber_id: rubberId,
          player_id: roster[slot].id,
          side,
          player_order: order + 1,
          is_emergency: false,
        })
      }
    })

    if (outcome === 'WALKOVER' || outcome === 'FORFEIT') continue // no sets played
    const setCount = outcome === 'RETIRED' ? 1 : (rnd() < 0.55 ? 2 : 3)
    for (let n = 1; n <= setCount; n++) {
      // In a 3-set rubber the loser takes one set; otherwise the winner takes all.
      const winnerTakesSet = setCount === 3 ? n !== 2 : true
      const winnerGames = 6
      const loserGames = int(0, 5)
      const tiebreak = rnd() < 0.15
      const wg = tiebreak ? 7 : winnerGames
      const lg = tiebreak ? 6 : loserGames
      const homeTakesSet = homeWins === winnerTakesSet
      rubberSets.push({
        id: `SET${pad(rubberSets.length + 1, 5)}`,
        rubber_id: rubberId,
        set_number: n,
        home_games: homeTakesSet ? wg : lg,
        away_games: homeTakesSet ? lg : wg,
        is_tiebreak: tiebreak,
        // PDF: 12-pt tiebreak at 6 games all.
        home_tiebreak_points: tiebreak ? (homeTakesSet ? 7 : int(2, 5)) : '',
        away_tiebreak_points: tiebreak ? (homeTakesSet ? int(2, 5) : 7) : '',
      })
    }
  }

  const awayWon = layout.length - homeWon
  matchResults.push({
    id: resultId,
    fixture_id: fixture.id,
    home_rubbers: homeWon,
    away_rubbers: awayWon,
    status: 'FINALISED',
    outcome: homeWon > awayWon ? 'HOME_WIN' : 'AWAY_WIN',
    notes: '',
    entered_by: '',
    finalised_by: '',
    entered_at: stamp(fixture.schedule_date, '18:30'),
    finalised_at: stamp(day(fixture.schedule_date, 1), '10:00'),
  })
}

// ------------------------------------------------------------- finals fixtures
// PDF: semi, preliminary and grand finals, played at the neutral venue.
const finalsRounds = [
  { label: 'Semi Final', offset: 98 },
  { label: 'Preliminary Final', offset: 105 },
  { label: 'Grand Final', offset: 112 },
]
liveSections.forEach(sectionId => {
  const sectionTeams = teams.filter(t => t.section_id === sectionId)
  finalsRounds.forEach((final, i) => {
    fixtures.push({
      id: `FIX${pad(fixtures.length + 1, 4)}`,
      section_id: sectionId,
      home_team_id: sectionTeams[i * 2].id,
      away_team_id: sectionTeams[i * 2 + 1].id,
      venue_id: 'VEN99',
      round_number: 15 + i,
      round_label: final.label,
      schedule_date: day(SEASON_START, final.offset),
      schedule_time: '13:00',
      status: 'SCHEDULED',
      is_finals: true,
    })
  })
})

// ------------------------------------------------------- fixture schedule changes
// Applied to real upcoming fixtures so the "rescheduled" badge has a source.
const upcoming = fixtures.filter(f => f.status === 'SCHEDULED' && !f.is_finals)
const scheduleChanges = []
upcoming.slice(0, 3).forEach((f, i) => {
  const previous = f.schedule_date
  f.schedule_date = day(previous, 1) // Sunday washout replay
  scheduleChanges.push({
    id: `FSC${pad(i + 1, 3)}`,
    fixture_id: f.id,
    change_type: 'DATE_TIME_CHANGED',
    previous_date: previous,
    previous_time: '13:00',
    new_date: f.schedule_date,
    new_time: '13:00',
    previous_venue_id: '',
    new_venue_id: '',
    reason: 'Match washed out; replayed the following day.',
    changed_by: '',
    changed_at: stamp(day(previous, -5), '09:15'),
  })
})
// Called off with no replacement date agreed yet. The PDF's finals rule calls
// these "washout or heat-out" matches and excludes them from qualifying counts,
// so they are neither CANCELLED (they will be replayed) nor SCHEDULED (the date
// is gone). Their schedule_date/time is cleared until a new one is agreed.
upcoming.slice(5, 7).forEach(f => {
  const previousDate = f.schedule_date
  f.status = 'POSTPONED'
  f.schedule_date = ''
  f.schedule_time = ''
  scheduleChanges.push({
    id: `FSC${pad(scheduleChanges.length + 1, 3)}`,
    fixture_id: f.id,
    change_type: 'POSTPONED',
    previous_date: previousDate,
    previous_time: '13:00',
    new_date: '',
    new_time: '',
    previous_venue_id: '',
    new_venue_id: '',
    reason: 'Extreme heat policy; replacement date to be confirmed by the Records Secretary.',
    changed_by: '',
    changed_at: stamp(day(previousDate, -2), '11:20'),
  })
})

upcoming.slice(3, 5).forEach((f, i) => {
  const previous = f.venue_id
  f.venue_id = 'VEN99'
  scheduleChanges.push({
    id: `FSC${pad(scheduleChanges.length + 1, 3)}`,
    fixture_id: f.id,
    change_type: 'VENUE_CHANGED',
    previous_date: '',
    previous_time: '',
    new_date: '',
    new_time: '',
    previous_venue_id: previous,
    new_venue_id: 'VEN99',
    reason: 'Home courts unavailable; moved to the regional centre.',
    changed_by: '',
    changed_at: stamp(day(f.schedule_date, -6), '16:40'),
  })
  void i
})

// --------------------------------------------------------------------- ladder
// Counted from the fixtures above, not invented.
// Points: 4 for a match win, plus 1 per rubber won.
const ladderEntries = []
const playerStandings = []
liveSections.forEach(sectionId => {
  const sectionTeams = teams.filter(t => t.section_id === sectionId)
  const tally = new Map(sectionTeams.map(t => [t.id, { played: 0, won: 0, lost: 0, drawn: 0, rf: 0, ra: 0, sf: 0, sa: 0, gf: 0, ga: 0, points: 0 }]))

  for (const result of matchResults) {
    const fixture = fixtures.find(f => f.id === result.fixture_id)
    if (fixture.section_id !== sectionId) continue
    const h = tally.get(fixture.home_team_id)
    const a = tally.get(fixture.away_team_id)
    h.played++; a.played++
    h.rf += result.home_rubbers; h.ra += result.away_rubbers
    a.rf += result.away_rubbers; a.ra += result.home_rubbers
    h.points += result.home_rubbers; a.points += result.away_rubbers
    if (result.outcome === 'HOME_WIN') { h.won++; a.lost++; h.points += 4 } else { a.won++; h.lost++; a.points += 4 }

    for (const rubber of rubbers.filter(r => r.match_result_id === result.id)) {
      for (const set of rubberSets.filter(s => s.rubber_id === rubber.id)) {
        h.gf += set.home_games; h.ga += set.away_games
        a.gf += set.away_games; a.ga += set.home_games
        if (set.home_games > set.away_games) { h.sf++; a.sa++ } else { a.sf++; h.sa++ }
      }
    }
  }

  const ordered = sectionTeams.slice().sort((x, y) => {
    const tx = tally.get(x.id), ty = tally.get(y.id)
    return ty.points - tx.points || (ty.rf - ty.ra) - (tx.rf - tx.ra) || (ty.gf - ty.ga) - (tx.gf - tx.ga)
  })
  ordered.forEach((team, i) => {
    const t = tally.get(team.id)
    ladderEntries.push({
      id: `LAD${pad(ladderEntries.length + 1, 3)}`,
      section_id: sectionId, team_id: team.id, position: i + 1,
      played: t.played, won: t.won, lost: t.lost, drawn: t.drawn,
      rubbers_for: t.rf, rubbers_against: t.ra,
      sets_for: t.sf, sets_against: t.sa,
      games_for: t.gf, games_against: t.ga,
      points: t.points,
      calculated_at: stamp(TODAY, '03:00'),
    })
  })

  // Individual standings, counted from finalised rubbers only.
  const perPlayer = new Map()
  for (const rp of rubberPlayers) {
    const rubber = rubbers.find(r => r.id === rp.rubber_id)
    const result = matchResults.find(m => m.id === rubber.match_result_id)
    const fixture = fixtures.find(f => f.id === result.fixture_id)
    if (fixture.section_id !== sectionId) continue
    if (!perPlayer.has(rp.player_id)) perPlayer.set(rp.player_id, { rp: 0, rw: 0, rl: 0, sw: 0, sl: 0, gw: 0, gl: 0 })
    const s = perPlayer.get(rp.player_id)
    s.rp++
    if (rubber.winner_side === rp.side) s.rw++; else s.rl++
    for (const set of rubberSets.filter(x => x.rubber_id === rubber.id)) {
      const mine = rp.side === 'HOME' ? set.home_games : set.away_games
      const theirs = rp.side === 'HOME' ? set.away_games : set.home_games
      s.gw += mine; s.gl += theirs
      if (mine > theirs) s.sw++; else s.sl++
    }
  }
  const rankedPlayers = [...perPlayer.entries()].sort((a, b) =>
    (b[1].rw / b[1].rp) - (a[1].rw / a[1].rp) || b[1].rw - a[1].rw)
  rankedPlayers.forEach(([playerId, s], i) => {
    playerStandings.push({
      id: `PS${pad(playerStandings.length + 1, 3)}`,
      section_id: sectionId, player_id: playerId, position: i + 1,
      rubbers_played: s.rp, rubbers_won: s.rw, rubbers_lost: s.rl,
      sets_won: s.sw, sets_lost: s.sl, games_won: s.gw, games_lost: s.gl,
      win_percentage: ((s.rw / s.rp) * 100).toFixed(2),
      calculated_at: stamp(TODAY, '03:00'),
    })
  })
})

// --------------------------------------------------------------------- awards
// Historical titles from the two completed seasons.
const awards = []
;[['SEA02', 'SEC03', 'Summer 2025/26'], ['SEA03', 'SEC04', 'Winter 2025']].forEach(([seasonId, , label], s) => {
  const winners = teams.slice(s * 4, s * 4 + 2)
  winners.forEach((team, w) => {
    const roster = rosters[teams.findIndex(t => t.id === team.id)]
    roster.forEach(p => {
      awards.push({
        id: `AWD${pad(awards.length + 1, 3)}`,
        player_id: p.id,
        award_type: w === 0 ? 'SECTION_WINNER' : 'RUNNER_UP',
        title: `${label} Section ${w + 1} ${w === 0 ? 'Premiers' : 'Runners-up'}`,
        competition_id: 'COMP01',
        season_id: seasonId,
        team_id: team.id,
        awarded_on: seasonId === 'SEA02' ? '2026-03-28' : '2025-10-25',
      })
    })
  })
})

// -------------------------------------------------------------- notifications
// Generated from the schedule changes and finals above, one row per channel.
const notifications = []
function notify(userEmail, type, title, message, details, targetType, targetId, createdAt, read) {
  notifications.push({
    id: `NOT${pad(notifications.length + 1, 4)}`, _lookup_user_email: userEmail, type, title, message,
    details: JSON.stringify(details), target_type: targetType, target_id: targetId,
    channel: 'IN_APP', delivery_status: 'SENT', sent_at: createdAt,
    read_at: read ? stamp(TODAY, '08:00') : '', created_at: createdAt,
  })
  notifications.push({
    id: `NOT${pad(notifications.length + 1, 4)}`, _lookup_user_email: userEmail, type, title, message,
    details: JSON.stringify(details), target_type: targetType, target_id: targetId,
    channel: 'EMAIL', delivery_status: 'SENT', sent_at: createdAt,
    read_at: '', created_at: createdAt,
  })
}
const affected = f => [f.home_team_id, f.away_team_id].flatMap(id => rosters[teams.findIndex(t => t.id === id)])

scheduleChanges.forEach((change, i) => {
  const fixture = fixtures.find(f => f.id === change.fixture_id)
  for (const p of affected(fixture)) {
    if (change.change_type === 'DATE_TIME_CHANGED') {
      notify(p._lookup_user_email, 'MATCH_DATE_CHANGED', 'Match Date Changed',
        `Your ${teams.find(t => t.id === fixture.home_team_id).name} match has been rescheduled.`,
        { previousDate: change.previous_date, newDate: change.new_date, previousTime: change.previous_time, newTime: change.new_time, timeZone: TZ },
        'FIXTURE', fixture.id, change.changed_at, i % 3 === 0)
    } else {
      notify(p._lookup_user_email, 'VENUE_CHANGED', 'Start Venue Changed',
        'Your match venue has changed.',
        { previousVenue: change.previous_venue_id, newVenue: change.new_venue_id, timeZone: TZ },
        'FIXTURE', fixture.id, change.changed_at, false)
    }
  }
})
// Draw released + reminders for the finals.
fixtures.filter(f => f.is_finals && f.round_label === 'Semi Final').forEach(f => {
  for (const p of affected(f)) {
    notify(p._lookup_user_email, 'DRAW_RELEASED', 'Finals Draw Released',
      'The finals draw for your section has been published.',
      { competitionId: 'COMP01', seasonId: 'SEA01' }, 'FIXTURE', f.id, stamp('2026-09-20', '19:00'), false)
    notify(p._lookup_user_email, 'MATCH_REMINDER', 'Match Reminder',
      `Semi Final on ${f.schedule_date} at 13:00.`,
      { scheduledDate: f.schedule_date, scheduledTime: '13:00', timeZone: TZ },
      'FIXTURE', f.id, stamp('2026-09-21', '08:00'), false)
  }
})

// ------------------------------------------------------------------ user roles
const userRoles = [
  { id: 'UR001', _lookup_user_email: players[0]._lookup_user_email, role_type: 'ADMINISTRATOR', context_type: 'ASSOCIATION', association_id: ASSOC.id, club_id: '', team_id: '', competition_id: '', granted_at: stamp('2026-01-10', '09:00') },
  { id: 'UR002', _lookup_user_email: players[1]._lookup_user_email, role_type: 'RECORDS_SECRETARY', context_type: 'ASSOCIATION', association_id: ASSOC.id, club_id: '', team_id: '', competition_id: '', granted_at: stamp('2026-01-10', '09:00') },
]
clubs.forEach((club, i) => {
  userRoles.push({ id: `UR${pad(userRoles.length + 1, 3)}`, _lookup_user_email: players[2 + i]._lookup_user_email, role_type: 'CLUB_ADMIN', context_type: 'CLUB', association_id: '', club_id: club.id, team_id: '', competition_id: '', granted_at: stamp('2026-02-01', '09:00') })
})
teams.forEach((team, i) => {
  userRoles.push({ id: `UR${pad(userRoles.length + 1, 3)}`, _lookup_user_email: rosters[i][0]._lookup_user_email, role_type: 'TEAM_MANAGER', context_type: 'TEAM', association_id: '', club_id: '', team_id: team.id, competition_id: '', granted_at: stamp('2026-06-20', '09:00') })
})
players.forEach((p, i) => {
  userRoles.push({ id: `UR${pad(userRoles.length + 1, 3)}`, _lookup_user_email: p._lookup_user_email, role_type: 'PLAYER', context_type: 'GLOBAL', association_id: '', club_id: '', team_id: '', competition_id: '', granted_at: stamp('2026-01-15', '09:00') })
  void i
})

// ----------------------------------------------------------------------- write
const README = [
  { field: 'Purpose', value: 'Test/demo data for the Tennis Competition Platform, one sheet per database table.' },
  { field: 'Generated', value: `${TODAY} (deterministic - regenerating produces an identical file)` },
  { field: 'Source of competition rules', value: 'Competition match formats 28082026.pdf (Waverley Tennis). Sheets Competition, MatchFormat and EligibilityRule are transcribed from it.' },
  { field: 'Source of names/emails', value: 'players_login_data.xlsx. The 100 existing accounts are reused so this data links to the users already in the database.' },
  { field: 'IDs', value: 'Short readable codes (CLB01, TEAM003, FIX0042). The seed script maps each code to a UUID. Foreign key columns hold these codes.' },
  { field: 'Lookup keys (_ prefix)', value: 'A column whose name starts with "_lookup_" is NOT a database column. It identifies an existing row so the import script can resolve it to a foreign key. The import must never try to write it as a field.' },
  { field: '_lookup_user_email', value: 'Appears on Player, Notification and UserRole. Finds the existing User row by its login email and writes that user id into player.user_id / notification.user_id / user_role.user_id. Those User rows are already in the database; their UUIDs cannot be written here.' },
  { field: 'Player has two email columns', value: 'They are different things. "_lookup_user_email" is the login address used to find the User account (not stored on Player). "email" IS a real column, player.email, the contact address shown on the profile. A Player can exist with no User account at all, which is why the schema keeps them apart.' },
  { field: 'Player.email is mostly blank on purpose', value: 'dashboard.service.ts resolves the profile address as `player.email ?? loginEmail`, so a player whose contact address is their login address needs no value here. It is filled only where the contact address genuinely differs, which keeps both branches of that fallback exercised.' },
  { field: 'Blank cells', value: 'A blank cell means NULL, not an empty string.' },
  { field: 'Dates and times', value: 'Dates are YYYY-MM-DD. Times are local HH:mm at the fixture venue. Timestamps are UTC ISO strings. Venue time zone is Australia/Melbourne.' },
  { field: 'Enum values', value: 'Enum columns use the exact Prisma enum member names (ACTIVE, COMPLETED, HOME, SINGLES...).' },
  { field: 'Scope of live data', value: 'Weekend Senior, Winter 2026 season, 2 sections of 8 teams, 14 rounds + finals. Format MF01: 2 singles rubbers + 1 doubles rubber, best of 3 full sets.' },
  { field: 'Completed vs scheduled', value: `Fixtures dated before ${TODAY} are COMPLETED and carry results; later rounds and all finals are SCHEDULED.` },
  { field: 'Rosters', value: '6 players per team x 16 teams = 96. The remaining 4 players are the competition emergency pool (TeamPlayer.status = EMERGENCY).' },
  { field: 'SYNTHETIC: dates of birth and gender', value: 'The source spreadsheet has no DOB or gender. Both are generated from the row index and are NOT inferred from anyone\'s name. All players are adults.' },
  { field: 'SYNTHETIC: phone numbers', value: 'Randomly generated placeholders. Do not dial them.' },
  { field: 'SYNTHETIC: UTR ratings', value: 'Generated, not supplied by Universal Tennis. UtrRatingSnapshot holds 4 dated points per player per discipline.' },
  { field: 'SYNTHETIC: club and venue details', value: 'Suburb names are real; addresses, phone numbers and emails are placeholders using .example domains.' },
  { field: 'Ladder and standings', value: 'Counted from the fixtures in this workbook, not invented. Points = 4 per match win + 1 per rubber won. Change this rule if the association uses a different one.' },
  { field: 'Awards', value: 'Two completed seasons (SEA02, SEA03) carry premiership awards only. No fixtures were generated for them, so those seasons have titles but no match history.' },
  { field: 'Notifications', value: 'Generated from the rows in FixtureScheduleChange and the finals fixtures. Each event produces one IN_APP row and one EMAIL row; unread counts only count IN_APP.' },
  { field: 'Passwords', value: 'Not included in this workbook. The existing 100 accounts keep their current password hashes.' },
]

const book = XLSX.utils.book_new()
const sheets = [
  ['README', README], ['Association', [ASSOC]], ['Club', clubs], ['Venue', venues],
  ['Competition', competitions], ['MatchFormat', matchFormats], ['EligibilityRule', eligibilityRules],
  ['Season', seasons], ['SectionGrade', sections], ['Team', teams], ['Player', players],
  ['ClubMembership', clubMemberships], ['AssociationMembership', associationMemberships],
  ['TeamPlayer', teamPlayers], ['UtrLink', utrLinks], ['UtrRatingSnapshot', utrSnapshots],
  ['RankingCohort', cohorts], ['RankingEntry', rankingEntries],
  ['Fixture', fixtures], ['FixtureScheduleChange', scheduleChanges],
  ['MatchResult', matchResults], ['Rubber', rubbers], ['RubberSet', rubberSets],
  ['RubberPlayer', rubberPlayers], ['LadderEntry', ladderEntries], ['PlayerStanding', playerStandings],
  ['PlayerAward', awards], ['Notification', notifications], ['UserRole', userRoles],
]
for (const [name, rows] of sheets) {
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = Object.keys(rows[0]).map(k => ({ wch: Math.min(48, Math.max(k.length + 2, 12)) }))
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
  XLSX.utils.book_append_sheet(book, ws, name)
}
XLSX.writeFile(book, OUT)

console.log(`Wrote ${OUT}`)
for (const [name, rows] of sheets) console.log(`  ${name.padEnd(24)} ${String(rows.length).padStart(5)} rows`)
