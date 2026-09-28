export type RubberSide = 'HOME' | 'AWAY'

interface SetScore {
  homeGames: number | null
  awayGames: number | null
}

/**
 * Which side won a rubber, or null when that cannot be told.
 *
 * Retirements, walkovers and forfeits carry an explicit winnerSide because the
 * winner there can have fewer games. A completed rubber has none recorded and
 * is decided by its sets: most sets won, then most games (the formats'
 * "most sets; if tied then games" rule). A full tie stays null, never a guess.
 */
export function rubberWinner(winnerSide: RubberSide | null, sets: SetScore[]): RubberSide | null {
  if (winnerSide) return winnerSide
  const scored = sets.filter(set => set.homeGames !== null && set.awayGames !== null) as { homeGames: number; awayGames: number }[]
  if (!scored.length || scored.length !== sets.length) return null
  const homeSets = scored.filter(set => set.homeGames > set.awayGames).length
  const awaySets = scored.filter(set => set.awayGames > set.homeGames).length
  if (homeSets !== awaySets) return homeSets > awaySets ? 'HOME' : 'AWAY'
  const homeGames = scored.reduce((total, set) => total + set.homeGames, 0)
  const awayGames = scored.reduce((total, set) => total + set.awayGames, 0)
  if (homeGames !== awayGames) return homeGames > awayGames ? 'HOME' : 'AWAY'
  return null
}
