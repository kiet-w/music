"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
require("dotenv/config");
async function main() {
    const prisma = new client_1.PrismaClient();
    try {
        const tracks = await prisma.track.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        console.log(JSON.stringify(tracks, null, 2));
    }
    catch (err) {
        console.error('Error:', err);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=check-urls.js.map