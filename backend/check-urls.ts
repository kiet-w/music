import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

async function main() {
  const prisma = new PrismaClient();
  try {
    const tracks = await prisma.track.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log(JSON.stringify(tracks, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();