import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { AccomplishmentInfo } from "../../models/AccomplishmentInfo";

export function accomplishmentQueries(
  fastify: FastifyInstance,
  client: PrismaClient
) {
  return {
    getManyAccomplishment: async function (userId?: number) {
      let accomplishment;
      console.log(userId);
      try {
        accomplishment = await client.accomplishment.findMany({
          where: { userId: userId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Accomplishment"
        );
      }
      console.log(accomplishment);
      return accomplishment;
    },

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
