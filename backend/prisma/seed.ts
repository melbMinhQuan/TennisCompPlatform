import { PrismaClient, UserStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, 'players_login_data.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Players'];

  const rows = XLSX.utils.sheet_to_json<{
    player_id: number;
    full_name: string;
    email: string;
    password: string;
  }>(sheet);

  const users = await Promise.all(
    rows.map(async (row) => ({
      email: row.email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(String(row.password), 10),
      status: UserStatus.ACTIVE,
    }))
  );

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
