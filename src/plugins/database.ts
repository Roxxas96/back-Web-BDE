import { PrismaClient } from "@prisma/client";
import fp from "fastify-plugin";

export interface DatabasePluginOptions {
  // Specify Support plugin options here
}

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<DatabasePluginOptions>(async (fastify, opts) => {
  const prisma = new PrismaClient();

  try {
    prisma.$connect();
  } catch (err) {
    fastify.log.error("Database connection failed", err);
  }

  fastify.log.info("Database connected");
  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async (fastify) => {
    try {
      fastify.prisma.$disconnect();
    } catch (err) {
      fastify.log.error("Database failed during disconnect", err);
    }
  });
});

// When using .decorate you have to specify added properties for Typescript
declare module "fastify" {
  export interface FastifyInstance {
    prisma: PrismaClient;
  }
}
