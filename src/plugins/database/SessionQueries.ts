import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

function sessionQueries(fastify: FastifyInstance, client: PrismaClient) {
  return {
    deleteSession: async function (token: string) {
      try {
        await client.session.delete({ where: { jwt: token } });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Delete Error on Table Session"
        );
      }
    },

    createSession: async function (token: string, userId: number) {
      try {
        await client.session.create({
          data: { jwt: token, userId: userId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Create Error on Table Session"
        );
      }
    },

    getSession: async function (sessionId?: number, jwt?: string) {
      let session;
      try {
        session = await client.session.findUnique({
          where: { id: sessionId, jwt: jwt },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Session"
        );
      }
      return session;
    },

    getManySession: async function () {
      let Session;
      try {
        Session = await client.session.findMany();
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Session"
        );
      }
      return Session;
    },

    getSessionByJWT: async function (token: string) {
      let session;
      try {
        session = await client.session.findUnique({
          where: { jwt: token },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Session"
        );
      }
      return session;
    },
  };
}

export default sessionQueries;
