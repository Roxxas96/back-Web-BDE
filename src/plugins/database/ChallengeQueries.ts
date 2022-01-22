import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { ChallengeInfo } from "../../models/ChallengeInfo";

export function challengeQueries(
  fastify: FastifyInstance,
  client: PrismaClient
) {
  return {
    //Get all challenges in DB
    getManyChallenge: async function () {
      let challenge;
      try {
        challenge = await client.challenge.findMany();
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Challenge"
        );
      }
      return challenge;
    },

    //Get a challenge by Id
    getChallenge: async function (challengeId: number) {
      let challenge;
      try {
        challenge = await client.challenge.findUnique({
          where: { id: challengeId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Challenge"
        );
      }
      return challenge;
    },

    //Create a challenge
    createChallenge: async function (
      challengeInfo: ChallengeInfo,
      creatorId: number
    ) {
      try {
        await client.challenge.create({
          data: { ...challengeInfo, creatorId: creatorId },
        });
      } catch (err) {
        if (err instanceof Error) {
          if (
            err.message.includes(
              'violates check constraint \\"Challenge_reward_check\\"'
            )
          ) {
            throw fastify.httpErrors.badRequest("Reward must be positive");
          }
        }

        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Create Error on Table Challenge"
        );
      }
    },

    //Update a challenge by Id
    updateChallenge: async function (
      challengeInfo: ChallengeInfo,
      challengeId: number
    ) {
      try {
        await client.challenge.update({
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
              'violates check constraint \\"Challenge_reward_check\\"'
            )
          ) {
            throw fastify.httpErrors.badRequest("Reward must be positive");
          }
        }

        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Update Error on Table Challenge"
        );
      }
    },

    //Delete a challenge by Id
    deleteChallenge: async function (challengeId: number) {
      try {
        await client.challenge.delete({ where: { id: challengeId } });
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes("Record to delete does not exist")) {
            throw fastify.httpErrors.notFound("Challenge not found");
          }
        }

        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Delete Error on Table Challenge"
        );
      }
    },
  };
}

export default challengeQueries;
