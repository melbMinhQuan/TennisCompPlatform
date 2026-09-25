/**
 * Checks competition_data.xlsx against the rules the data has to obey, rather
 * than against itself: the Waverley Tennis match-format document, the client's
 * sprint feedback, and the dashboard the data has to fill.
 *
 * Every rule here exists because the data once broke it. Keep them.
 */
const REPO = require('node:path').resolve(__dirname, '../..')
const XLSX = require(`${REPO}/node_modules/xlsx`)
const path = require('node:path')

const TODAY = '2026-09-22'
const wb = XLSX.readFile(process.argv[2] || path.join(__dirname, 'competition_data.xlsx'))
const S = {}
for (const n of wb.SheetNames) S[n] = XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: '' })

const problems = []
const warnings = []
const bad = m => problems.push(m)
const warn = m => warnings.push(m)
const count = (label, n) => n && bad(`${label}: ${n}`)

const utr = new Map(S.UtrLink.map(u => [u.player_id, Number(u.utr_rating)]))
const teamById = new Map(S.Team.map(t => [t.id, t]))
const fixtureById = new Map(S.Fixture.map(f => [f.id, f]))
const resultById = new Map(S.MatchResult.map(r => [r.id, r]))
const rubberById = new Map(S.Rubber.map(r => [r.id, r]))

// ── Privacy: no real mailbox may appear in test data
count('players with a non-.example address',
  S.Player.filter(p => !/\.example$/.test(String(p._lookup_user_email))).length)
count('User rows with a non-.example address',
  S.User.filter(u => !/\.example$/.test(String(u.email))).length)
count('contact addresses outside .example',
  S.Player.filter(p => p.email !== '' && !/\.example$/.test(String(p.email))).length)

// ── Legal tennis set scores: 6-0..6-4, 7-5, or 7-6 on a tiebreak
const illegal = S.RubberSet.filter(s => {
  const [w, l] = [s.home_games, s.away_games].sort((a, b) => b - a)
  if (w === 6) return !(l >= 0 && l <= 4)
  if (w === 7) return !(l === 5 || (l === 6 && s.is_tiebreak === true))
  return true
})
count('sets with an impossible score', illegal.length)
if (illegal.length) warn(`first illegal set: ${illegal[0].id} ${illegal[0].home_games}-${illegal[0].away_games}`)
count('tiebreak sets missing tiebreak points',
  S.RubberSet.filter(s => s.is_tiebreak === true && (s.home_tiebreak_points === '' || s.away_tiebreak_points === '')).length)

// ── Times are real UTC instants, so a 1:00 pm match reads as 1:00 pm locally
const localHour = iso => Number(new Intl.DateTimeFormat('en-AU', {
  timeZone: 'Australia/Melbourne', hour: '2-digit', hour12: false,
}).format(new Date(iso)))
const offHours = S.Rubber.filter(r => {
  const f = fixtureById.get(resultById.get(r.match_result_id).fixture_id)
  if (!f.schedule_time) return false
  const scheduled = Number(f.schedule_time.slice(0, 2))
  const actual = localHour(r.played_at)
  return actual < scheduled || actual > scheduled + 6 // PDF: no set starts after 6:30pm
})
count('rubbers played outside the scheduled window in local time', offHours.length)
if (offHours.length) {
  const r = offHours[0]
  warn(`first: ${r.id} stored ${r.played_at} = ${localHour(r.played_at)}:00 Melbourne`)
}

// ── PDF: the doubles rubber is played first
for (const res of S.MatchResult) {
  const rs = S.Rubber.filter(r => r.match_result_id === res.id).sort((a, b) => a.rubber_number - b.rubber_number)
  if (rs.length && rs[0].rubber_type !== 'DOUBLES') { bad('rubber 1 is not the doubles rubber'); break }
}

