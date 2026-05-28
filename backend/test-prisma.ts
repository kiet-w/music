import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  const prisma = new PrismaClient();
  try {
    const albums = await prisma.album.findMany();
    console.log('Albums count:', albums.length);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
