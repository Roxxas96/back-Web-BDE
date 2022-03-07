import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

function sessionQueries(fastify: FastifyInstance, client: PrismaClient) {
  return {
    //Get all sessions in DB
    getManySession: async function (
      limit: number,
      offset?: number,
      userId?: number
    ) {
      try {
        return await client.session.findMany({
          where: { userId },
          take: limit,
          skip: offset,
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Session"
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
          "Database Fetch Error on Table Session"
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
          "Database Create Error on Table Session"
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
          "Database Delete Error on Table Session"
        );
      }
    },
  };
}

export default sessionQueries;