// ── Singles are played in order of merit, strongest at number 1
let outOfOrder = 0, lineups = 0
for (const res of S.MatchResult) {
  const singles = S.Rubber.filter(r => r.match_result_id === res.id && r.rubber_type === 'SINGLES')
    .sort((a, b) => a.rubber_number - b.rubber_number)
  if (singles.length < 2) continue
  for (const side of ['HOME', 'AWAY']) {
    const picks = singles.map(r => S.RubberPlayer.find(p => p.rubber_id === r.id && p.side === side))
    if (picks.some(p => !p) || picks.some(p => p.is_emergency === true)) continue
    lineups++
    if (utr.get(picks[0].player_id) < utr.get(picks[1].player_id)) outOfOrder++
  }
}
count(`singles line-ups where number 1 is rated below number 2 (of ${lineups})`, outOfOrder)

// ── Nothing is dated after the day the workbook was generated
const future = (sheet, col) => (S[sheet] ?? []).filter(r => r[col] && String(r[col]).slice(0, 10) > TODAY).length
count('schedule changes dated in the future', future('FixtureScheduleChange', 'changed_at'))
count('notifications dated in the future', future('Notification', 'created_at'))
count('audit entries dated in the future', future('AuditLog', 'changed_at'))
count('results entered in the future', future('MatchResult', 'entered_at'))
count('awards dated in the future', future('PlayerAward', 'awarded_on'))

// ── A change is logged on or after the thing it changed, never before
for (const c of S.FixtureScheduleChange) {
  if (c.previous_date && String(c.changed_at).slice(0, 10) > c.previous_date) {
    bad(`${c.id}: logged after the match it postponed`)
  }
  if (c.change_type === 'POSTPONED' && String(c.changed_at).slice(0, 10) !== c.previous_date) {
    warn(`${c.id}: a washout should be logged on the day of the match`)
  }
}

// ── A club administrator belongs to the club they administer
const memberOf = new Set(S.ClubMembership.map(m => `${m.player_id}|${m.club_id}`))
const playerByLogin = new Map(S.Player.map(p => [p._lookup_user_email, p]))
count('club admins who are not members of their club',
  S.UserRole.filter(r => r.role_type === 'CLUB_ADMIN')
    .filter(r => !memberOf.has(`${playerByLogin.get(r._lookup_user_email)?.id}|${r.club_id}`)).length)

// ── A notification names the recipient's own team
let wrongTeam = 0
for (const n of S.Notification) {
  const p = playerByLogin.get(n._lookup_user_email)
  const f = fixtureById.get(n.target_id)
  if (!p || !f) continue
  const mine = [f.home_team_id, f.away_team_id]
    .map(id => teamById.get(id))
    .find(t => S.TeamPlayer.some(tp => tp.team_id === t.id && tp.player_id === p.id))
  if (mine && !String(n.message).includes(mine.name)) wrongTeam++
}
count('notifications naming a team other than the recipient\'s', wrongTeam)

// ── UtrLink agrees with the newest snapshot: one player, one current rating
count('players whose UtrLink disagrees with their newest snapshot',
  S.UtrLink.filter(u => {
    const snaps = S.UtrRatingSnapshot.filter(s => s.player_id === u.player_id && s.discipline === 'SINGLES')
      .sort((a, b) => String(a.recorded_at).localeCompare(String(b.recorded_at)))
    return !snaps.length || Math.abs(Number(snaps[snaps.length - 1].rating) - Number(u.utr_rating)) > 0.001
  }).length)

// ── Seasons in one competition never overlap
for (const comp of S.Competition) {
  const list = S.Season.filter(s => s.competition_id === comp.id)
    .sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)))
  for (let i = 1; i < list.length; i++) {
    if (list[i].start_date <= list[i - 1].end_date) {
      bad(`${comp.name}: ${list[i].id} starts ${list[i].start_date} before ${list[i - 1].id} ends ${list[i - 1].end_date}`)
    }
  }
}

