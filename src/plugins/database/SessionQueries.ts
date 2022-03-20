import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

function sessionQueries(fastify: FastifyInstance, client: PrismaClient) {
  return {
    //Get all sessions in DB
    getManySession: async function (
      limit: number,
      offset?: number,
      userId?: number,
      sessionIds?: number[]
    ) {
      try {
        return await client.session.findMany({
          where: { userId, id: { in: sessionIds } },
          take: limit,
          skip: offset,
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Get a session by Id or by JWT
    getSession: async function (sessionId?: number, jwt?: string) {
      try {
        return await client.session.findUnique({
          where: { id: sessionId, jwt },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Create session
    createSession: async function (token: string, userId: number) {
      try {
        return await client.session.create({
          data: { jwt: token, userId: userId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Delete session by Id
    deleteSession: async function (sessionId?: number, jwt?: string) {
      try {
        return await client.session.delete({ where: { jwt, id: sessionId } });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Get number of sessions in db
    getSessionCount: async function (
      userId?: number,
    ) {
      try {
        return await client.session.count({
          where: { userId, },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },
  };
}

export default sessionQueries;
