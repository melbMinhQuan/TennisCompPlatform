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
const sheets = {}
for (const sheetName of wb.SheetNames) sheets[sheetName] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' })

const problems = []
const warnings = []
const bad = message => problems.push(message)
const warn = message => warnings.push(message)
const count = (label, total) => total && bad(`${label}: ${total}`)

const utr = new Map(sheets.UtrLink.map(utrLink => [utrLink.player_id, Number(utrLink.utr_rating)]))
const teamById = new Map(sheets.Team.map(team => [team.id, team]))
const fixtureById = new Map(sheets.Fixture.map(fixture => [fixture.id, fixture]))
const resultById = new Map(sheets.MatchResult.map(matchResult => [matchResult.id, matchResult]))
const rubberById = new Map(sheets.Rubber.map(rubber => [rubber.id, rubber]))

// ── Privacy: no real mailbox may appear in test data
count('players with a non-.example address',
  sheets.Player.filter(player => !/\.example$/.test(String(player._lookup_user_email))).length)
count('User rows with a non-.example address',
  sheets.User.filter(user => !/\.example$/.test(String(user.email))).length)
count('parent or guardian contacts with a non-.example address',
  sheets.Player.filter(player => player.guardian_email !== '' && !/\.example$/.test(String(player.guardian_email))).length)

// ── Juniors: is_junior agrees with the date of birth, and every junior has a
// parent or guardian to contact (docs/junior-privacy.md). Nobody else has one.
const under18 = player => {
  const [year, ...rest] = String(player.date_of_birth).split('-')
  return `${Number(year) + 18}-${rest.join('-')}` > TODAY
}
count('players whose is_junior disagrees with their date of birth',
  sheets.Player.filter(player => (player.is_junior === true) !== under18(player)).length)
count('juniors with no parent or guardian name, phone or email',
  sheets.Player.filter(player => player.is_junior === true && (player.guardian_name === '' || (player.guardian_phone === '' && player.guardian_email === ''))).length)
count('adults with a parent or guardian on record',
  sheets.Player.filter(player => player.is_junior !== true && [player.guardian_name, player.guardian_phone, player.guardian_email].some(value => value !== undefined && value !== '')).length)
// One junior is deliberately too old for their section, so the association
// admin's eligibility check has something to find. Keep at least one.
const ageOn = (dob, on) => {
  const [year, month, day] = String(dob).split('-').map(Number)
  const [ty, tm, td] = String(on).split('-').map(Number)
  return ty - year - (tm < month || (tm === month && td < day) ? 1 : 0)
}
const sectionById = new Map(sheets.SectionGrade.map(sec => [sec.id, sec]))
const seasonById = new Map(sheets.Season.map(se => [se.id, se]))
const overAge = sheets.TeamPlayer.filter(tp => {
  const player = sheets.Player.find(player => player.id === tp.player_id)
  const sec = sectionById.get(teamById.get(tp.team_id).section_id)
  return player.is_junior === true && sec.max_age !== '' && ageOn(player.date_of_birth, seasonById.get(sec.season_id).start_date) > sec.max_age
})
if (!overAge.length) bad('no junior is outside their section\'s age limit, so the eligibility check has nothing to find')

// ── Legal tennis set scores: 6-0..6-4, 7-5, or 7-6 on a tiebreak
const illegal = sheets.RubberSet.filter(rubberSet => {
  const [winnerGames, loserGames] = [rubberSet.home_games, rubberSet.away_games].sort((left, right) => right - left)
  if (winnerGames === 6) return !(loserGames >= 0 && loserGames <= 4)
  if (winnerGames === 7) return !(loserGames === 5 || (loserGames === 6 && rubberSet.is_tiebreak === true))
  return true
})
count('sets with an impossible score', illegal.length)
if (illegal.length) warn(`first illegal set: ${illegal[0].id} ${illegal[0].home_games}-${illegal[0].away_games}`)
count('tiebreak sets missing tiebreak points',
  sheets.RubberSet.filter(rubberSet => rubberSet.is_tiebreak === true && (rubberSet.home_tiebreak_points === '' || rubberSet.away_tiebreak_points === '')).length)

