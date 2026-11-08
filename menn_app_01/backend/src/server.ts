import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function startServer(): Promise<void> {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    const server = app.listen(env.PORT, () => {
      console.log(`Server running at http://localhost:${env.PORT}`);
      console.log(`API base URL: http://localhost:${env.PORT}/api/v1`);
    });

    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log("Database disconnected. Server closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start the server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

void startServer();
