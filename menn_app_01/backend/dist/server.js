import "dotenv/config";
import app from './app.js';
import { prisma } from './lib/prisma.js';
const PORT = Number(process.env.PORT) || 5000;
async function startServer() {
    try {
        await prisma.$connect();
        const server = app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
            console.log("Database connected successfully");
        });
        const shutdown = async () => {
            console.log("Shutting down server...");
            server.close(async () => {
                await prisma.$disconnect();
                process.exit(0);
            });
            process.on("SIGINT", shutdown);
            process.on("SIGTERM", shutdown);
        };
    }
    catch (error) {
        console.error("Failed to start the server:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
}
void startServer();
//# sourceMappingURL=server.js.map