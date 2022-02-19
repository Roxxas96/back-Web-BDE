import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { AccomplishmentInfo } from "../../models/AccomplishmentInfo";

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
      validation?: -1 | null | 1,
      challengeId?: number
    ) {
      let accomplishment;
      try {
        accomplishment = await client.accomplishment.findMany({
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
      return accomplishment;
    },

    //Get an accomplishment by Id
    getAccomplishment: async function (accomplishmentId: number) {
      let accomplishment;
      try {
        accomplishment = await client.accomplishment.findUnique({
          where: { id: accomplishmentId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Accomplishment"
        );
      }
      return accomplishment;
    },

    //Create an accomplishment
    createAccomplishment: async function (
      accomplishmentInfo: AccomplishmentInfo,
      userId: number,
      challengeId: number
    ) {
      try {
        await client.accomplishment.create({
          data: {
            ...accomplishmentInfo,
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
      accomplishmentInfo?: AccomplishmentInfo,
      validation?: 1 | -1
    ) {
      try {
        await client.accomplishment.update({
          where: { id: accomplishmentId },
          data: { ...accomplishmentInfo, validation: validation },
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
        await client.accomplishment.delete({
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
