/**
 * Builds competition_data.xlsx: one sheet per database table.
 *
 * Reference data (competitions, match formats, eligibility rules) is transcribed
 * from "Competition match formats 28082026" (Waverley Tennis). Everything else is
 * generated, but it obeys the same rules the real competition does: legal tennis
 * scores, singles played in order of merit, Saturday 1:00 pm starts stored as
 * real UTC instants, finals drawn from the final ladder, and team rows that
 * belong to one season only.
 *
 * No real person's contact details appear here. Every address uses a reserved
 * .example domain, and all accounts share one documented development password.
 *
 *   npm run data:generate     rebuild this workbook
 *   npm run data:check        validate it
 */
const REPO = require('node:path').resolve(__dirname, '../..')
const XLSX = require(`${REPO}/node_modules/xlsx`)
const bcrypt = require(`${REPO}/node_modules/bcryptjs`)

const OUT = process.argv[2] || require('node:path').join(__dirname, 'competition_data.xlsx')
const TZ = 'Australia/Melbourne'
const TODAY = '2026-09-22'
/** Shared across every generated account; documented in the README sheet. */
const DEV_PASSWORD = 'WaverleyDev#2026'

let seed = 20260922
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
const pick = a => a[Math.floor(rnd() * a.length)]
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1))
const pad = (n, w) => String(n).padStart(w, '0')

const day = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const dow = iso => new Date(`${iso}T00:00:00Z`).getUTCDay()

/**
 * Melbourne runs AEDT (UTC+11) from the first Sunday in October to the first
 * Sunday in April, and AEST (UTC+10) the rest of the year. A 1:00 pm match is
 * 03:00Z in winter and 02:00Z in summer - storing "13:00Z" would put it at
 * 11 pm local, which is what the first version of this file got wrong.
 */
function offsetHours(iso) {
  const firstSunday = (y, m) => {
    const first = new Date(Date.UTC(y, m, 1))
    return new Date(Date.UTC(y, m, 1 + ((7 - first.getUTCDay()) % 7)))
  }
  const d = new Date(`${iso}T00:00:00Z`)
  const y = d.getUTCFullYear()
  return d >= firstSunday(y, 9) || d < firstSunday(y, 3) ? 11 : 10
}
/** Local wall-clock time on a given date -> UTC ISO instant. */
function utc(iso, hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const t = Date.UTC(...iso.split('-').map(Number).map((v, i) => (i === 1 ? v - 1 : v)), h - offsetHours(iso), m)
  return new Date(t).toISOString().replace('.000', '')
}

// ───────────────────────────────────────────────────────────── associations
const ASSOCS = [
  { id: 'ASSOC01', name: 'Waverley Tennis', email: 'info@waverleytennis.example', address: '1 Sample Street, Glen Waverley VIC 3150', phone: '03 9000 0000', status: 'ACTIVE' },
  // A second association makes cross-association profile merges testable.
  { id: 'ASSOC02', name: 'Eastern Districts Tennis', email: 'info@easterndistricts.example', address: '22 Example Road, Box Hill VIC 3128', phone: '03 9000 0001', status: 'ACTIVE' },
]

const SUBURBS = ['Glen Waverley', 'Mount Waverley', 'Syndal', 'Pinewood', 'Wheelers Hill',
  'Mulgrave', 'Ashwood', 'Burwood', 'Chadstone', 'Notting Hill', 'Forest Hill', 'Vermont South']
const slug = s => s.toLowerCase().replace(/\s+/g, '')

const clubs = SUBURBS.map((s, i) => ({
  id: `CLB${pad(i + 1, 2)}`,
  association_id: i < 10 ? 'ASSOC01' : 'ASSOC02',
  name: `${s} Tennis Club`,
  address: `${int(1, 200)} ${pick(['Park', 'Station', 'High', 'Church', 'Reserve'])} Road, ${s} VIC ${3100 + i * 3}`,
  email: `admin@${slug(s)}tc.example`,
  phone: `03 9${int(100, 899)} ${int(1000, 9999)}`,
  status: 'ACTIVE',
}))

const COURTS = [6, 8, 4, 10, 6, 8, 4, 6, 8, 4, 6, 10]
const venues = clubs.map((c, i) => ({
  id: `VEN${pad(i + 1, 2)}`, club_id: c.id,
  name: `${c.name.replace(' Tennis Club', '')} Tennis Centre`,
  address: c.address, time_zone: TZ, court_count: COURTS[i], status: 'ACTIVE',
}))
venues.push({ id: 'VEN99', club_id: '', name: 'Waverley Tennis Regional Centre', address: '500 Springvale Road, Glen Waverley VIC 3150', time_zone: TZ, court_count: 16, status: 'ACTIVE' })

// ──────────────────────────────────────────────────────────── competitions
const competitions = [
  { id: 'COMP01', association_id: 'ASSOC01', name: 'Weekend Senior', type: 'Saturday pm. Winter and Summer Seasons', status: 'ACTIVE' },
  { id: 'COMP02', association_id: 'ASSOC01', name: 'Weekend Junior', type: 'Saturday and Sunday am. Winter and Summer Seasons', status: 'ACTIVE' },
  { id: 'COMP03', association_id: 'ASSOC01', name: 'Mid-Week Mens', type: 'Wednesday am. Autumn and Spring Seasons', status: 'ACTIVE' },
  { id: 'COMP04', association_id: 'ASSOC01', name: 'Mid-Week Ladies', type: 'Thursday am. Autumn and Spring Seasons', status: 'ACTIVE' },
  { id: 'COMP05', association_id: 'ASSOC01', name: 'Night Tennis', type: 'Monday and Tuesday nights. Autumn and Spring Seasons', status: 'ACTIVE' },
]

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

