import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

function sessionQueries(fastify: FastifyInstance, client: PrismaClient) {
  return {
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

    getSession: async function (sessionId?: number, jwt?: string) {
      let session;
      try {
        session = await client.sessions.findUnique({
          where: { id: sessionId, jwt: jwt },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Sessions"
        );
      }
      return session;
    },

    getManySession: async function () {
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
  };
}

export default sessionQueries;
