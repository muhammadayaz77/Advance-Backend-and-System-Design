import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { SqlDriverAdapterFactory } from '@prisma/client/runtime/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const safeDbHint = (() => {
      try {
        const url = new URL(connectionString);
        return {
          host: url.host,
          database: url.pathname.replace(/^\//, ''),
          user: decodeURIComponent(url.username || ''),
          sslmode: url.searchParams.get('sslmode') ?? undefined,
        };
      } catch {
        return { host: 'invalid-url' };
      }
    })();

    const AdapterFactory = PrismaPg as new (config: {
      connectionString: string;
    }) => SqlDriverAdapterFactory;
    const adapter: SqlDriverAdapterFactory = new AdapterFactory({
      connectionString,
    });

    super({
      adapter,
    });

    // Non-sensitive hints (no password) to debug DB auth issues.
    console.log('[Prisma] Using database', safeDbHint);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}
