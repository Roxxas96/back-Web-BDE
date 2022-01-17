import { PrismaClient, Sessions, Users } from "@prisma/client";
import fp from "fastify-plugin";

interface userInfo {
  email: string;
  password: string;
  name?: string;
  surname?: string;
  pseudo?: string;
}

export interface DatabasePluginOptions {
  // Specify Support plugin options here
}

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<DatabasePluginOptions>(async (fastify, opts) => {
  const client = new PrismaClient();

  //Try Database connection
  const connectionInterval = setInterval(async () => {
    try {
      await client.$connect();
      fastify.log.info("Database connected");
      clearInterval(connectionInterval);
    } catch (err) {
      fastify.log.error(err);
    }
  }, 5000);

  //Disconnect Database on process exit
  fastify.addHook("onClose", async (fastify) => {
    try {
      await fastify.prisma.client.$disconnect();
    } catch (err) {
      fastify.log.error(err);
    }
  });

  //Database queries
  const prisma = {
    client: client,
    //User queries
    user: {
      updateUser: async function (userId: number, userInfo: userInfo) {
        try {
          await client.users.update({
            where: { id: userId },
            data: userInfo,
          });
        } catch (err) {
          if (err instanceof Error) {
            if (err.message.includes("Unique constraint failed")) {
              throw fastify.httpErrors.conflict("User email already exists");
            }
            if (err.message.includes("Record to update not found")) {
              throw fastify.httpErrors.notFound("User not found");
            }
          }
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Update Error on Table Users"
          );
        }
      },

      createUser: async function (userInfo: userInfo) {
        try {
          await client.users.create({
            data: userInfo,
          });
        } catch (err) {
          if (err instanceof Error) {
            if (err.message.includes("Unique constraint failed")) {
              throw fastify.httpErrors.conflict("User already exists");
            }
            if (/Argument .* for .* is missing/g) {
              throw fastify.httpErrors.badRequest("Missing argument");
            }
          }
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Create Error on Table Users"
          );
        }
      },

      deleteUser: async function (userId: number) {
        try {
          await fastify.prisma.client.users.delete({
            where: { id: userId },
          });
        } catch (err) {
          if (err instanceof Error) {
            if (err.message.includes("Record to delete does not exist")) {
              throw fastify.httpErrors.notFound("User not found");
            }
          }
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Fetch Error on Table Users"
          );
        }
      },

      getUser: async function (userId: number) {
        let user;
        try {
          user = await client.users.findUnique({
            where: { id: userId },
          });
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Fetch Error on Table Users"
          );
        }
        return user;
      },

      getUsers: async function () {
        let Users;
        try {
          Users = await client.users.findMany();
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Fetch Error on Table Users"
          );
        }
        return Users;
      },

      getUserByEMail: async function (email: string) {
        let user;
        try {
          user = await client.users.findUnique({ where: { email: email } });
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Fetch Error on Table Users"
          );
        }
        return user;
      },
    },
    //Session queries
    session: {
      deleteSession: async function (token: string) {
        try {
          await client.sessions.delete({ where: { jwt: token } });
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Delete Error on Table Sessions"
          );
        }
      },

      createSession: async function (token: string, userId: number) {
        try {
          await client.sessions.create({
            data: { jwt: token, userId: userId },
          });
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Create Error on Table Sessions"
          );
        }
      },

      getSession: async function (sessionId: number) {
        let session;
        try {
          session = await client.sessions.findUnique({
            where: { id: sessionId },
          });
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Fetch Error on Table Sessions"
          );
        }
        return session;
      },

      getSessions: async function () {
        let Sessions;
        try {
          Sessions = await client.sessions.findMany();
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Fetch Error on Table Sessions"
          );
        }
        return Sessions;
      },

      getSessionByJWT: async function (token: string) {
        let session;
        try {
          session = await client.sessions.findUnique({
            where: { jwt: token },
          });
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Fetch Error on Table Sessions"
          );
        }
        return session;
      },
    },
  };

  fastify.decorate("prisma", prisma);
});

// When using .decorate you have to specify added properties for Typescript
declare module "fastify" {
  export interface FastifyInstance {
    prisma: {
      client: PrismaClient;
      user: {
        updateUser: (userId: number, userInfo: userInfo) => Promise<void>;
        createUser: (userInfo: userInfo) => Promise<void>;
        deleteUser: (userId: number) => Promise<void>;
        getUser: (userId: number) => Promise<Users>;
        getUsers: () => Promise<Users[]>;
        getUserByEMail: (email: string) => Promise<Users>;
      };
      session: {
        deleteSession: (token: string) => Promise<void>;
        createSession: (token: string, userId: number) => Promise<void>;
        getSession: (sessionId: number) => Promise<Sessions>;
        getSessions: () => Promise<Sessions[]>;
        getSessionByJWT: (token: string) => Promise<Sessions>;
      };
    };
  }
}
