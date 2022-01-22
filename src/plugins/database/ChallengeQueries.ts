import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { ChallengeInfo } from "../../models/ChallengeInfo";

export function challengeQueries(
  fastify: FastifyInstance,
  client: PrismaClient
) {
  return {
    getManyChallenge: async function () {
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

    createChallenge: async function (
      challengeInfo: ChallengeInfo,
      creatorId: number
    ) {
      try {
        await client.challenges.create({
          data: { ...challengeInfo, creatorId: creatorId },
        });
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
  };
}

export default challengeQueries;
