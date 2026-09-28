import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { existsSync } from 'node:fs'
import * as path from 'node:path'
import { AppModule } from './app.module'

const ENV_FILE = path.resolve(__dirname, '..', '.env')
const DEFAULT_PORT = 3000
const DEFAULT_CORS_ORIGIN = 'http://localhost:5173'

async function start() {
  // Nest does not read .env itself. Prisma does, but PORT, CORS_ORIGIN and UTR_* need it too.
  // Variables already set in the real environment win over the file.
  if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE)

  const app = await NestFactory.create(AppModule)
  // The frontend sends credentials: 'include', which browsers only allow when
  // the response names the exact origin and allows credentials.
  const origins = (process.env.CORS_ORIGIN || DEFAULT_CORS_ORIGIN).split(',').map(origin => origin.trim())
  app.enableCors({ origin: origins, credentials: true })
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
  await app.listen(Number(process.env.PORT) || DEFAULT_PORT)
}
start()
