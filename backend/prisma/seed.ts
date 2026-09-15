import { PrismaClient, UserStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, '..', '..', 'players_login_data.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Players'];

  const rows = XLSX.utils.sheet_to_json<{
    player_id: number;
    full_name: string;
    email: string;
    password: string;
  }>(sheet);

  // Passwords are stored in plain text for now (no hashing yet). The column is
  // still called `password_hash` in the schema; swap in bcrypt later.
  const users = rows.map((row) => ({
    email: row.email.trim().toLowerCase(),
    passwordHash: String(row.password),
    status: UserStatus.ACTIVE,
  }));

  const result = await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  console.log(`Seeded ${result.count} users`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