// ── Times are real UTC instants, so a 1:00 pm match reads as 1:00 pm locally
const localHour = iso => Number(new Intl.DateTimeFormat('en-AU', {
  timeZone: 'Australia/Melbourne', hour: '2-digit', hour12: false,
}).format(new Date(iso)))
const offHours = sheets.Rubber.filter(rubber => {
  const fixture = fixtureById.get(resultById.get(rubber.match_result_id).fixture_id)
  if (!fixture.schedule_time) return false
  const scheduled = Number(fixture.schedule_time.slice(0, 2))
  const actual = localHour(rubber.played_at)
  return actual < scheduled || actual > scheduled + 6 // PDF: no set starts after 6:30pm
})
count('rubbers played outside the scheduled window in local time', offHours.length)
if (offHours.length) {
  const rubber = offHours[0]
  warn(`first: ${rubber.id} stored ${rubber.played_at} = ${localHour(rubber.played_at)}:00 Melbourne`)
}

// ── PDF: the doubles rubber is played first
for (const res of sheets.MatchResult) {
  const rs = sheets.Rubber.filter(rubber => rubber.match_result_id === res.id).sort((left, right) => left.rubber_number - right.rubber_number)
  if (rs.length && rs[0].rubber_type !== 'DOUBLES') { bad('rubber 1 is not the doubles rubber'); break }
}

// ── Singles are played in order of merit, strongest at number 1
let outOfOrder = 0, lineups = 0
for (const res of sheets.MatchResult) {
  const singles = sheets.Rubber.filter(rubber => rubber.match_result_id === res.id && rubber.rubber_type === 'SINGLES')
    .sort((left, right) => left.rubber_number - right.rubber_number)
  if (singles.length < 2) continue
  for (const side of ['HOME', 'AWAY']) {
    const picks = singles.map(singlesRubber => sheets.RubberPlayer.find(rubberPlayer => rubberPlayer.rubber_id === singlesRubber.id && rubberPlayer.side === side))
    if (picks.some(pick => !pick) || picks.some(pick => pick.is_emergency === true)) continue
    lineups++
    if (utr.get(picks[0].player_id) < utr.get(picks[1].player_id)) outOfOrder++
  }
}
count(`singles line-ups where number 1 is rated below number 2 (of ${lineups})`, outOfOrder)

// ── Nothing is dated after the day the workbook was generated
const future = (sheet, col) => (sheets[sheet] ?? []).filter(row => row[col] && String(row[col]).slice(0, 10) > TODAY).length
count('schedule changes dated in the future', future('FixtureScheduleChange', 'changed_at'))
count('notifications dated in the future', future('Notification', 'created_at'))
count('audit entries dated in the future', future('AuditLog', 'changed_at'))
count('results entered in the future', future('MatchResult', 'entered_at'))
count('awards dated in the future', future('PlayerAward', 'awarded_on'))

// ── A change is logged on or after the thing it changed, never before
for (const fixtureScheduleChange of sheets.FixtureScheduleChange) {
  if (fixtureScheduleChange.previous_date && String(fixtureScheduleChange.changed_at).slice(0, 10) > fixtureScheduleChange.previous_date) {
    bad(`${fixtureScheduleChange.id}: logged after the match it postponed`)
  }
  if (fixtureScheduleChange.change_type === 'POSTPONED' && String(fixtureScheduleChange.changed_at).slice(0, 10) !== fixtureScheduleChange.previous_date) {
    warn(`${fixtureScheduleChange.id}: a washout should be logged on the day of the match`)
  }
}

// ── A club administrator belongs to the club they administer
const memberOf = new Set(sheets.ClubMembership.map(clubMembership => `${clubMembership.player_id}|${clubMembership.club_id}`))
const playerByLogin = new Map(sheets.Player.map(player => [player._lookup_user_email, player]))
count('club admins who are not members of their club',
  sheets.UserRole.filter(userRole => userRole.role_type === 'CLUB_ADMIN')
    .filter(userRole => !memberOf.has(`${playerByLogin.get(userRole._lookup_user_email)?.id}|${userRole.club_id}`)).length)

// ── Team names are unique within a season, ignoring case and surrounding spaces
const teamSeason = new Map(sheets.SectionGrade.map(sectionGrade => [sectionGrade.id, sectionGrade.season_id]))
const teamKeys = sheets.Team.map(team => `${teamSeason.get(team.section_id)}|${String(team.name).trim().toLowerCase()}`)
count('teams sharing a name with another team in the same season', teamKeys.length - new Set(teamKeys).size)

// ── A user holds exactly one role
const rolesPerUser = new Map()
for (const userRole of sheets.UserRole) rolesPerUser.set(userRole._lookup_user_email, (rolesPerUser.get(userRole._lookup_user_email) ?? 0) + 1)
count('users holding more than one role', [...rolesPerUser.values()].filter(roleCount => roleCount > 1).length)