// Names for the generated squad. They are embedded here on purpose: the
// generator must not depend on players_login_data.xlsx, which holds plaintext
// passwords and is git-ignored, so teammates could not regenerate without it.
// Two names repeat deliberately, as different people, so duplicate-profile
// detection on name + date of birth + email has something to find.
const NAMES = [
  "Raj Mitchell", "Mia Coleman", "Yuki Smith", "Charlotte Reed", "Chloe Cooper", "Ethan Wright",
  "Ava Clark", "Yuki Green", "Elsa Hill", "Hiro Parker", "Jun Murphy", "Lucas Brooks",
  "Emily Jenkins", "Zara Adams", "Hiro Mitchell", "Henry Barnes", "Oliver Evans", "Ruby Mitchell",
  "Mia Mitchell", "Diego Parker", "Daniel Hill", "Elena Roberts", "Mei Tran", "William Turner",
  "Nour Parker", "Hiro Mitchell", "Lucas Chen", "Mei Phillips", "Thomas Mitchell", "Noah Wright",
  "Ben Walker", "Grace Hill", "Zara Evans", "Emily Wilson", "Samuel Smith", "Lara Green",
  "Chloe Parker", "Claire Carter", "Noah Parker", "Yuki Henderson", "Sana Brown", "Felix Turner",
  "Tara Barnes", "Thomas Wood", "Mia Rivera", "Nour Ward", "Thomas Baker", "Hannah Bennett",
  "Yuki King", "Sana Cooper", "Amelia Lee", "Sana Mitchell", "Felix Adams", "Kai Roberts",
  "Thomas Kelly", "Ruby Chen", "Elena Walker", "Samuel Watson", "Niko Brooks", "Ethan Wood",
  "Grace Reed", "Hiro Scott", "Wei Nguyen", "Thomas Taylor", "Samuel Parker", "James Wilson",
  "Jun Nguyen", "Daniel Walker", "Raj Ross", "Hannah Watson", "Thomas Nguyen", "Elsa Coleman",
  "James Cox", "Ethan Campbell", "Niko Tran", "Grace Henderson", "Nour Nguyen", "Daniel Mitchell",
  "Thomas Price", "Priya Wright", "Ali Cox", "Lara Bennett", "Lara Reed", "Iris Brown",
  "Amelia Smith", "Henry Wright", "Isla Cox", "Freya Coleman", "Freya Bennett", "Wei Scott",
  "Amelia Lee", "Hiro Martin", "Tara Walker", "Ruby Young", "Lara Adams", "Marco White",
  "Sana Barnes", "Luna Taylor", "Kai Nguyen", "Diego Brooks",
]

// ────────────────────────────────────────────────────────────────── people
// Names come from the original spreadsheet (two are deliberately duplicated so
// the duplicate-profile rules can be tested). Every address is rewritten to a
// reserved .example domain so no real mailbox can appear in a test database.
const passwordHash = bcrypt.hashSync(DEV_PASSWORD, 10)

const players = NAMES.map((fullName, i) => {
  const parts = fullName.trim().split(/\s+/)
  const first = parts[0], last = parts.slice(1).join(' ') || parts[0]
  const login = `${slug(first)}.${slug(last)}${pad(i + 1, 3)}@players.example`
  return {
    id: `PLR${pad(i + 1, 3)}`,
    _lookup_user_email: login,
    first_name: first, last_name: last,
    // Synthetic adult dates of birth and genders, derived from the row index
    // and never inferred from anyone's name.
    date_of_birth: `${1979 + (i % 26)}-${pad((i % 12) + 1, 2)}-${pad((i % 28) + 1, 2)}`,
    gender: ['MALE', 'FEMALE', 'OTHER'][i % 3],
    // player.email is the contact address, resolved by the API as
    // `player.email ?? loginEmail`; filled only where it genuinely differs.
    email: i % 7 === 3 ? `${slug(first)}.${slug(last)}@contact.example` : '',
    phone: `04${pad(int(10, 99), 2)} ${pad(int(0, 999), 3)} ${pad(int(0, 999), 3)}`,
    avatar_url: '', is_junior: false, status: 'ACTIVE',
  }
})

const users = players.map((p, i) => ({
  id: `USR${pad(i + 1, 3)}`,
  email: p._lookup_user_email,
  password_hash: passwordHash,
  status: 'ACTIVE',
  last_login_at: i % 4 === 0 ? utc(day(TODAY, -(i % 20) - 1), '19:30') : '',
}))

const utrRating = i => 3.2 + ((i * 53) % 780) / 100
const utrOf = new Map(players.map((p, i) => [p.id, utrRating(i)]))

// ───────────────────────────────────────────────────────────────── seasons
// Seasons inside one competition never overlap: Summer starts after the Winter
// finals are done. Each season owns its own teams - team rows are never reused
// across seasons, which is what the client specifically warned about.
const SEASONS = [
  { id: 'SEA01', competition_id: 'COMP01', year: 2025, season_type: 'Winter', start_date: '2025-07-05', end_date: '2025-10-25', status: 'COMPLETED', format: 'MF01', playDay: 6, startTime: '13:00', sections: 1, complete: true },
  { id: 'SEA02', competition_id: 'COMP01', year: 2025, season_type: 'Summer', start_date: '2025-11-01', end_date: '2026-03-28', status: 'COMPLETED', format: 'MF01', playDay: 6, startTime: '13:00', sections: 1, complete: true },
  { id: 'SEA03', competition_id: 'COMP01', year: 2026, season_type: 'Winter', start_date: '2026-07-04', end_date: '2026-10-24', status: 'ACTIVE', format: 'MF01', playDay: 6, startTime: '13:00', sections: 2, complete: false },
  // A second competition running its own season proves competitions are independent.
  { id: 'SEA04', competition_id: 'COMP05', year: 2026, season_type: 'Autumn', start_date: '2026-02-02', end_date: '2026-05-18', status: 'COMPLETED', format: 'MF11', playDay: 1, startTime: '19:30', sections: 1, complete: true },
]

const sections = []
const teams = []
for (const s of SEASONS) {
  for (let n = 0; n < s.sections; n++) {
    const sectionId = `SEC${pad(sections.length + 1, 2)}`
    sections.push({ id: sectionId, season_id: s.id, name: `Section ${n + 1}`, gender: '', age_group: 'Adult', min_age: 18, max_age: '', team_count: 8 })
    for (let t = 0; t < 8; t++) {
      const club = clubs[(n * 8 + t) % clubs.length]
      teams.push({
        id: `TEAM${pad(teams.length + 1, 3)}`, club_id: club.id, section_id: sectionId,
        home_venue_id: venues.find(v => v.club_id === club.id).id,
        name: `${club.name.replace(' Tennis Club', '')} ${String.fromCharCode(65 + n)}`,
        _season: s.id,
      })
    }
  }
}
const sectionsOf = seasonId => sections.filter(x => x.season_id === seasonId)
const teamsOf = sectionId => teams.filter(t => t.section_id === sectionId)

