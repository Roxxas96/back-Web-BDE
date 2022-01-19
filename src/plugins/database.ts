import {
  Accomplishments,
  Challenges,
  Goodies,
  PrismaClient,
  Sessions,
  Users,
} from "@prisma/client";
import fp from "fastify-plugin";
import { AccomplishmentInfo } from "../models/AccomplishmentInfo";
import { ChallengeInfo } from "../models/ChallengeInfo";
import { GoodiesInfo } from "../models/GoodiesInfo";
import { UserInfo } from "../models/UserInfo";

export interface DatabasePluginOptions {
  // Specify Support plugin options here
}

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<DatabasePluginOptions>(async (fastify, opts) => {
  const client = new PrismaClient();

  //TODO : Retry connection doesn't work
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
      updateUser: async function (userId: number, userInfo: UserInfo) {
        try {
          await client.users.update({
            where: { id: userId },
            data: userInfo,
          });
        } catch (err) {
          if (err instanceof Error) {
            if (err.message.includes("Unique constraint failed")) {
              throw fastify.httpErrors.conflict("User already exists");
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

      createUser: async function (userInfo: UserInfo) {
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
          //TODO : Handle Password > 7 check

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
    challenge: {
      getChallenges: async function () {
        let challenges;
        try {
          challenges = await client.challenges.findMany();
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Fetch Error on Table Challenges"
          );
        }
        return challenges;
      },
      getChallenge: async function (challengeId: number) {
        let challenge;
        try {
          challenge = await client.challenges.findUnique({
            where: { id: challengeId },
          });
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Fetch Error on Table Challenges"
          );
        }
        return challenge;
      },
      createChallenge: async function (challengeInfo: ChallengeInfo) {
        try {
          await client.challenges.create({ data: challengeInfo });
        } catch (err) {
          if (err instanceof Error) {
            if (
              err.message.includes(
                'violates check constraint \\"Challenges_reward_check\\"'
              )
            ) {
              throw fastify.httpErrors.badRequest("Reward must be positive");
            }
          }

          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Create Error on Table Challenges"
          );
        }
      },
      updateChallenge: async function (
        challengeInfo: ChallengeInfo,
        challengeId: number
      ) {
        try {
          await client.challenges.update({
            where: { id: challengeId },
            data: challengeInfo,
          });
        } catch (err) {
          if (err instanceof Error) {
            if (err.message.includes("Record to update not found")) {
              throw fastify.httpErrors.notFound("Challenge not found");
            }
            if (
              err.message.includes(
                'violates check constraint \\"Challenges_reward_check\\"'
              )
            ) {
              throw fastify.httpErrors.badRequest("Reward must be positive");
            }
          }

          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Update Error on Table Challenges"
          );
        }
      },
      deleteChallenge: async function (challengeId: number) {
        try {
          await client.challenges.delete({ where: { id: challengeId } });
        } catch (err) {
          if (err instanceof Error) {
            if (err.message.includes("Record to delete does not exist")) {
              throw fastify.httpErrors.notFound("Challenge not found");
            }
          }

          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Delete Error on Table Challenges"
          );
        }
      },
    },
    accomplishment: {
      getAccomplishments: async function () {
        let accomplishments;
        try {
          accomplishments = await client.accomplishments.findMany();
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Fetch Error on Table Accomplishments"
          );
        }
        return accomplishments;
      },
      getAccomplishment: async function (accomplishmentId: number) {
        let accomplishment;
        try {
          accomplishment = await client.accomplishments.findUnique({
            where: { id: accomplishmentId },
          });
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Fetch Error on Table Accomplishments"
          );
        }
        return accomplishment;
      },
      createAccomplishment: async function (
        accomplishmentInfo: AccomplishmentInfo
      ) {
        try {
          await client.accomplishments.create({ data: accomplishmentInfo });
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Create Error on Table Accomplishments"
          );
        }
      },
      updateAccomplishment: async function (
        accomplishmentInfo: AccomplishmentInfo,
        accomplishmentId: number
      ) {
        try {
          await client.accomplishments.update({
            where: { id: accomplishmentId },
            data: accomplishmentInfo,
          });
        } catch (err) {
          if (err instanceof Error) {
            if (err.message.includes("Record to update not found")) {
              throw fastify.httpErrors.notFound("Accomplishment not found");
            }
          }

          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Update Error on Table Accomplishments"
          );
        }
      },
      deleteAccomplishment: async function (accomplishmentId: number) {
        try {
          await client.accomplishments.delete({
            where: { id: accomplishmentId },
          });
        } catch (err) {
          if (err instanceof Error) {
            if (err.message.includes("Record to delete does not exist")) {
              throw fastify.httpErrors.notFound("Accomplishment not found");
            }
          }

          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Delete Error on Table Accomplishments"
          );
        }
      },
      validateAccomplishment: async function (
        accomplishmentId: number,
        state: 1 | -1
      ) {
        try {
          client.accomplishments.update({
            where: { id: accomplishmentId },
            data: { validation: state },
          });
        } catch (err) {
          fastify.log.error(err);
          throw fastify.httpErrors.internalServerError(
            "Database Update Error on Table Accomplishments"
          );
        }
      },
    },
    goodies: {
      getGoodies: async function (goodiesId: number) {
        let goodies;
        try {
          goodies = await client.goodies.findUnique({
            where: { id: goodiesId },
          });
        } catch (err) {
          fastify.log.error(err);
          throw "Database Fetch Error on Table Goodies";
        }
        return goodies;
      },
      getManyGoodies: async function () {
        let goodies;
        try {
          goodies = await client.goodies.findMany();
        } catch (err) {
          fastify.log.error(err);
          throw "Database Fetch Error on Table Goodies";
        }
        return goodies;
      },
      createGoodies: async function (goodiesInfo: GoodiesInfo) {
        try {
          await client.goodies.create({
            data: goodiesInfo,
          });
        } catch (err) {
          fastify.log.error(err);
          throw "Database Create Error on Table Goodies";
        }
      },
      updateGoodies: async function (
        goodiesInfo: GoodiesInfo,
        goodiesId: number
      ) {
        try {
          await client.goodies.update({
            where: { id: goodiesId },
            data: goodiesInfo,
          });
        } catch (err) {
          fastify.log.error(err);
          throw "Database Update Error on Table Goodies";
        }
      },
      deleteGoodies: async function (goodiesId: number) {
        try {
          await client.goodies.delete({ where: { id: goodiesId } });
        } catch (err) {
          fastify.log.error(err);
          throw "Database Delete Error on Table Goodies";
        }
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
        updateUser: (userId: number, userInfo: UserInfo) => Promise<void>;
        createUser: (userInfo: UserInfo) => Promise<void>;
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
      challenge: {
        updateChallenge: (
          challengeInfo: ChallengeInfo,
          challengeId: number
        ) => Promise<void>;
        deleteChallenge: (challengeId: number) => Promise<void>;
        createChallenge: (challengeInfo: ChallengeInfo) => Promise<void>;
        getChallenge: (challengeId: number) => Promise<Challenges>;
        getChallenges: () => Promise<Challenges[]>;
      };
      accomplishment: {
        updateAccomplishment: (
          accomplishmentInfo: AccomplishmentInfo,
          accomplishmentId: number
        ) => Promise<void>;
        deleteAccomplishment: (accomplishmentId: number) => Promise<void>;
        createAccomplishment: (
          accomplishmentInfo: AccomplishmentInfo
        ) => Promise<void>;
        getAccomplishment: (
          accomplishmentId: number
        ) => Promise<Accomplishments>;
        getAccomplishments: () => Promise<Accomplishments[]>;
        validateAccomplishment: (
          accomplishmentId: number,
          state: 1 | -1
        ) => Promise<void>;
      };
      goodies: {
        getGoodies: (goodiesId: number) => Promise<Goodies>;
        getManyGoodies: () => Promise<Goodies[]>;
        createGoodies: (goodiesInfo: GoodiesInfo) => Promise<void>;
        updateGoodies: (
          goodiesInfo: GoodiesInfo,
          goodiesId: number
        ) => Promise<void>;
        deleteGoodies: (goodiesId: number) => Promise<void>;
      };
    };
  }
}