// ── A notification names the recipient's own team
let wrongTeam = 0
for (const notification of sheets.Notification) {
  const player = playerByLogin.get(notification._lookup_user_email)
  const fixture = fixtureById.get(notification.target_id)
  if (!player || !fixture) continue
  const mine = [fixture.home_team_id, fixture.away_team_id]
    .map(id => teamById.get(id))
    .find(team => sheets.TeamPlayer.some(tp => tp.team_id === team.id && tp.player_id === player.id))
  if (mine && !String(notification.message).includes(mine.name)) wrongTeam++
}
count('notifications naming a team other than the recipient\'s', wrongTeam)

// ── UtrLink agrees with the newest snapshot: one player, one current rating
count('players whose UtrLink disagrees with their newest snapshot',
  sheets.UtrLink.filter(utrLink => {
    const snaps = sheets.UtrRatingSnapshot.filter(utrRatingSnapshot => utrRatingSnapshot.player_id === utrLink.player_id && utrRatingSnapshot.discipline === 'SINGLES')
      .sort((left, right) => String(left.recorded_at).localeCompare(String(right.recorded_at)))
    return !snaps.length || Math.abs(Number(snaps[snaps.length - 1].rating) - Number(utrLink.utr_rating)) > 0.001
  }).length)

// ── Seasons in one competition never overlap
for (const comp of sheets.Competition) {
  const list = sheets.Season.filter(season => season.competition_id === comp.id)
    .sort((left, right) => String(left.start_date).localeCompare(String(right.start_date)))
  for (let i = 1; i < list.length; i++) {
    if (list[i].start_date <= list[i - 1].end_date) {
      bad(`${comp.name}: ${list[i].id} starts ${list[i].start_date} before ${list[i - 1].id} ends ${list[i - 1].end_date}`)
    }
  }
}

// ── A team belongs to exactly one season, never reused across them
const seasonOfSection = new Map(sheets.SectionGrade.map(sectionGrade => [sectionGrade.id, sectionGrade.season_id]))
for (const playerAward of sheets.PlayerAward) {
  if (!playerAward.team_id || !playerAward.season_id) continue
  const team = teamById.get(playerAward.team_id)
  if (seasonOfSection.get(team.section_id) !== playerAward.season_id) {
    bad(`${playerAward.id}: award for ${playerAward.season_id} points at ${playerAward.team_id}, a team from ${seasonOfSection.get(team.section_id)}`)
  }
}
count('sections declaring teams but having none',
  sheets.SectionGrade.filter(sectionGrade => sectionGrade.team_count > 0 && !sheets.Team.some(team => team.section_id === sectionGrade.id)).length)

// ── Membership history precedes the honours it is supposed to explain
for (const playerAward of sheets.PlayerAward) {
  const team = teamById.get(playerAward.team_id)
  if (!team || !playerAward.awarded_on) continue
  const membership = sheets.ClubMembership.find(clubMembership => clubMembership.player_id === playerAward.player_id && clubMembership.club_id === team.club_id)
  if (!membership) { bad(`${playerAward.id}: ${playerAward.player_id} has no membership at ${team.club_id}`); continue }
  if (membership.start_date && membership.start_date > playerAward.awarded_on) {
    bad(`${playerAward.id}: ${playerAward.player_id} joined ${team.club_id} on ${membership.start_date}, after winning on ${playerAward.awarded_on}`)
  }
}
if (new Set(sheets.ClubMembership.map(clubMembership => clubMembership.start_date)).size < 3) {
  bad('every club membership shares one start date; there is no joined history')
}

// ── Finals are drawn from the final ladder, and only once the season is over
for (const sec of sheets.SectionGrade) {
  const finals = sheets.Fixture.filter(fixture => fixture.section_id === sec.id && fixture.is_finals === true)
  const regular = sheets.Fixture.filter(fixture => fixture.section_id === sec.id && fixture.is_finals !== true)
  if (!finals.length) continue
  const unplayed = regular.filter(regularFixture => regularFixture.status !== 'COMPLETED').length
  if (unplayed) bad(`${sec.id}: finals exist while ${unplayed} home-and-away fixtures are unplayed`)
  const ladder = sheets.LadderEntry.filter(ladderEntry => ladderEntry.section_id === sec.id).sort((left, right) => left.position - right.position)
  const top4 = new Set(ladder.slice(0, 4).map(ladderEntry => ladderEntry.team_id))
  for (const finalFixture of finals) {
    for (const id of [finalFixture.home_team_id, finalFixture.away_team_id]) {
      if (!top4.has(id)) bad(`${finalFixture.id}: ${teamById.get(id)?.name} is in the finals but finished ${ladder.find(ladderEntry => ladderEntry.team_id === id)?.position}`)
    }
  }
  if (!finals.every(finalFixture => finalFixture.round_label)) bad(`${sec.id}: a finals fixture has no round label`)
}

