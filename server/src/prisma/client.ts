// server/src/prisma/client.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"], // можно убрать, если не нужно логирование
  });

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