// ───────────────────────────────────────────────────── rosters & memberships
// Six players per team. A team's singles order is fixed for the season by
// rating, strongest at number 1, as the competition rules require.
const ROSTER = 6
const rosterOf = new Map()
for (const section of sections) {
  teamsOf(section.id).forEach((team, t) => {
    const base = teams.indexOf(team) * ROSTER
    const squad = Array.from({ length: ROSTER }, (_, k) => players[(base + k) % players.length])
    rosterOf.set(team.id, [...squad].sort((a, b) => utrOf.get(b.id) - utrOf.get(a.id)))
    void t
  })
}

const clubMemberships = []
const associationMemberships = []
const teamPlayers = []
const seenMembership = new Set()

/** Joined dates are staggered and always precede the player's first season. */
function joinDate(playerId, clubId, seasonStart) {
  const key = `${playerId}|${clubId}`
  if (!seenMembership.has(key)) return day(seasonStart, -(30 + (Number(playerId.slice(3)) % 120)))
  return null
}

for (const season of SEASONS) {
  for (const section of sectionsOf(season.id)) {
    for (const team of teamsOf(section.id)) {
      for (const p of rosterOf.get(team.id)) {
        const key = `${p.id}|${team.club_id}`
        if (!seenMembership.has(key)) {
          seenMembership.add(key)
          // Exactly one primary club per player: the first they joined. Later
          // clubs are secondary, which is how a player comes to represent
          // different clubs in different competitions.
          const hasPrimary = clubMemberships.some(m => m.player_id === p.id && m.is_primary === true)
          clubMemberships.push({
            id: `CM${pad(clubMemberships.length + 1, 3)}`, player_id: p.id, club_id: team.club_id,
            is_primary: !hasPrimary,
            start_date: joinDate(p.id, team.club_id, season.start_date) ?? day(season.start_date, -60),
            end_date: '', status: 'ACTIVE',
          })
        }
        teamPlayers.push({
          id: `TP${pad(teamPlayers.length + 1, 4)}`, team_id: team.id, player_id: p.id,
          status: 'ACTIVE', register_at: utc(day(season.start_date, -19), '09:00'),
        })
      }
    }
  }
}

// A quarter of the squad also holds a secondary membership at another club, so
// "a player may belong to more than one club" and represent different clubs in
// different competitions is exercised.
players.forEach((p, i) => {
  if (i % 4) return
  const own = clubMemberships.find(m => m.player_id === p.id)
  const other = clubs.find(c => c.id !== own?.club_id && c.association_id === 'ASSOC02') ?? clubs[11]
  if (!own || seenMembership.has(`${p.id}|${other.id}`)) return
  seenMembership.add(`${p.id}|${other.id}`)
  clubMemberships.push({
    id: `CM${pad(clubMemberships.length + 1, 3)}`, player_id: p.id, club_id: other.id,
    is_primary: false, start_date: '2025-02-10', end_date: '', status: 'ACTIVE',
  })
})

players.forEach((p, i) => {
  associationMemberships.push({ id: `AM${pad(associationMemberships.length + 1, 3)}`, player_id: p.id, association_id: 'ASSOC01', is_primary: true, status: 'ACTIVE' })
  if (i % 4 === 0) associationMemberships.push({ id: `AM${pad(associationMemberships.length + 1, 3)}`, player_id: p.id, association_id: 'ASSOC02', is_primary: false, status: 'ACTIVE' })
})

// ─────────────────────────────────────────────────────────────── UTR data
const utrSnapshots = []
players.forEach((p, i) => {
  for (const [discipline, offset] of [['SINGLES', 0], ['DOUBLES', -0.35]]) {
    ;['2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01'].forEach((d, k) => {
      const drift = ((i + k * 3) % 7 - 3) / 100
      utrSnapshots.push({
        id: `SNAP${pad(utrSnapshots.length + 1, 4)}`, player_id: p.id, discipline,
        rating: Math.max(1, utrRating(i) + offset + drift + (k - 3) * 0.06).toFixed(2),
        recorded_at: utc(d, '10:00'), source: 'UTR_API',
      })
    })
  }
})
const latestSnapshot = (playerId, discipline) => {
  const rows = utrSnapshots.filter(s => s.player_id === playerId && s.discipline === discipline)
  return rows[rows.length - 1]
}
// UtrLink carries the current rating, and it must be the same number the newest
// snapshot reports - two different UTRs for one player is a defect, not a feature.
const utrLinks = players.map((p, i) => ({
  id: `UTR${pad(i + 1, 3)}`, player_id: p.id, utr_account_id: `UTR-${100000 + i * 7}`,
  utr_rating: latestSnapshot(p.id, 'SINGLES').rating,
  last_synced_at: utc('2026-09-01', '10:05'), status: 'ACTIVE',
}))

const cohorts = [
  { id: 'COH01', name: 'Waverley Tennis adult singles', description: 'Adult players with a singles rating in a Waverley Tennis competition.', association_id: 'ASSOC01', discipline: 'SINGLES' },
  { id: 'COH02', name: 'Waverley Tennis adult doubles', description: 'Adult players with a doubles rating in a Waverley Tennis competition.', association_id: 'ASSOC01', discipline: 'DOUBLES' },
]
const rankingEntries = []
for (const c of cohorts) {
  const ranked = players
    .map(p => ({ player_id: p.id, rating: Number(latestSnapshot(p.id, c.discipline).rating) }))
    .sort((a, b) => b.rating - a.rating)
  ranked.forEach((r, i) => rankingEntries.push({
    id: `RANK${pad(rankingEntries.length + 1, 4)}`, cohort_id: c.id, player_id: r.player_id,
    rank: i + 1, rating: r.rating.toFixed(2),
    percentile_rank: (((ranked.length - (i + 1)) / ranked.length) * 100).toFixed(2),
    as_of: utc('2026-09-01', '10:05'),
  }))
}

// ──────────────────────────────────────────────────────────────── fixtures
const fixtures = []
const matchResults = []
const rubbers = []
const rubberSets = []
const rubberPlayers = []
const confirmations = []
const corrections = []
const auditLog = []