// ── A team belongs to exactly one season, never reused across them
const seasonOfSection = new Map(S.SectionGrade.map(s => [s.id, s.season_id]))
for (const a of S.PlayerAward) {
  if (!a.team_id || !a.season_id) continue
  const team = teamById.get(a.team_id)
  if (seasonOfSection.get(team.section_id) !== a.season_id) {
    bad(`${a.id}: award for ${a.season_id} points at ${a.team_id}, a team from ${seasonOfSection.get(team.section_id)}`)
  }
}
count('sections declaring teams but having none',
  S.SectionGrade.filter(s => s.team_count > 0 && !S.Team.some(t => t.section_id === s.id)).length)

// ── Membership history precedes the honours it is supposed to explain
for (const a of S.PlayerAward) {
  const team = teamById.get(a.team_id)
  if (!team || !a.awarded_on) continue
  const m = S.ClubMembership.find(x => x.player_id === a.player_id && x.club_id === team.club_id)
  if (!m) { bad(`${a.id}: ${a.player_id} has no membership at ${team.club_id}`); continue }
  if (m.start_date && m.start_date > a.awarded_on) {
    bad(`${a.id}: ${a.player_id} joined ${team.club_id} on ${m.start_date}, after winning on ${a.awarded_on}`)
  }
}
if (new Set(S.ClubMembership.map(m => m.start_date)).size < 3) {
  bad('every club membership shares one start date; there is no joined history')
}

// ── Finals are drawn from the final ladder, and only once the season is over
for (const sec of S.SectionGrade) {
  const finals = S.Fixture.filter(f => f.section_id === sec.id && f.is_finals === true)
  const regular = S.Fixture.filter(f => f.section_id === sec.id && f.is_finals !== true)
  if (!finals.length) continue
  const unplayed = regular.filter(f => f.status !== 'COMPLETED').length
  if (unplayed) bad(`${sec.id}: finals exist while ${unplayed} home-and-away fixtures are unplayed`)
  const ladder = S.LadderEntry.filter(l => l.section_id === sec.id).sort((a, b) => a.position - b.position)
  const top4 = new Set(ladder.slice(0, 4).map(l => l.team_id))
  for (const f of finals) {
    for (const id of [f.home_team_id, f.away_team_id]) {
      if (!top4.has(id)) bad(`${f.id}: ${teamById.get(id)?.name} is in the finals but finished ${ladder.find(l => l.team_id === id)?.position}`)
    }
  }
  if (!finals.every(f => f.round_label)) bad(`${sec.id}: a finals fixture has no round label`)
}

// ── Each finals round is contested by teams that won their way there, and the
// premiership follows the grand final rather than the ladder.
for (const sec of S.SectionGrade) {
  const finals = S.Fixture.filter(f => f.section_id === sec.id && f.is_finals === true)
  if (!finals.length) continue
  const winnerOfFixture = f => {
    const res = S.MatchResult.find(m => m.fixture_id === f.id)
    return res ? (res.outcome === 'HOME_WIN' ? f.home_team_id : f.away_team_id) : null
  }
  const semis = finals.filter(f => f.round_label === 'Semi Final')
  const prelim = finals.find(f => f.round_label === 'Preliminary Final')
  const grand = finals.find(f => f.round_label === 'Grand Final')

  if (prelim) {
    const eligible = new Set(semis.flatMap(f => {
      const w = winnerOfFixture(f)
      return w ? [w, w === f.home_team_id ? f.away_team_id : f.home_team_id] : []
    }))
    for (const id of [prelim.home_team_id, prelim.away_team_id]) {
      if (!eligible.has(id)) bad(`${prelim.id}: ${teamById.get(id)?.name} did not come through a semi final`)
    }
    if (prelim.home_team_id === prelim.away_team_id) bad(`${prelim.id}: same team on both sides`)
    // The team eliminated in a semi cannot reappear.
    const eliminated = semis.map(f => {
      const w = winnerOfFixture(f)
      return w && w === f.home_team_id ? f.away_team_id : f.home_team_id
    })
    if (eliminated.filter(Boolean).length === 2) {
      const stillAlive = [prelim.home_team_id, prelim.away_team_id]
      if (eliminated.every(e => stillAlive.includes(e))) bad(`${prelim.id}: both semi losers are in the preliminary final`)
    }
  }
  if (grand) {
    const survivors = new Set([winnerOfFixture(semis[0]), prelim && winnerOfFixture(prelim)].filter(Boolean))
    for (const id of [grand.home_team_id, grand.away_team_id]) {
      if (survivors.size && !survivors.has(id)) {
        bad(`${grand.id}: ${teamById.get(id)?.name} reached the grand final without winning its previous match`)
      }
    }
    const champion = winnerOfFixture(grand)
    const season = seasonOfSection.get(sec.id)
    const premiers = [...new Set(S.PlayerAward
      .filter(a => a.season_id === season && a.award_type === 'SECTION_WINNER').map(a => a.team_id))]
    if (champion && premiers.length && !premiers.includes(champion)) {
      bad(`${season}: ${teamById.get(champion)?.name} won the grand final but ${teamById.get(premiers[0])?.name} is named premiers`)
    }
    for (const a of S.PlayerAward.filter(x => x.season_id === season)) {
      if (a.awarded_on && a.awarded_on < grand.schedule_date) {
        bad(`${a.id}: awarded ${a.awarded_on}, before the grand final on ${grand.schedule_date}`)
      }
    }
  }
}