// ── Each finals round is contested by teams that won their way there, and the
// premiership follows the grand final rather than the ladder.
for (const sec of sheets.SectionGrade) {
  const finals = sheets.Fixture.filter(fixture => fixture.section_id === sec.id && fixture.is_finals === true)
  if (!finals.length) continue
  const winnerOfFixture = fixture => {
    const res = sheets.MatchResult.find(matchResult => matchResult.fixture_id === fixture.id)
    return res ? (res.outcome === 'HOME_WIN' ? fixture.home_team_id : fixture.away_team_id) : null
  }
  const semis = finals.filter(finalFixture => finalFixture.round_label === 'Semi Final')
  const prelim = finals.find(finalFixture => finalFixture.round_label === 'Preliminary Final')
  const grand = finals.find(finalFixture => finalFixture.round_label === 'Grand Final')

  if (prelim) {
    const eligible = new Set(semis.flatMap(semiFinal => {
      const winner = winnerOfFixture(semiFinal)
      return winner ? [winner, winner === semiFinal.home_team_id ? semiFinal.away_team_id : semiFinal.home_team_id] : []
    }))
    for (const id of [prelim.home_team_id, prelim.away_team_id]) {
      if (!eligible.has(id)) bad(`${prelim.id}: ${teamById.get(id)?.name} did not come through a semi final`)
    }
    if (prelim.home_team_id === prelim.away_team_id) bad(`${prelim.id}: same team on both sides`)
    // The team eliminated in a semi cannot reappear.
    const eliminated = semis.map(semiFinal => {
      const winner = winnerOfFixture(semiFinal)
      return winner && winner === semiFinal.home_team_id ? semiFinal.away_team_id : semiFinal.home_team_id
    })
    if (eliminated.filter(Boolean).length === 2) {
      const stillAlive = [prelim.home_team_id, prelim.away_team_id]
      if (eliminated.every(eliminatedTeam => stillAlive.includes(eliminatedTeam))) bad(`${prelim.id}: both semi losers are in the preliminary final`)
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
    const premiers = [...new Set(sheets.PlayerAward
      .filter(playerAward => playerAward.season_id === season && playerAward.award_type === 'SECTION_WINNER').map(playerAward => playerAward.team_id))]
    if (champion && premiers.length && !premiers.includes(champion)) {
      bad(`${season}: ${teamById.get(champion)?.name} won the grand final but ${teamById.get(premiers[0])?.name} is named premiers`)
    }
    for (const award of sheets.PlayerAward.filter(playerAward => playerAward.season_id === season)) {
      if (award.awarded_on && award.awarded_on < grand.schedule_date) {
        bad(`${award.id}: awarded ${award.awarded_on}, before the grand final on ${grand.schedule_date}`)
      }
    }
  }
}

// ── A season's dates cover everything played in it, finals included
for (const season of sheets.Season) {
  const secs = sheets.SectionGrade.filter(sectionGrade => sectionGrade.season_id === season.id).map(sectionGrade => sectionGrade.id)
  for (const seasonFixture of sheets.Fixture.filter(fixture => secs.includes(fixture.section_id) && fixture.schedule_date)) {
    if (season.end_date && seasonFixture.schedule_date > season.end_date) {
      bad(`${seasonFixture.id}: ${seasonFixture.round_label || 'round ' + seasonFixture.round_number} on ${seasonFixture.schedule_date}, after ${season.id} ends ${season.end_date}`)
    }
  }
}

// ── Rubbers match the format their season claims to be played under
for (const season of sheets.Season) {
  const secs = sheets.SectionGrade.filter(sectionGrade => sectionGrade.season_id === season.id).map(sectionGrade => sectionGrade.id)
  const results = sheets.MatchResult.filter(matchResult => sheets.Fixture.some(fixture => fixture.id === matchResult.fixture_id && secs.includes(fixture.section_id)))
  if (!results.length) continue
  const rs = sheets.Rubber.filter(rubber => results.some(result => result.id === rubber.match_result_id))
  const formatId = [...new Set(rs.map(rubber => rubber.match_format_id))]
  if (formatId.length > 1) { bad(`${season.id}: rubbers claim several formats`); continue }
  const format = sheets.MatchFormat.find(matchFormat => matchFormat.id === formatId[0])
  if (!format) continue
  const perMatch = rs.length / results.length
  const singles = rs.filter(rubber => rubber.rubber_type === 'SINGLES').length / results.length
  const doubles = rs.filter(rubber => rubber.rubber_type === 'DOUBLES').length / results.length
  if (perMatch !== format.rubber_count) bad(`${season.id}: ${perMatch} rubbers per match, ${format.name} declares ${format.rubber_count}`)
  if (singles !== format.singles_count) bad(`${season.id}: ${singles} singles per match, format declares ${format.singles_count}`)
  if (doubles !== format.doubles_count) bad(`${season.id}: ${doubles} doubles per match, format declares ${format.doubles_count}`)
  const maxSets = format.set_to_win === 1 ? 1 : format.set_to_win * 2 - 1
  const over = rs.filter(rubber => sheets.RubberSet.filter(rubberSet => rubberSet.rubber_id === rubber.id).length > maxSets).length
  if (over) bad(`${season.id}: ${over} rubbers have more than ${maxSets} set(s), which ${format.name} does not allow`)
}

// ── A result is entered after its last rubber was played, and finalised after
// it was entered. Comparing instants avoids any timezone guesswork, and it
// catches a night match whose entry time wrapped past midnight onto the
// wrong day.
for (const res of sheets.MatchResult) {
  if (!res.entered_at) continue
  const played = sheets.Rubber.filter(rubber => rubber.match_result_id === res.id)
    .map(rubber => rubber.played_at).filter(Boolean).sort()
  const last = played[played.length - 1]
  if (last && Date.parse(res.entered_at) < Date.parse(last)) {
    bad(`${res.id}: entered ${res.entered_at}, before its last rubber finished at ${last}`)
  }
  if (res.finalised_at && Date.parse(res.finalised_at) < Date.parse(res.entered_at)) {
    bad(`${res.id}: finalised before it was entered`)
  }
}

// ── Nothing is left hanging in a season that has finished
for (const season of sheets.Season.filter(season => season.status === 'COMPLETED')) {
  const secs = sheets.SectionGrade.filter(sectionGrade => sectionGrade.season_id === season.id).map(sectionGrade => sectionGrade.id)
  const results = sheets.MatchResult.filter(matchResult => sheets.Fixture.some(fixture => fixture.id === matchResult.fixture_id && secs.includes(fixture.section_id)))
  count(`${season.id} is completed but has unconfirmed results`,
    results.filter(result => result.status !== 'FINALISED').length)
  count(`${season.id} is completed but has unreviewed corrections`,
    sheets.CorrectionRequest.filter(correctionRequest => correctionRequest.status === 'PENDING' && results.some(result => result.id === correctionRequest.match_result_id)).length)
}
for (const verdict of ['APPROVED', 'REJECTED']) {
  if (!sheets.CorrectionRequest.some(correctionRequest => correctionRequest.status === verdict)) {
    bad(`no correction request was ever ${verdict.toLowerCase()}, so that path cannot be tested`)
  }
}

// ── A merge request pairs two profiles that plausibly are one person
for (const profileMergeRequest of sheets.ProfileMergeRequest) {
  const firstPlayer = sheets.Player.find(player => player.id === profileMergeRequest.player_a_id)
  const secondPlayer = sheets.Player.find(player => player.id === profileMergeRequest.player_b_id)
  if (!firstPlayer || !secondPlayer) { bad(`${profileMergeRequest.id}: references a player that does not exist`); continue }
  if (firstPlayer.id === secondPlayer.id) bad(`${profileMergeRequest.id}: pairs a profile with itself`)
  const sameName = `${firstPlayer.first_name} ${firstPlayer.last_name}` === `${secondPlayer.first_name} ${secondPlayer.last_name}`
  if (!sameName) bad(`${profileMergeRequest.id}: pairs ${firstPlayer.first_name} ${firstPlayer.last_name} with ${secondPlayer.first_name} ${secondPlayer.last_name}, who are plainly different people`)
  const assoc = id => new Set(sheets.AssociationMembership.filter(associationMembership => associationMembership.player_id === id).map(associationMembership => associationMembership.association_id))
  const [firstAssociations, secondAssociations] = [assoc(firstPlayer.id), assoc(secondPlayer.id)]
  if ([...firstAssociations].every(associationId => secondAssociations.has(associationId)) && [...secondAssociations].every(associationId => firstAssociations.has(associationId))) {
    warn(`${profileMergeRequest.id}: both profiles sit in the same association(s), so the note about two associations does not hold`)
  }
}

// ── Duplicate profiles (DATA-001 in TestingPlan.xlsx). The same person registered twice
// shares a name and a date of birth: such a pair must be waiting in a ProfileMergeRequest,
// or it is a data mistake. Same-name players born on different days are look-alikes, and at
// least one pair must exist so duplicate-profile detection has two people to tell apart.
{
  const fullName = player => `${player.first_name} ${player.last_name}`
  const awaitingMerge = (firstPlayer, secondPlayer) => sheets.ProfileMergeRequest.some(profileMergeRequest =>
    (profileMergeRequest.player_a_id === firstPlayer.id && profileMergeRequest.player_b_id === secondPlayer.id) || (profileMergeRequest.player_a_id === secondPlayer.id && profileMergeRequest.player_b_id === firstPlayer.id))
  const byName = new Map()
  for (const player of sheets.Player) {
    const key = fullName(player).trim().toLowerCase()
    byName.set(key, [...(byName.get(key) ?? []), player])
  }
  let lookAlikes = 0
  for (const group of byName.values()) {
    for (const [i, player] of group.entries()) {
      for (const otherPlayer of group.slice(i + 1)) {
        if (String(player.date_of_birth) !== String(otherPlayer.date_of_birth)) lookAlikes++
        else if (!awaitingMerge(player, otherPlayer)) {
          bad(`${player.id} and ${otherPlayer.id} are both ${fullName(player)}, born ${player.date_of_birth}: the same person registered twice? Pair them in ProfileMergeRequest, or correct one`)
        }
      }
    }
  }
  if (!lookAlikes) bad('no two players share a name, so duplicate-profile detection has no look-alikes to tell apart')
}

// ── Club membership implies membership of that club's association
const assocOfClub = new Map(sheets.Club.map(club => [club.id, club.association_id]))
count('players in a club whose association they do not belong to',
  sheets.ClubMembership.filter(clubMembership => !sheets.AssociationMembership
    .some(associationMembership => associationMembership.player_id === clubMembership.player_id && associationMembership.association_id === assocOfClub.get(clubMembership.club_id))).length)

// ── A blank must be a genuinely empty cell, not an empty string
{
  const raw = {}
  for (const sheetName of wb.SheetNames) raw[sheetName] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: undefined })
  let empties = 0
  for (const rows of Object.values(raw)) for (const row of rows) for (const value of Object.values(row)) if (value === '') empties++
  count('cells holding an empty string where NULL was meant', empties)
}