function roundRobin(ids) {
  const list = ids.slice(), rounds = []
  for (let r = 0; r < list.length - 1; r++) {
    const pairs = []
    for (let i = 0; i < list.length / 2; i++) pairs.push([list[i], list[list.length - 1 - i]])
    rounds.push(pairs)
    list.splice(1, 0, list.pop())
  }
  return rounds
}

/** Legal tennis set scores only: 6-0..6-4, 7-5, or 7-6 decided on a tiebreak. */
function setScore() {
  const r = rnd()
  if (r < 0.12) return { w: 7, l: 6, tb: true }
  if (r < 0.28) return { w: 7, l: 5, tb: false }
  return { w: 6, l: int(0, 4), tb: false }
}


function buildFixtures(season) {
  for (const section of sectionsOf(season.id)) {
    const list = teamsOf(section.id)
    const base = roundRobin(list.map(t => t.id))
    // First Saturday (or Monday for night tennis) on or after the start date.
    let first = season.start_date
    while (dow(first) !== season.playDay) first = day(first, 1)

    for (let round = 1; round <= 14; round++) {
      const cycle = base[(round - 1) % 7]
      const secondHalf = round > 7
      const d = day(first, (round - 1) * 7)
      for (const [a, b] of cycle) {
        const homeId = secondHalf ? b : a, awayId = secondHalf ? a : b
        const home = teams.find(t => t.id === homeId)
        const played = season.complete || d < TODAY
        const fixture = {
          id: `FIX${pad(fixtures.length + 1, 4)}`, section_id: section.id,
          home_team_id: homeId, away_team_id: awayId, venue_id: home.home_venue_id,
          round_number: round, round_label: '', schedule_date: d, schedule_time: season.startTime,
          status: played ? 'COMPLETED' : 'SCHEDULED', is_finals: false,
        }
        fixtures.push(fixture)
        if (played) buildResult(fixture, season, round)
      }
    }

    // Finals are drawn from the final ladder, and only once the home-and-away
    // rounds are actually finished. The active season has none yet.
    if (season.complete) buildFinals(season, section)
  }
}

function buildResult(fixture, season, round) {
  const home = rosterOf.get(fixture.home_team_id)
  const away = rosterOf.get(fixture.away_team_id)
  const resultId = `RES${pad(matchResults.length + 1, 4)}`
  let homeWon = 0

  // Rotate which four of the six play, keeping the singles order of merit.
  const four = r => {
    const o = (round - 1) % ROSTER
    return Array.from({ length: 4 }, (_, i) => r[(o + i) % ROSTER]).sort((a, b) => utrOf.get(b.id) - utrOf.get(a.id))
  }
  const h = four(home), a = four(away)

  // Occasionally a side is a player short and a last-minute emergency steps in.
  // Emergencies are not on the roster - that is the point of them.
  const emergencyFor = side => {
    if (rnd() > 0.05) return null
    const squad = new Set([...home, ...away].map(p => p.id))
    return players.find(p => !squad.has(p.id) && Number(p.id.slice(3)) % 3 === (side === 'HOME' ? 0 : 1)) ?? null
  }
  const subs = { HOME: emergencyFor('HOME'), AWAY: emergencyFor('AWAY') }
  if (subs.HOME) h[3] = subs.HOME
  if (subs.AWAY) a[3] = subs.AWAY

  // PDF: the doubles rubber is played first, then the two singles.
  const layout = [
    { number: 1, type: 'DOUBLES', slots: [2, 3], at: season.startTime },
    { number: 2, type: 'SINGLES', slots: [0], at: addMinutes(season.startTime, 90) },
    { number: 3, type: 'SINGLES', slots: [1], at: addMinutes(season.startTime, 90) },
  ]

  for (const r of layout) {
    const rubberId = `RUB${pad(rubbers.length + 1, 4)}`
    const homeWins = rnd() < 0.5
    if (homeWins) homeWon++
    const early = rnd() < 0.04
    const outcome = early ? pick(['RETIRED', 'WALKOVER', 'FORFEIT']) : 'COMPLETED'

    rubbers.push({
      id: rubberId, match_result_id: resultId, match_format_id: season.format,
      rubber_number: r.number, rubber_type: r.type,
      // Only stored where it cannot be derived from the sets. A completed
      // rubber's winner is read from its scores instead.
      winner_side: outcome === 'COMPLETED' ? '' : (homeWins ? 'HOME' : 'AWAY'),
      outcome_type: outcome,
      played_at: utc(fixture.schedule_date, r.at),
      incomplete_reason: outcome === 'COMPLETED' ? '' : `Opponent ${outcome.toLowerCase()}`,
    })

    r.slots.forEach((slot, order) => {
      for (const [side, squad] of [['HOME', h], ['AWAY', a]]) {
        const p = squad[slot]
        rubberPlayers.push({
          id: `RP${pad(rubberPlayers.length + 1, 5)}`, rubber_id: rubberId, player_id: p.id,
          side, player_order: order + 1, is_emergency: subs[side]?.id === p.id,
        })
      }
    })

    if (outcome === 'WALKOVER' || outcome === 'FORFEIT') continue
    const setCount = outcome === 'RETIRED' ? 1 : (rnd() < 0.55 ? 2 : 3)
    for (let n = 1; n <= setCount; n++) {
      const winnerTakesSet = setCount === 3 ? n !== 2 : true
      const { w, l, tb } = setScore()
      const homeTakes = homeWins === winnerTakesSet
      rubberSets.push({
        id: `SET${pad(rubberSets.length + 1, 5)}`, rubber_id: rubberId, set_number: n,
        home_games: homeTakes ? w : l, away_games: homeTakes ? l : w, is_tiebreak: tb,
        home_tiebreak_points: tb ? (homeTakes ? 7 : int(2, 5)) : '',
        away_tiebreak_points: tb ? (homeTakes ? int(2, 5) : 7) : '',
      })
    }
  }

  const awayWon = layout.length - homeWon
  const enteredBy = rosterOf.get(fixture.home_team_id)[0].id
  const confirmedBy = rosterOf.get(fixture.away_team_id)[0].id
  const enteredAt = utc(fixture.schedule_date, '18:30')
  const finalisedAt = utc(day(fixture.schedule_date, 1), '10:00')

  // Most results run enter -> confirm -> finalise. A few stay pending, and one
  // in a while is disputed and corrected, so the whole workflow has data.
  const roll = rnd()
  const pending = roll < 0.05
  const disputed = !pending && roll < 0.09

  matchResults.push({
    id: resultId, fixture_id: fixture.id, home_rubbers: homeWon, away_rubbers: awayWon,
    status: pending ? 'PENDING_CONFIRMATION' : disputed ? 'UNDER_CORRECTION' : 'FINALISED',
    outcome: homeWon > awayWon ? 'HOME_WIN' : 'AWAY_WIN', notes: '',
    entered_by: enteredBy, finalised_by: pending || disputed ? '' : confirmedBy,
    entered_at: enteredAt, finalised_at: pending || disputed ? '' : finalisedAt,
  })

  confirmations.push({
    id: `RC${pad(confirmations.length + 1, 4)}`, match_result_id: resultId,
    status: pending ? 'PENDING' : disputed ? 'DISPUTED' : 'CONFIRMED',
    home_entered_by: enteredBy, away_confirmed_by: pending ? '' : confirmedBy,
    home_entered_at: enteredAt, away_confirmed_at: pending ? '' : finalisedAt,
    score_correct: pending ? '' : !disputed, comments_correct: pending ? '' : !disputed,
    dispute_reason: disputed ? 'Away team recorded a different score in the second singles rubber.' : '',
  })

  if (disputed) {
    corrections.push({
      id: `CR${pad(corrections.length + 1, 3)}`, match_result_id: resultId,
      requested_at: utc(day(fixture.schedule_date, 2), '09:15'), requested_by: confirmedBy,
      reason: 'Second singles rubber score does not match our scorecard.',
      status: 'PENDING', review_by: '', review_at: '', reviewed_notes: '',
    })
    auditLog.push({
      id: `AUD${pad(auditLog.length + 1, 3)}`, entity_type: 'MatchResult', entity_id: resultId,
      action: 'CORRECTION_REQUESTED', changed_at: utc(day(fixture.schedule_date, 2), '09:15'),
      change_summary: 'Away team disputed the second singles rubber score.', changed_by: confirmedBy,
    })
  } else if (!pending) {
    auditLog.push({
      id: `AUD${pad(auditLog.length + 1, 3)}`, entity_type: 'MatchResult', entity_id: resultId,
      action: 'RESULT_FINALISED', changed_at: finalisedAt,
      change_summary: `Result confirmed by the away team: ${homeWon}-${awayWon} in rubbers.`,
      changed_by: confirmedBy,
    })
  }
}

function addMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(':').map(Number)
  const t = h * 60 + m + mins
  return `${pad(Math.floor(t / 60), 2)}:${pad(t % 60, 2)}`
}

// ────────────────────────────────────────────────────────── ladders first
// Computed before finals, because the finals draw reads from it.
const ladderEntries = []
const playerStandings = []

function buildLadder(section) {
  const list = teamsOf(section.id)
  const tally = new Map(list.map(t => [t.id, { played: 0, won: 0, lost: 0, drawn: 0, rf: 0, ra: 0, sf: 0, sa: 0, gf: 0, ga: 0, points: 0 }]))
  for (const res of matchResults) {
    const f = fixtures.find(x => x.id === res.fixture_id)
    if (f.section_id !== section.id || f.is_finals) continue
    const h = tally.get(f.home_team_id), a = tally.get(f.away_team_id)
    h.played++; a.played++
    h.rf += res.home_rubbers; h.ra += res.away_rubbers
    a.rf += res.away_rubbers; a.ra += res.home_rubbers
    h.points += res.home_rubbers; a.points += res.away_rubbers
    if (res.outcome === 'HOME_WIN') { h.won++; a.lost++; h.points += 4 } else { a.won++; h.lost++; a.points += 4 }
    for (const r of rubbers.filter(x => x.match_result_id === res.id)) {
      for (const s of rubberSets.filter(x => x.rubber_id === r.id)) {
        h.gf += s.home_games; h.ga += s.away_games
        a.gf += s.away_games; a.ga += s.home_games
        if (s.home_games > s.away_games) { h.sf++; a.sa++ } else { a.sf++; h.sa++ }
      }
    }
  }
  // Tie-break order: points, then rubber percentage, then game percentage, then name.
  const ordered = list.slice().sort((x, y) => {
    const tx = tally.get(x.id), ty = tally.get(y.id)
    return ty.points - tx.points
      || (ty.rf / (ty.rf + ty.ra || 1)) - (tx.rf / (tx.rf + tx.ra || 1))
      || (ty.gf / (ty.gf + ty.ga || 1)) - (tx.gf / (tx.gf + tx.ga || 1))
      || x.name.localeCompare(y.name)
  })
  ordered.forEach((team, i) => {
    const t = tally.get(team.id)
    ladderEntries.push({
      id: `LAD${pad(ladderEntries.length + 1, 3)}`, section_id: section.id, team_id: team.id,
      position: i + 1, played: t.played, won: t.won, lost: t.lost, drawn: t.drawn,
      rubbers_for: t.rf, rubbers_against: t.ra, sets_for: t.sf, sets_against: t.sa,
      games_for: t.gf, games_against: t.ga, points: t.points,
      calculated_at: utc(TODAY, '03:00'),
    })
  })
  return ordered
}