// ── A season's dates cover everything played in it, finals included
for (const season of S.Season) {
  const secs = S.SectionGrade.filter(s => s.season_id === season.id).map(s => s.id)
  for (const f of S.Fixture.filter(x => secs.includes(x.section_id) && x.schedule_date)) {
    if (season.end_date && f.schedule_date > season.end_date) {
      bad(`${f.id}: ${f.round_label || 'round ' + f.round_number} on ${f.schedule_date}, after ${season.id} ends ${season.end_date}`)
    }
  }
}

// ── Rubbers match the format their season claims to be played under
for (const season of S.Season) {
  const secs = S.SectionGrade.filter(s => s.season_id === season.id).map(s => s.id)
  const results = S.MatchResult.filter(m => S.Fixture.some(f => f.id === m.fixture_id && secs.includes(f.section_id)))
  if (!results.length) continue
  const rs = S.Rubber.filter(r => results.some(m => m.id === r.match_result_id))
  const formatId = [...new Set(rs.map(r => r.match_format_id))]
  if (formatId.length > 1) { bad(`${season.id}: rubbers claim several formats`); continue }
  const format = S.MatchFormat.find(f => f.id === formatId[0])
  if (!format) continue
  const perMatch = rs.length / results.length
  const singles = rs.filter(r => r.rubber_type === 'SINGLES').length / results.length
  const doubles = rs.filter(r => r.rubber_type === 'DOUBLES').length / results.length
  if (perMatch !== format.rubber_count) bad(`${season.id}: ${perMatch} rubbers per match, ${format.name} declares ${format.rubber_count}`)
  if (singles !== format.singles_count) bad(`${season.id}: ${singles} singles per match, format declares ${format.singles_count}`)
  if (doubles !== format.doubles_count) bad(`${season.id}: ${doubles} doubles per match, format declares ${format.doubles_count}`)
  const maxSets = format.set_to_win === 1 ? 1 : format.set_to_win * 2 - 1
  const over = rs.filter(r => S.RubberSet.filter(s => s.rubber_id === r.id).length > maxSets).length
  if (over) bad(`${season.id}: ${over} rubbers have more than ${maxSets} set(s), which ${format.name} does not allow`)
}

// ── A result is entered after its last rubber was played, and finalised after
// it was entered. Comparing instants avoids any timezone guesswork, and it
// catches a night match whose entry time wrapped past midnight onto the
// wrong day.
for (const res of S.MatchResult) {
  if (!res.entered_at) continue
  const played = S.Rubber.filter(r => r.match_result_id === res.id)
    .map(r => r.played_at).filter(Boolean).sort()
  const last = played[played.length - 1]
  if (last && Date.parse(res.entered_at) < Date.parse(last)) {
    bad(`${res.id}: entered ${res.entered_at}, before its last rubber finished at ${last}`)
  }
  if (res.finalised_at && Date.parse(res.finalised_at) < Date.parse(res.entered_at)) {
    bad(`${res.id}: finalised before it was entered`)
  }
}