// ── PDF: 6 or 8 team sections, 14 rounds, each pair meeting home and away.
// An UPCOMING season is still taking entries and has no draw, so it is skipped.
const upcomingSeasons = new Set(sheets.Season.filter(se => se.status === 'UPCOMING').map(se => se.id))
const drawnTeam = teamId => !upcomingSeasons.has(sectionById.get(teamById.get(teamId).section_id).season_id)
for (const sec of sheets.SectionGrade) {
  const teams = sheets.Team.filter(team => team.section_id === sec.id)
  if (!teams.length || upcomingSeasons.has(sec.season_id)) continue
  if (![6, 8].includes(teams.length)) bad(`${sec.id}: ${teams.length} teams, the document allows 6 or 8`)
  const regular = sheets.Fixture.filter(fixture => fixture.section_id === sec.id && fixture.is_finals !== true)
  const rounds = new Set(regular.map(regularFixture => regularFixture.round_number))
  if (rounds.size !== 14) bad(`${sec.id}: ${rounds.size} rounds, the document says 14`)
  const meetings = new Map()
  for (const fixture of regular) {
    const meetingKey = [fixture.home_team_id, fixture.away_team_id].sort().join('|')
    meetings.set(meetingKey, (meetings.get(meetingKey) || 0) + 1)
  }
  for (const [meetingKey, meetingCount] of meetings) if (meetingCount !== 2) bad(`${sec.id}: ${meetingKey} meet ${meetingCount} times, expected 2`)
  for (const team of teams) {
    const homeCount = regular.filter(regularFixture => regularFixture.home_team_id === team.id).length
    const awayCount = regular.filter(regularFixture => regularFixture.away_team_id === team.id).length
    if (homeCount !== awayCount) bad(`${team.id}: ${homeCount} home vs ${awayCount} away`)
  }
  for (const round of rounds) {
    const sides = regular.filter(regularFixture => regularFixture.round_number === round).flatMap(regularFixture => [regularFixture.home_team_id, regularFixture.away_team_id])
    if (new Set(sides).size !== sides.length) bad(`${sec.id} round ${round}: a team plays twice`)
  }
}

