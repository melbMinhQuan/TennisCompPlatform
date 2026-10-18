import { Module } from '@nestjs/common'
import { PlayerMatchingService } from './player-matching.service'

// Not imported by AppModule yet: nothing enters results so far. Import it into the module that
// will, and inject PlayerMatchingService there (docs/player-matching.md).
@Module({ providers: [PlayerMatchingService], exports: [PlayerMatchingService] })
export class PlayerMatchingModule {}
