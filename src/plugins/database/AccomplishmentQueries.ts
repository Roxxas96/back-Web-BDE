import { PrismaClient, Validation } from "@prisma/client";
import { FastifyInstance } from "fastify";

export function accomplishmentQueries(
  fastify: FastifyInstance,
  client: PrismaClient
) {
  return {
    //Get Many accomplishment, by default fetch all DB, if a userId is provided just fetch accomplishmend made by this user
    getManyAccomplishment: async function (
      limit?: number,
      offset?: number,
      userId?: number,
      validation?: Validation,
      challengeId?: number,
      accomplishmentIds?: number[]
    ) {
      try {
        return await client.accomplishment.findMany({
          where: {
            userId,
            validation,
            challengeId,
            id: { in: accomplishmentIds },
          },
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

    //Get an accomplishment by Id
    getAccomplishment: async function (accomplishmentId: number) {
      try {
        return await client.accomplishment.findUnique({
          where: { id: accomplishmentId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Create an accomplishment
    createAccomplishment: async function (
      userId: number,
      challengeId: number,
      comment?: string
    ) {
      try {
        return await client.accomplishment.create({
          data: {
            comment,
            userId: userId,
            challengeId: challengeId,
          },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Update an accomplishment by Id
    updateAccomplishment: async function (
      accomplishmentId: number,
      comment?: string,
      validation?: Validation,
      refusedComment?: string
    ) {
      try {
        return await client.accomplishment.update({
          where: { id: accomplishmentId },
          data: { comment, validation, refusedComment },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Delete an accomplishment by Id
    deleteAccomplishment: async function (accomplishmentId: number) {
      try {
        return await client.accomplishment.delete({
          where: { id: accomplishmentId },
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

export default accomplishmentQueries;
