"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
require("dotenv/config");
async function main() {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    const prisma = new client_1.PrismaClient();
    try {
        const albums = await prisma.album.findMany();
        console.log('Albums count:', albums.length);
    }
    catch (err) {
        console.error('Error:', err);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=test-prisma.js.map