// Whether a name as written on a scoresheet ("Josh", "J. Smith", "Smith, Josh") can be a
// registered player's name. Pure functions, so every rule is tested on its own (MATCH-001);
// docs/player-matching.md lists the rules and what they deliberately do not match.
import { NICKNAMES } from './nicknames'

/** A written name: both parts, or one word that could be either a first name or a surname. */
export type WrittenName = { kind: 'full'; first: string; last: string } | { kind: 'single'; word: string }

/** Lower case, accents and apostrophes removed, other punctuation a space: "O'Brien" -> "obrien". */
export function normalizeName(value: string | null | undefined): string {
  return (value ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/['’]/g, '').replace(/[^a-z]+/g, ' ').trim()
}

const compact = (value: string | null | undefined) => normalizeName(value).replace(/ /g, '')
const title = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

/** Splits a written name; a comma puts the surname first ("Smith, Josh"). Null when there is none. */
export function parseWrittenName(written: string): WrittenName | null {
  const [before, after] = written.split(',', 2)
  if (after !== undefined && normalizeName(before) && normalizeName(after)) {
    return { kind: 'full', first: normalizeName(after).split(' ')[0], last: normalizeName(before) }
  }
  const words = normalizeName(written).split(' ').filter(Boolean)
  if (!words.length) return null
  return words.length === 1 ? { kind: 'single', word: words[0] } : { kind: 'full', first: words[0], last: words[words.length - 1] }
}

/** Why two first names are forms of one name in NICKNAMES, or null. */
function nicknameFit(firstForm: string, secondForm: string): string | null {
  for (const [name, forms] of Object.entries(NICKNAMES)) {
    const all = [name, ...forms]
    if (!all.includes(firstForm) || !all.includes(secondForm)) continue
    if (firstForm === name || secondForm === name) return `${title(firstForm === name ? secondForm : firstForm)} is a nickname for ${title(name)}`
    return `${title(firstForm)} and ${title(secondForm)} are both short for ${title(name)}`
  }
  return null
}

/**
 * Why a written first name fits a registered one, or null when it cannot be theirs. A single
 * letter is an initial; otherwise one name may be the start of the other or its nickname.
 */
export function firstNameFit(written: string, registered: string): string | null {
  const writtenName = compact(written)
  const registeredName = compact(registered)
  if (!writtenName || !registeredName) return null
  if (writtenName === registeredName) return 'same first name'
  if (writtenName.length === 1) return registeredName.startsWith(writtenName) ? `first initial ${writtenName.toUpperCase()}` : null
  const [short, long] = writtenName.length <= registeredName.length ? [writtenName, registeredName] : [registeredName, writtenName]
  if (short.length >= 3 && long.startsWith(short)) return `${title(short)} is short for ${title(long)}`
  return nicknameFit(writtenName, registeredName)
}

/** Why a written surname fits a registered one; a missing surname fits anyone. */
export function lastNameFit(written: string, registered: string): string | null {
  const writtenName = compact(written)
  const registeredName = compact(registered)
  if (!writtenName || !registeredName) return 'surname missing'
  if (writtenName === registeredName) return 'same surname'
  return writtenName.length === 1 && registeredName.startsWith(writtenName) ? `surname initial ${writtenName.toUpperCase()}` : null
}

/** Every reason a written name fits a registered player, or null when it cannot be them. */
export function nameFit(written: WrittenName, player: { firstName: string; lastName: string }): string[] | null {
  if (written.kind === 'single') {
    const asFirst = firstNameFit(written.word, player.firstName)
    if (asFirst) return [asFirst, 'surname missing']
    return written.word.length > 1 && compact(player.lastName) === written.word ? ['same surname', 'first name missing'] : null
  }
  const first = firstNameFit(written.first, player.firstName)
  const last = lastNameFit(written.last, player.lastName)
  return first && last ? [first, last] : null
}