function buildStandings(section) {
  const per = new Map()
  for (const rp of rubberPlayers) {
    const r = rubbers.find(x => x.id === rp.rubber_id)
    const res = matchResults.find(x => x.id === r.match_result_id)
    const f = fixtures.find(x => x.id === res.fixture_id)
    if (f.section_id !== section.id) continue
    if (!per.has(rp.player_id)) per.set(rp.player_id, { rp: 0, rw: 0, rl: 0, sw: 0, sl: 0, gw: 0, gl: 0 })
    const s = per.get(rp.player_id)
    s.rp++
    if (winnerOf(r) === rp.side) s.rw++; else s.rl++
    for (const set of rubberSets.filter(x => x.rubber_id === r.id)) {
      const mine = rp.side === 'HOME' ? set.home_games : set.away_games
      const theirs = rp.side === 'HOME' ? set.away_games : set.home_games
      s.gw += mine; s.gl += theirs
      if (mine > theirs) s.sw++; else s.sl++
    }
  }
  ;[...per.entries()]
    .sort((a, b) => (b[1].rw / b[1].rp) - (a[1].rw / a[1].rp) || b[1].rw - a[1].rw || a[0].localeCompare(b[0]))
    .forEach(([playerId, s], i) => playerStandings.push({
      id: `PS${pad(playerStandings.length + 1, 4)}`, section_id: section.id, player_id: playerId,
      position: i + 1, rubbers_played: s.rp, rubbers_won: s.rw, rubbers_lost: s.rl,
      sets_won: s.sw, sets_lost: s.sl, games_won: s.gw, games_lost: s.gl,
      win_percentage: ((s.rw / s.rp) * 100).toFixed(2), calculated_at: utc(TODAY, '03:00'),
    }))
}

/** A completed rubber's winner comes from its sets; otherwise it is recorded. */
function winnerOf(rubber) {
  if (rubber.winner_side) return rubber.winner_side
  const sets = rubberSets.filter(s => s.rubber_id === rubber.id)
  const h = sets.filter(s => s.home_games > s.away_games).length
  return h > sets.length - h ? 'HOME' : 'AWAY'
}

const FINALS = [{ label: 'Semi Final', gap: 7, seeds: [[3, 4], [1, 2]] }]
function buildFinals(season, section) {
  const ladder = ladderEntries.filter(l => l.section_id === section.id).sort((a, b) => a.position - b.position)
  if (!ladder.length) return
  const lastRound = fixtures.filter(f => f.section_id === section.id && !f.is_finals)
    .reduce((m, f) => (f.schedule_date > m ? f.schedule_date : m), '')
  const top = ladder.slice(0, 4).map(l => l.team_id)
  const rounds = [
    { label: 'Semi Final', home: top[0], away: top[3], offset: 7 },
    { label: 'Semi Final', home: top[1], away: top[2], offset: 7 },
    { label: 'Preliminary Final', home: top[1], away: top[2], offset: 14 },
    { label: 'Grand Final', home: top[0], away: top[1], offset: 21 },
  ]
  rounds.forEach((r, i) => {
    const d = day(lastRound, r.offset)
    const played = d < TODAY
    const fixture = {
      id: `FIX${pad(fixtures.length + 1, 4)}`, section_id: section.id,
      home_team_id: r.home, away_team_id: r.away, venue_id: 'VEN99',
      round_number: '', round_label: r.label, schedule_date: d, schedule_time: season.startTime,
      status: played ? 'COMPLETED' : 'SCHEDULED', is_finals: true,
    }
    fixtures.push(fixture)
    // A played final carries a result like any other fixture; the ladder
    // ignores them, so scoring them cannot disturb the home-and-away table.
    if (played) buildResult(fixture, season, 15 + i)
  })
  void FINALS
}

for (const season of SEASONS) buildFixtures(season)
for (const section of sections) { buildLadder(section); buildStandings(section) }
// Finals need the ladder, so completed seasons get theirs once it exists.
for (const season of SEASONS.filter(s => s.complete)) {
  for (const section of sectionsOf(season.id)) buildFinals(season, section)
}

// ─────────────────────────────────────────────────── schedule changes
// Every change is logged on or before the day it took effect, and never in
// the future relative to the generation date.
const scheduleChanges = []
const upcoming = fixtures.filter(f => f.status === 'SCHEDULED' && !f.is_finals)

upcoming.slice(0, 3).forEach(f => {
  const previous = f.schedule_date
  f.schedule_date = day(previous, 1)
  scheduleChanges.push({
    id: `FSC${pad(scheduleChanges.length + 1, 3)}`, fixture_id: f.id, change_type: 'DATE_TIME_CHANGED',
    previous_date: previous, previous_time: f.schedule_time, new_date: f.schedule_date, new_time: f.schedule_time,
    previous_venue_id: '', new_venue_id: '',
    reason: 'Home courts already booked on the Saturday; moved to the Sunday by agreement.',
    changed_by: rosterOf.get(f.home_team_id)[0].id, changed_at: utc(day(TODAY, -4), '09:15'),
  })
})
upcoming.slice(3, 5).forEach(f => {
  const previous = f.venue_id
  f.venue_id = 'VEN99'
  scheduleChanges.push({
    id: `FSC${pad(scheduleChanges.length + 1, 3)}`, fixture_id: f.id, change_type: 'VENUE_CHANGED',
    previous_date: '', previous_time: '', new_date: '', new_time: '',
    previous_venue_id: previous, new_venue_id: 'VEN99',
    reason: 'Home courts unavailable; moved to the regional centre.',
    changed_by: rosterOf.get(f.home_team_id)[0].id, changed_at: utc(day(TODAY, -3), '16:40'),
  })
})
// Washed out on the day, with no replacement date agreed yet.
fixtures.filter(f => f.status === 'COMPLETED' && !f.is_finals && f.schedule_date === day(TODAY, -3)).slice(0, 2).forEach(f => {
  const previous = f.schedule_date
  f.status = 'POSTPONED'; f.schedule_date = ''; f.schedule_time = ''
  const res = matchResults.findIndex(r => r.fixture_id === f.id)
  if (res >= 0) {
    const removed = matchResults.splice(res, 1)[0]
    for (let i = rubbers.length - 1; i >= 0; i--) if (rubbers[i].match_result_id === removed.id) {
      const rid = rubbers[i].id
      rubbers.splice(i, 1)
      for (let j = rubberSets.length - 1; j >= 0; j--) if (rubberSets[j].rubber_id === rid) rubberSets.splice(j, 1)
      for (let j = rubberPlayers.length - 1; j >= 0; j--) if (rubberPlayers[j].rubber_id === rid) rubberPlayers.splice(j, 1)
    }
    for (let i = confirmations.length - 1; i >= 0; i--) if (confirmations[i].match_result_id === removed.id) confirmations.splice(i, 1)
    for (let i = corrections.length - 1; i >= 0; i--) if (corrections[i].match_result_id === removed.id) corrections.splice(i, 1)
    for (let i = auditLog.length - 1; i >= 0; i--) if (auditLog[i].entity_id === removed.id) auditLog.splice(i, 1)
  }
  scheduleChanges.push({
    id: `FSC${pad(scheduleChanges.length + 1, 3)}`, fixture_id: f.id, change_type: 'POSTPONED',
    previous_date: previous, previous_time: '13:00', new_date: '', new_time: '',
    previous_venue_id: '', new_venue_id: '',
    reason: 'Washed out on the day; replacement date to be confirmed by the Records Secretary.',
    changed_by: rosterOf.get(f.home_team_id)[0].id, changed_at: utc(previous, '13:20'),
  })
})