// ── A venue cannot host more concurrent matches than it has courts
const courts = new Map(sheets.Venue.map(venue => [venue.id, venue.court_count || 0]))
const slots = new Map()
for (const fixture of sheets.Fixture) {
  if (!fixture.schedule_date) continue
  const slotKey = `${fixture.venue_id}|${fixture.schedule_date}|${fixture.schedule_time}`
  slots.set(slotKey, (slots.get(slotKey) || 0) + 1)
}
for (const [slotKey, slotCount] of slots) {
  const [venue] = slotKey.split('|')
  if (slotCount * 2 > courts.get(venue)) bad(`${slotKey}: ${slotCount} matches need ${slotCount * 2} courts, venue has ${courts.get(venue)}`)
}

// ── POSTPONED means the date is gone and the reason is recorded
for (const postponedFixture of sheets.Fixture.filter(fixture => fixture.status === 'POSTPONED')) {
  if (postponedFixture.schedule_date !== '' || postponedFixture.schedule_time !== '') bad(`${postponedFixture.id}: POSTPONED but still dated`)
  if (!sheets.FixtureScheduleChange.some(fixtureScheduleChange => fixtureScheduleChange.fixture_id === postponedFixture.id && fixtureScheduleChange.change_type === 'POSTPONED')) {
    bad(`${postponedFixture.id}: POSTPONED with no schedule-change row`)
  }
}