// ── Nothing is left hanging in a season that has finished
for (const season of S.Season.filter(s => s.status === 'COMPLETED')) {
  const secs = S.SectionGrade.filter(s => s.season_id === season.id).map(s => s.id)
  const results = S.MatchResult.filter(m => S.Fixture.some(f => f.id === m.fixture_id && secs.includes(f.section_id)))
  count(`${season.id} is completed but has unconfirmed results`,
    results.filter(r => r.status !== 'FINALISED').length)
  count(`${season.id} is completed but has unreviewed corrections`,
    S.CorrectionRequest.filter(c => c.status === 'PENDING' && results.some(r => r.id === c.match_result_id)).length)
}
for (const verdict of ['APPROVED', 'REJECTED']) {
  if (!S.CorrectionRequest.some(c => c.status === verdict)) {
    bad(`no correction request was ever ${verdict.toLowerCase()}, so that path cannot be tested`)
  }
}

// ── A merge request pairs two profiles that plausibly are one person
for (const m of S.ProfileMergeRequest) {
  const a = S.Player.find(p => p.id === m.player_a_id)
  const b = S.Player.find(p => p.id === m.player_b_id)
  if (!a || !b) { bad(`${m.id}: references a player that does not exist`); continue }
  if (a.id === b.id) bad(`${m.id}: pairs a profile with itself`)
  const sameName = `${a.first_name} ${a.last_name}` === `${b.first_name} ${b.last_name}`
  if (!sameName) bad(`${m.id}: pairs ${a.first_name} ${a.last_name} with ${b.first_name} ${b.last_name}, who are plainly different people`)
  const assoc = id => new Set(S.AssociationMembership.filter(x => x.player_id === id).map(x => x.association_id))
  const [A, B] = [assoc(a.id), assoc(b.id)]
  if ([...A].every(x => B.has(x)) && [...B].every(x => A.has(x))) {
    warn(`${m.id}: both profiles sit in the same association(s), so the note about two associations does not hold`)
  }
}

// ── Club membership implies membership of that club's association
const assocOfClub = new Map(S.Club.map(c => [c.id, c.association_id]))
count('players in a club whose association they do not belong to',
  S.ClubMembership.filter(m => !S.AssociationMembership
    .some(a => a.player_id === m.player_id && a.association_id === assocOfClub.get(m.club_id))).length)

// ── A blank must be a genuinely empty cell, not an empty string
{
  const raw = {}
  for (const n of wb.SheetNames) raw[n] = XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: undefined })
  let empties = 0
  for (const rows of Object.values(raw)) for (const r of rows) for (const v of Object.values(r)) if (v === '') empties++
  count('cells holding an empty string where NULL was meant', empties)
}

// ── PDF: 6 or 8 team sections, 14 rounds, each pair meeting home and away
for (const sec of S.SectionGrade) {
  const teams = S.Team.filter(t => t.section_id === sec.id)
  if (!teams.length) continue
  if (![6, 8].includes(teams.length)) bad(`${sec.id}: ${teams.length} teams, the document allows 6 or 8`)
  const regular = S.Fixture.filter(f => f.section_id === sec.id && f.is_finals !== true)
  const rounds = new Set(regular.map(f => f.round_number))
  if (rounds.size !== 14) bad(`${sec.id}: ${rounds.size} rounds, the document says 14`)
  const meetings = new Map()
  for (const f of regular) {
    const k = [f.home_team_id, f.away_team_id].sort().join('|')
    meetings.set(k, (meetings.get(k) || 0) + 1)
  }
  for (const [k, n] of meetings) if (n !== 2) bad(`${sec.id}: ${k} meet ${n} times, expected 2`)
  for (const t of teams) {
    const h = regular.filter(f => f.home_team_id === t.id).length
    const a = regular.filter(f => f.away_team_id === t.id).length
    if (h !== a) bad(`${t.id}: ${h} home vs ${a} away`)
  }
  for (const r of rounds) {
    const sides = regular.filter(f => f.round_number === r).flatMap(f => [f.home_team_id, f.away_team_id])
    if (new Set(sides).size !== sides.length) bad(`${sec.id} round ${r}: a team plays twice`)
  }
}

