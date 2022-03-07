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
      challengeId?: number
    ) {
      try {
        return await client.accomplishment.findMany({
          where: { userId, validation, challengeId },
          take: limit,
          skip: offset,
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Accomplishment"
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
          "Database Fetch Error on Table Accomplishment"
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
        if (err instanceof Error) {
          if (
            err.message.includes(
              "Foreign key constraint failed on the field: `accomplishmentChallenge (index)`"
            )
          ) {
            throw fastify.httpErrors.badRequest("Invalid challenge id");
          }
        }
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Create Error on Table Accomplishment"
        );
      }
    },

    //Update an accomplishment by Id
    updateAccomplishment: async function (
      accomplishmentId: number,
      comment?: string,
      validation?: Validation
    ) {
      try {
        return await client.accomplishment.update({
          where: { id: accomplishmentId },
          data: { comment, validation },
        });
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes("Record to update not found")) {
            throw fastify.httpErrors.notFound("Accomplishment not found");
          }
          if (
            err.message.includes(
              "Accomplishment has allready a validation state"
            )
          ) {
            throw fastify.httpErrors.badRequest(
              "Accomplishment was allready validated"
            );
          }
        }

        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Update Error on Table Accomplishment"
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
        if (err instanceof Error) {
          if (err.message.includes("Record to delete does not exist")) {
            throw fastify.httpErrors.notFound("Accomplishment not found");
          }
        }

        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Delete Error on Table Accomplishment"
        );
      }
    },
  };
}

export default accomplishmentQueries;
