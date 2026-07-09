import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client.ts";

export type SherlockDbClient = InstanceType<typeof PrismaClient>;

let prisma: SherlockDbClient | undefined;

export function createPrismaClient(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required to create the Sherlock Prisma client."
    );
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });

  return new PrismaClient({ adapter });
}

export function getPrismaClient() {
  prisma ??= createPrismaClient();

  return prisma;
}
