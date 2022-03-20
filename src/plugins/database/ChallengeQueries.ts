import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { ChallengeInfo } from "../../models/ChallengeInfo";

export function challengeQueries(
  fastify: FastifyInstance,
  client: PrismaClient
) {
  return {
    //Get all challenges in DB
    getManyChallenge: async function (
      limit: number,
      offset?: number,
      challengeIds?: number[]
    ) {
      try {
        return await client.challenge.findMany({
          where: { id: { in: challengeIds } },
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

    //Get a challenge by Id
    getChallenge: async function (challengeId: number) {
      try {
        return await client.challenge.findUnique({
          where: { id: challengeId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Create a challenge
    createChallenge: async function (
      challengeInfo: ChallengeInfo,
      creatorId: number
    ) {
      try {
        return await client.challenge.create({
          data: { ...challengeInfo, creatorId: creatorId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Update a challenge by Id
    updateChallenge: async function (
      challengeInfo: ChallengeInfo,
      challengeId: number
    ) {
      try {
        return await client.challenge.update({
          where: { id: challengeId },
          data: challengeInfo,
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Delete a challenge by Id
    deleteChallenge: async function (challengeId: number) {
      try {
        return await client.challenge.delete({ where: { id: challengeId } });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Get number of challenges in db
    getChallengeCount: async function () {
      try {
        return await client.challenge.count();
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },
  };
}

export default challengeQueries;