// ── Emergency players: called in on the day, not pre-registered
const emergencyAppearances = sheets.RubberPlayer.filter(rubberPlayer => rubberPlayer.is_emergency === true)
if (!emergencyAppearances.length) bad('no emergency player ever appears, so the (E) rules cannot be tested')
count('emergency players pre-registered on a roster',
  sheets.TeamPlayer.filter(teamPlayer => teamPlayer.status === 'EMERGENCY').length)
for (const rp of emergencyAppearances) {
  const rubber = rubberById.get(rp.rubber_id)
  const fixture = fixtureById.get(resultById.get(rubber.match_result_id).fixture_id)
  const team = rp.side === 'HOME' ? fixture.home_team_id : fixture.away_team_id
  if (sheets.TeamPlayer.some(teamPlayer => teamPlayer.team_id === team && teamPlayer.player_id === rp.player_id)) {
    bad(`${rp.id}: emergency is already on that team's roster`)
  }
}

// ── The result workflow has data at every stage
for (const [label, count] of [
  ['results awaiting confirmation', sheets.MatchResult.filter(matchResult => matchResult.status === 'PENDING_CONFIRMATION').length],
  ['disputed results', sheets.ResultConfirmation.filter(resultConfirmation => resultConfirmation.status === 'DISPUTED').length],
  ['correction requests', sheets.CorrectionRequest.length],
  ['audit entries', sheets.AuditLog.length],
  ['profile merge requests', sheets.ProfileMergeRequest.length],
]) if (!count) bad(`the workflow has no ${label}`)
count('finalised results with no recorded author',
  sheets.MatchResult.filter(matchResult => matchResult.status === 'FINALISED' && !matchResult.entered_by).length)

// ── Client: a player may belong to more than one club, and more than one
// association, and more than one competition must exist
if (!sheets.ClubMembership.some(clubMembership => clubMembership.is_primary === false)) bad('no player holds a secondary club membership')
// Exactly one primary club, and one primary association, per player.
for (const [sheet, label] of [['ClubMembership', 'club'], ['AssociationMembership', 'association']]) {
  const byPlayer = new Map()
  for (const row of sheets[sheet]) {
    if (!byPlayer.has(row.player_id)) byPlayer.set(row.player_id, [])
    byPlayer.get(row.player_id).push(row)
  }
  count(`players with more than one primary ${label}`,
    [...byPlayer.values()].filter(ms => ms.filter(membership => membership.is_primary === true).length > 1).length)
  count(`players with no primary ${label}`,
    [...byPlayer.values()].filter(ms => !ms.some(membership => membership.is_primary === true)).length)
}
if (sheets.Association.length < 2) bad('only one association exists, so merges across associations cannot be tested')
const withFixtures = sheets.Competition.filter(competition =>
  sheets.Season.filter(season => season.competition_id === competition.id)
    .some(season => sheets.SectionGrade.filter(sectionGrade => sectionGrade.season_id === season.id)
      .some(sectionGrade => sheets.Fixture.some(fixture => fixture.section_id === sectionGrade.id))))