// ── A venue cannot host more concurrent matches than it has courts
const courts = new Map(S.Venue.map(v => [v.id, v.court_count || 0]))
const slots = new Map()
for (const f of S.Fixture) {
  if (!f.schedule_date) continue
  const k = `${f.venue_id}|${f.schedule_date}|${f.schedule_time}`
  slots.set(k, (slots.get(k) || 0) + 1)
}
for (const [k, n] of slots) {
  const [venue] = k.split('|')
  if (n * 2 > courts.get(venue)) bad(`${k}: ${n} matches need ${n * 2} courts, venue has ${courts.get(venue)}`)
}

// ── POSTPONED means the date is gone and the reason is recorded
for (const f of S.Fixture.filter(x => x.status === 'POSTPONED')) {
  if (f.schedule_date !== '' || f.schedule_time !== '') bad(`${f.id}: POSTPONED but still dated`)
  if (!S.FixtureScheduleChange.some(c => c.fixture_id === f.id && c.change_type === 'POSTPONED')) {
    bad(`${f.id}: POSTPONED with no schedule-change row`)
  }
}

// ── Emergency players: called in on the day, not pre-registered
const emergencyAppearances = S.RubberPlayer.filter(r => r.is_emergency === true)
if (!emergencyAppearances.length) bad('no emergency player ever appears, so the (E) rules cannot be tested')
count('emergency players pre-registered on a roster',
  S.TeamPlayer.filter(t => t.status === 'EMERGENCY').length)
for (const rp of emergencyAppearances) {
  const r = rubberById.get(rp.rubber_id)
  const f = fixtureById.get(resultById.get(r.match_result_id).fixture_id)
  const team = rp.side === 'HOME' ? f.home_team_id : f.away_team_id
  if (S.TeamPlayer.some(t => t.team_id === team && t.player_id === rp.player_id)) {
    bad(`${rp.id}: emergency is already on that team's roster`)
  }
}

// ── The result workflow has data at every stage
for (const [label, n] of [
  ['results awaiting confirmation', S.MatchResult.filter(r => r.status === 'PENDING_CONFIRMATION').length],
  ['disputed results', S.ResultConfirmation.filter(c => c.status === 'DISPUTED').length],
  ['correction requests', S.CorrectionRequest.length],
  ['audit entries', S.AuditLog.length],
  ['profile merge requests', S.ProfileMergeRequest.length],
]) if (!n) bad(`the workflow has no ${label}`)
count('finalised results with no recorded author',
  S.MatchResult.filter(r => r.status === 'FINALISED' && !r.entered_by).length)

// ── Client: a player may belong to more than one club, and more than one
// association, and more than one competition must exist
if (!S.ClubMembership.some(m => m.is_primary === false)) bad('no player holds a secondary club membership')
// Exactly one primary club, and one primary association, per player.
for (const [sheet, label] of [['ClubMembership', 'club'], ['AssociationMembership', 'association']]) {
  const byPlayer = new Map()
  for (const m of S[sheet]) {
    if (!byPlayer.has(m.player_id)) byPlayer.set(m.player_id, [])
    byPlayer.get(m.player_id).push(m)
  }
  count(`players with more than one primary ${label}`,
    [...byPlayer.values()].filter(ms => ms.filter(m => m.is_primary === true).length > 1).length)
  count(`players with no primary ${label}`,
    [...byPlayer.values()].filter(ms => !ms.some(m => m.is_primary === true)).length)
}
if (S.Association.length < 2) bad('only one association exists, so merges across associations cannot be tested')
const withFixtures = S.Competition.filter(c =>
  S.Season.filter(s => s.competition_id === c.id)
    .some(s => S.SectionGrade.filter(x => x.season_id === s.id)
      .some(x => S.Fixture.some(f => f.section_id === x.id))))