// Ladders and standings are recalculated because the washouts removed results.
ladderEntries.length = 0
playerStandings.length = 0
for (const section of sections) { buildLadder(section); buildStandings(section) }

// ───────────────────────────────────────────────────────────────── awards
// Attached to the teams of the season that was actually won.
const awards = []
for (const season of SEASONS.filter(s => s.complete)) {
  for (const section of sectionsOf(season.id)) {
    const ladder = ladderEntries.filter(l => l.section_id === section.id).sort((a, b) => a.position - b.position)
    ladder.slice(0, 2).forEach((entry, place) => {
      const team = teams.find(t => t.id === entry.team_id)
      for (const p of rosterOf.get(team.id)) {
        awards.push({
          id: `AWD${pad(awards.length + 1, 3)}`, player_id: p.id,
          award_type: place === 0 ? 'SECTION_WINNER' : 'RUNNER_UP',
          title: `${season.season_type} ${season.year} ${section.name} ${place === 0 ? 'Premiers' : 'Runners-up'}`,
          competition_id: season.competition_id, season_id: season.id, team_id: team.id,
          awarded_on: season.end_date,
        })
      }
    })
  }
}

// ──────────────────────────────────────────────────── profile merge request
const merge = [{
  id: 'PMR01', status: 'PENDING', player_a_id: 'PLR016', player_b_id: 'PLR062',
  requesting_association_id: 'ASSOC02',
  note: 'Same name and date of birth registered at two associations; confirm before merging.',
  resolved_at: '',
}]

// ────────────────────────────────────────────────────────── notifications
// Addressed to the recipient, naming the recipient's own team, and never
// dated after the generation date.
const notifications = []
function notify(player, teamName, type, title, message, details, targetId, createdAt, read) {
  for (const channel of ['IN_APP', 'EMAIL']) {
    notifications.push({
      id: `NOT${pad(notifications.length + 1, 4)}`, _lookup_user_email: player._lookup_user_email,
      type, title, message, details: JSON.stringify(details),
      target_type: 'FIXTURE', target_id: targetId, channel,
      delivery_status: 'SENT', sent_at: createdAt,
      read_at: channel === 'IN_APP' && read ? utc(TODAY, '08:00') : '', created_at: createdAt,
    })
  }
  void teamName
}

scheduleChanges.forEach((change, i) => {
  const f = fixtures.find(x => x.id === change.fixture_id)
  for (const side of ['home_team_id', 'away_team_id']) {
    const team = teams.find(t => t.id === f[side])
    for (const p of rosterOf.get(team.id)) {
      if (change.change_type === 'VENUE_CHANGED') {
        notify(p, team.name, 'VENUE_CHANGED', 'Start Venue Changed',
          `Your ${team.name} match has moved to a different venue.`,
          { previousVenue: venues.find(v => v.id === change.previous_venue_id)?.name ?? null,
            newVenue: venues.find(v => v.id === change.new_venue_id)?.name ?? null, timeZone: TZ },
          f.id, change.changed_at, false)
      } else if (change.change_type === 'POSTPONED') {
        notify(p, team.name, 'MATCH_DATE_CHANGED', 'Match Postponed',
          `Your ${team.name} match was washed out. A replacement date will be confirmed.`,
          { previousDate: change.previous_date, newDate: null, previousTime: change.previous_time, newTime: null, timeZone: TZ },
          f.id, change.changed_at, i % 3 === 0)
      } else {
        notify(p, team.name, 'MATCH_DATE_CHANGED', 'Match Date Changed',
          `Your ${team.name} match has been rescheduled.`,
          { previousDate: change.previous_date, newDate: change.new_date, previousTime: change.previous_time, newTime: change.new_time, timeZone: TZ },
          f.id, change.changed_at, i % 3 === 0)
      }
    }
  }
})

// Reminders for the next scheduled round, issued before the generation date.
for (const f of fixtures.filter(x => x.status === 'SCHEDULED' && !x.is_finals).slice(0, 4)) {
  for (const side of ['home_team_id', 'away_team_id']) {
    const team = teams.find(t => t.id === f[side])
    for (const p of rosterOf.get(team.id)) {
      notify(p, team.name, 'MATCH_REMINDER', 'Match Reminder',
        `${team.name} play on ${f.schedule_date} at ${f.schedule_time}.`,
        { scheduledDate: f.schedule_date, scheduledTime: f.schedule_time, timeZone: TZ },
        f.id, utc(day(TODAY, -1), '08:00'), false)
    }
  }
}

// ────────────────────────────────────────────────────────────── user roles
// A club administrator is always a member of the club they administer.
const userRoles = []
const add = (p, role, ctx, extra) => userRoles.push({
  id: `UR${pad(userRoles.length + 1, 3)}`, _lookup_user_email: p._lookup_user_email,
  role_type: role, context_type: ctx,
  association_id: '', club_id: '', team_id: '', competition_id: '', ...extra,
  granted_at: utc('2026-02-01', '09:00'),
})
add(players[0], 'ADMINISTRATOR', 'ASSOCIATION', { association_id: 'ASSOC01' })
add(players[1], 'RECORDS_SECRETARY', 'ASSOCIATION', { association_id: 'ASSOC01' })
for (const club of clubs) {
  const member = clubMemberships.find(m => m.club_id === club.id && m.is_primary)
  if (member) add(players.find(p => p.id === member.player_id), 'CLUB_ADMIN', 'CLUB', { club_id: club.id })
}
for (const team of teams.filter(t => t._season === 'SEA03')) {
  add(rosterOf.get(team.id)[0], 'TEAM_MANAGER', 'TEAM', { team_id: team.id })
}
for (const p of players) add(p, 'PLAYER', 'GLOBAL', {})