if (withFixtures.length < 2) bad('fewer than two competitions have any fixtures')
else if (withFixtures.length < sheets.Competition.length) {
  warn(`${sheets.Competition.length - withFixtures.length} competition(s) still have no fixtures: ${
    sheets.Competition.filter(competition => !withFixtures.includes(competition)).map(competition => competition.name).join(', ')}`)
}

// ── Every rostered player gets matches, and enough of them to play finals
const appearances = new Map()
for (const rp of sheets.RubberPlayer) appearances.set(rp.player_id, (appearances.get(rp.player_id) || 0) + 1)
// A season without a draw has played nothing yet, so its squads are left out.
count('rostered players who never appear in a rubber',
  [...new Set(sheets.TeamPlayer.filter(teamPlayer => teamPlayer.status === 'ACTIVE' && drawnTeam(teamPlayer.team_id)).map(teamPlayer => teamPlayer.player_id))]
    .filter(id => !appearances.has(id)).length)
const short = [...new Set(sheets.TeamPlayer.filter(teamPlayer => drawnTeam(teamPlayer.team_id)).map(teamPlayer => teamPlayer.player_id))].filter(id => (appearances.get(id) || 0) < 3)
if (short.length) warn(`${short.length} players have fewer than 3 matches (finals-ineligible under ELIG01)`)

// ── The dashboard has to be fillable for a real player
const sample = sheets.Player[0]
// The dashboard shows the player's current team, so pick the one in the season
// that is still running rather than whichever roster row comes first.
const activeSeasons = new Set(sheets.Season.filter(season => season.status === 'ACTIVE').map(season => season.id))
const activeSections = new Set(sheets.SectionGrade.filter(sectionGrade => activeSeasons.has(sectionGrade.season_id)).map(sectionGrade => sectionGrade.id))
const team = sheets.TeamPlayer
  .filter(teamPlayer => teamPlayer.player_id === sample.id)
  .map(teamPlayer => teamById.get(teamPlayer.team_id))
  .find(teamPlayer => teamPlayer && activeSections.has(teamPlayer.section_id))
const mine = sheets.RubberPlayer.filter(rubberPlayer => rubberPlayer.player_id === sample.id)
const snaps = sheets.UtrRatingSnapshot.filter(utrRatingSnapshot => utrRatingSnapshot.player_id === sample.id && utrRatingSnapshot.discipline === 'SINGLES')
const rank = sheets.RankingEntry.find(rankingEntry => rankingEntry.player_id === sample.id && rankingEntry.cohort_id === 'COH01')
const inbox = sheets.Notification.filter(notification => notification._lookup_user_email === sample._lookup_user_email && notification.channel === 'IN_APP')
const next = sheets.Fixture
  .filter(fixture => team && [fixture.home_team_id, fixture.away_team_id].includes(team.id) && fixture.schedule_date >= TODAY)
  .sort((left, right) => String(left.schedule_date).localeCompare(String(right.schedule_date)))[0]
const widgets = {
  'Name / Status': `${sample.first_name} ${sample.last_name} / ${sample.status}`,
  'Email': sample._lookup_user_email,
  'Club / Team': team ? `${team.name}` : 'MISSING',
  'UTR tiles': snaps.slice(-3).map(snapshot => snapshot.rating).reverse().join(', ') || 'MISSING',
  'Percentile': rank ? `Top ${(100 - Number(rank.percentile_rank)).toFixed(0)}%` : 'MISSING',
  'Notifications': `${inbox.length} (${inbox.filter(notification => notification.read_at === '').length} unread)`,
  'Career matches': mine.length || 'MISSING',
  'Titles': sheets.PlayerAward.filter(playerAward => playerAward.player_id === sample.id).length,
  'Next fixture': next ? `${next.schedule_date || 'TBC'} ${next.round_label || 'Round ' + next.round_number}` : 'MISSING',
}
for (const [widget, status] of Object.entries(widgets)) if (String(status).includes('MISSING')) bad(`dashboard widget "${widget}" cannot be filled`)

console.log(`Sample dashboard - ${sample.first_name} ${sample.last_name}`)
for (const [widget, status] of Object.entries(widgets)) console.log(`   ${widget.padEnd(24)} ${status}`)
console.log()
console.log(problems.length ? `REQUIREMENTS: ${problems.length} problem(s)` : 'Requirements: all checks passed')
for (const problem of problems.slice(0, 30)) console.log('  x ' + problem)
if (warnings.length) {
  console.log(`\nNotes (${warnings.length})`)
  for (const warning of warnings) console.log('  ! ' + warning)
}
process.exitCode = problems.length ? 1 : 0
