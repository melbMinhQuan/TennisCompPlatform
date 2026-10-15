/**
 * Lists player profiles that are probably one person registered twice: the same date of birth
 * and names that fit each other, such as "Josh Smith" and "Joshua Smith" (docs/player-matching.md).
 * With --create-requests it also raises a PENDING ProfileMergeRequest for each new pair, for an
 * administrator to confirm. Nothing is ever merged automatically.
 *
 *   npm run players:duplicates                        list only; writes nothing
 *   npm run players:duplicates -- --create-requests   also raise the merge requests
 */
import { PrismaClient } from '@prisma/client'
import { PlayerMatchingService } from '../src/player-matching/player-matching.service'

async function main() {
  const flags = process.argv.slice(2)
  const unknown = flags.filter(flag => flag !== '--create-requests')
  if (unknown.length) throw new Error(`Unsupported option(s): ${unknown.join(', ')}. Only --create-requests is available.`)
  const create = flags.includes('--create-requests')

  const db = new PrismaClient()
  try {
    const matching = new PlayerMatchingService(db as never)
    const pairs = create ? await matching.raiseMergeRequests() : await matching.findDuplicateProfiles()
    if (!pairs.length) {
      console.log('No new likely duplicates.')
      return
    }
    for (const pair of pairs) console.log(`${pair.names.join('  /  ')}  (born ${pair.dateOfBirth}): ${pair.reasons.join('; ')}`)
    console.log(create
      ? `Raised ${pairs.length} merge request(s) for an administrator to confirm.`
      : `${pairs.length} likely duplicate(s). Run again with --create-requests to raise merge requests.`)
  } finally {
    await db.$disconnect()
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
