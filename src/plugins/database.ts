import { PrismaClient, sessions, users } from "@prisma/client";
import fp from "fastify-plugin";

interface userInfo {
  email: string;
  password: string;
  name: string;
  surname: string;
  pseudo: string;
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
      updateUser: async function (userId: string, userInfo: userInfo) {
        try {
          await client.users.update({
            where: { id: parseInt(userId) },
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
          throw fastify.httpErrors.internalServerError("Database update Error");
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
          throw fastify.httpErrors.internalServerError("Database create Error");
        }
      },

      deleteUser: async function (userId: string) {
        try {
          await fastify.prisma.client.users.delete({
            where: { id: parseInt(userId) },
          });
        } catch (err) {
          if (err instanceof Error) {
            if (err.message.includes("Record to delete does not exist")) {
              throw fastify.httpErrors.notFound("User not found");
            }
          }
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError("Database fetch Error");
        }
      },

      getUser: async function (userId: string) {
        let user;
        try {
          user = await client.users.findUnique({
            where: { id: parseInt(userId) },
          });
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError("Database fetch Error");
        }
        return user;
      },

      getUsers: async function () {
        let users;
        try {
          users = await client.users.findMany();
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError("Database fetch Error");
        }
        return users;
      },

      getUserByEMail: async function (email: string) {
        let user;
        try {
          user = await client.users.findUnique({ where: { email: email } });
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError("Database fetch Error");
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
          throw fastify.httpErrors.internalServerError("Database delete Error");
        }
      },

      createSession: async function (token: string, userId: string) {
        try {
          await client.sessions.create({
            data: { jwt: token, userid: parseInt(userId) },
          });
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError("Database create Error");
        }
      },

      getSession: async function (sessionId: string) {
        let session;
        try {
          session = await client.sessions.findUnique({
            where: { id: parseInt(sessionId) },
          });
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError("Database fetch Error");
        }
        return session;
      },

      getSessions: async function () {
        let sessions;
        try {
          sessions = await client.sessions.findMany();
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError("Database fetch Error");
        }
        return sessions;
      },

      getSessionByJWT: async function (token: string) {
        let session;
        try {
          session = await client.sessions.findUnique({
            where: { jwt: token },
          });
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError("Database fetch Error");
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
        updateUser: (userId: string, userInfo: userInfo) => Promise<void>;
        createUser: (userInfo: userInfo) => Promise<void>;
        deleteUser: (userId: string) => Promise<void>;
        getUser: (userId: string) => Promise<users>;
        getUsers: () => Promise<users[]>;
        getUserByEMail: (email: string) => Promise<users>;
      };
      session: {
        deleteSession: (token: string) => Promise<void>;
        createSession: (token: string, userId: string) => Promise<void>;
        getSession: (sessionId: string) => Promise<sessions>;
        getSessions: () => Promise<sessions[]>;
        getSessionByJWT: (token: string) => Promise<sessions>;
      };
    };
  }
}