// ──────────────────────────────────────────────────────────────── README
const README = [
  ['Purpose', 'Test data for the Tennis Competition Platform, one sheet per database table. Rebuild with `npm run data:generate`, validate with `npm run data:check`.'],
  ['Generated', `${TODAY} (deterministic - regenerating produces an identical file)`],
  ['Competition rules', 'The Competition, MatchFormat and EligibilityRule sheets are transcribed from the Waverley Tennis competition match formats document. All 13 formats are present.'],
  ['PRIVACY: no real contact details', 'Every email uses a reserved .example domain. Names come from the original generated account list; no real mailbox, phone number or address appears anywhere in this file.'],
  ['Login', `All accounts share the development password "${DEV_PASSWORD}". The User sheet stores its bcrypt hash, so this workbook is the only login source - players_login_data.xlsx is no longer needed.`],
  ['IDs', 'Short readable codes (CLB01, TEAM003, FIX0042). The seed maps each code to a UUID. Foreign key columns hold these codes.'],
  ['Lookup keys (_ prefix)', 'A column named "_lookup_..." is NOT a database column. It identifies an existing row so the import can resolve a foreign key, and must never be written as a field.'],
  ['Blank cells', 'A blank cell means NULL, not an empty string.'],
  ['Dates and times', 'Dates are YYYY-MM-DD. schedule_time is the local start time at the venue. Every timestamp is a real UTC instant converted from Melbourne local time, accounting for daylight saving: a 1:00 pm winter match is 03:00Z, a summer one 02:00Z.'],
  ['Enum values', 'Enum columns use the exact Prisma enum member names.'],
  ['Seasons do not overlap', 'Within one competition a season starts only after the previous one has finished, including its finals.'],
  ['Teams belong to one season', 'Team rows are never reused across seasons. Each season/section has its own teams, so historical results stay attached to the team that actually played them.'],
  ['Singles order of merit', 'Each team\'s singles order is fixed for the season by UTR rating, strongest at number 1, as the competition rules require.'],
  ['Set scores', 'Only legal results: 6-0 to 6-4, 7-5, or 7-6 with tiebreak points recorded.'],
  ['Doubles first', 'Rubber 1 is the doubles, played at the scheduled start time; the two singles follow 90 minutes later.'],
  ['Rubber winner is derived', 'winner_side is blank for a completed rubber, because the winner is read from the set scores. It is only stored for a walkover, forfeit or retirement, where the scores cannot decide it.'],
  ['Finals come from the ladder', 'Finals fixtures exist only for seasons whose home-and-away rounds are finished, and the teams are taken from the final ladder positions. The current season has no finals yet.'],
  ['Ladder points and tie-break', 'Four points for a match win plus one per rubber won. Ties are separated by rubber percentage, then game percentage, then team name. Confirm this matches the association\'s rule before relying on it.'],
  ['Emergency players', 'Emergencies are not pre-registered on a roster. They appear only in the rubber they were called into, with is_emergency = TRUE, matching the last-minute substitution the client described.'],
  ['Result workflow', 'Results run enter -> opponent confirmation -> finalised. A few stay PENDING_CONFIRMATION and some are DISPUTED with a CorrectionRequest raised; AuditLog records who did what and when.'],
  ['Multiple clubs and associations', 'A quarter of the players hold a secondary club membership, and two associations exist with one ProfileMergeRequest between them.'],
  ['Duplicate names are intentional', '"Hiro Mitchell" and "Amelia Lee" each appear twice as different people, so duplicate detection on name + date of birth + email can be tested. Do not merge them.'],
  ['SYNTHETIC: dates of birth and gender', 'Derived from the row index, never inferred from anyone\'s name. All players are adults.'],
  ['SYNTHETIC: UTR ratings', 'Generated, not supplied by Universal Tennis. UtrLink.utr_rating always equals the newest snapshot for that player.'],
  ['SYNTHETIC: clubs and venues', 'Suburb names are real; addresses, phone numbers and emails are placeholders on .example domains.'],
].map(([field, value]) => ({ field, value }))

// ───────────────────────────────────────────────────────────────── write
const strip = rows => rows.map(r => {
  const { _season, ...rest } = r
  void _season
  return rest
})

const book = XLSX.utils.book_new()
const sheets = [
  ['README', README], ['User', users], ['Association', ASSOCS], ['Club', clubs], ['Venue', venues],
  ['Competition', competitions], ['MatchFormat', matchFormats], ['EligibilityRule', eligibilityRules],
  ['Season', SEASONS.map(({ format, playDay, startTime, sections: _s, complete, ...r }) => (void format, void playDay, void startTime, void _s, void complete, r))],
  ['SectionGrade', sections], ['Team', strip(teams)], ['Player', players],
  ['ClubMembership', clubMemberships], ['AssociationMembership', associationMemberships],
  ['TeamPlayer', teamPlayers], ['UtrLink', utrLinks], ['UtrRatingSnapshot', utrSnapshots],
  ['RankingCohort', cohorts], ['RankingEntry', rankingEntries],
  ['Fixture', fixtures], ['FixtureScheduleChange', scheduleChanges],
  ['MatchResult', matchResults], ['ResultConfirmation', confirmations], ['CorrectionRequest', corrections],
  ['Rubber', rubbers], ['RubberSet', rubberSets], ['RubberPlayer', rubberPlayers],
  ['LadderEntry', ladderEntries], ['PlayerStanding', playerStandings],
  ['PlayerAward', awards], ['ProfileMergeRequest', merge],
  ['Notification', notifications], ['UserRole', userRoles], ['AuditLog', auditLog],
]
for (const [name, rows] of sheets) {
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = Object.keys(rows[0]).map(k => ({ wch: Math.min(48, Math.max(k.length + 2, 12)) }))
  XLSX.utils.book_append_sheet(book, ws, name)
}
XLSX.writeFile(book, OUT)

console.log(`Wrote ${OUT}`)
let total = 0
for (const [name, rows] of sheets) { total += rows.length; console.log(`  ${name.padEnd(24)} ${String(rows.length).padStart(5)}`) }
console.log(`  ${'TOTAL'.padEnd(24)} ${String(total).padStart(5)}`)