if (withFixtures.length < 2) bad('fewer than two competitions have any fixtures')
else if (withFixtures.length < S.Competition.length) {
  warn(`${S.Competition.length - withFixtures.length} competition(s) still have no fixtures: ${
    S.Competition.filter(c => !withFixtures.includes(c)).map(c => c.name).join(', ')}`)
}

// ── Every rostered player gets matches, and enough of them to play finals
const appearances = new Map()
for (const rp of S.RubberPlayer) appearances.set(rp.player_id, (appearances.get(rp.player_id) || 0) + 1)
count('rostered players who never appear in a rubber',
  [...new Set(S.TeamPlayer.filter(t => t.status === 'ACTIVE').map(t => t.player_id))]
    .filter(id => !appearances.has(id)).length)
const short = [...new Set(S.TeamPlayer.map(t => t.player_id))].filter(id => (appearances.get(id) || 0) < 3)
if (short.length) warn(`${short.length} players have fewer than 3 matches (finals-ineligible under ELIG01)`)

// ── The dashboard has to be fillable for a real player
const sample = S.Player[0]
// The dashboard shows the player's current team, so pick the one in the season
// that is still running rather than whichever roster row comes first.
const activeSeasons = new Set(S.Season.filter(s => s.status === 'ACTIVE').map(s => s.id))
const activeSections = new Set(S.SectionGrade.filter(s => activeSeasons.has(s.season_id)).map(s => s.id))
const team = S.TeamPlayer
  .filter(t => t.player_id === sample.id)
  .map(t => teamById.get(t.team_id))
  .find(t => t && activeSections.has(t.section_id))
const mine = S.RubberPlayer.filter(r => r.player_id === sample.id)
const snaps = S.UtrRatingSnapshot.filter(s => s.player_id === sample.id && s.discipline === 'SINGLES')
const rank = S.RankingEntry.find(r => r.player_id === sample.id && r.cohort_id === 'COH01')
const inbox = S.Notification.filter(n => n._lookup_user_email === sample._lookup_user_email && n.channel === 'IN_APP')
const next = S.Fixture
  .filter(f => team && [f.home_team_id, f.away_team_id].includes(team.id) && f.schedule_date >= TODAY)
  .sort((a, b) => String(a.schedule_date).localeCompare(String(b.schedule_date)))[0]
const widgets = {
  'Name / Status': `${sample.first_name} ${sample.last_name} / ${sample.status}`,
  'Email (API falls back)': sample.email || `${sample._lookup_user_email} (fallback)`,
  'Club / Team': team ? `${team.name}` : 'MISSING',
  'UTR tiles': snaps.slice(-3).map(s => s.rating).reverse().join(', ') || 'MISSING',
  'Percentile': rank ? `Top ${(100 - Number(rank.percentile_rank)).toFixed(0)}%` : 'MISSING',
  'Notifications': `${inbox.length} (${inbox.filter(n => n.read_at === '').length} unread)`,
  'Career matches': mine.length || 'MISSING',
  'Titles': S.PlayerAward.filter(a => a.player_id === sample.id).length,
  'Next fixture': next ? `${next.schedule_date || 'TBC'} ${next.round_label || 'Round ' + next.round_number}` : 'MISSING',
}
for (const [k, v] of Object.entries(widgets)) if (String(v).includes('MISSING')) bad(`dashboard widget "${k}" cannot be filled`)

console.log(`Sample dashboard - ${sample.first_name} ${sample.last_name}`)
for (const [k, v] of Object.entries(widgets)) console.log(`   ${k.padEnd(24)} ${v}`)
console.log()
console.log(problems.length ? `REQUIREMENTS: ${problems.length} problem(s)` : 'Requirements: all checks passed')
for (const p of problems.slice(0, 30)) console.log('  x ' + p)
if (warnings.length) {
  console.log(`\nNotes (${warnings.length})`)
  for (const w of warnings) console.log('  ! ' + w)
}
process.exitCode = problems.length ? 1 : 0
