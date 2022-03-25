import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { GoodiesInfo } from "../../models/GoodiesInfo";

export function goodiesQueries(fastify: FastifyInstance, client: PrismaClient) {
  return {
    //Get all goodies in DB
    getManyGoodies: async function (
      limit: number,
      offset?: number,
      goodiesIds?: number[]
    ) {
      try {
        return await client.goodies.findMany({
          where: { id: { in: goodiesIds } },
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

    //Get a goodies by Id
    getGoodies: async function (goodiesId: number) {
      try {
        return await client.goodies.findUnique({
          where: { id: goodiesId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Create a goodies
    createGoodies: async function (
      goodiesInfo: GoodiesInfo,
      creatorId: number
    ) {
      try {
        return await client.goodies.create({
          data: { ...goodiesInfo, creatorId: creatorId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Update a goodies by Id
    updateGoodies: async function (
      goodiesInfo: GoodiesInfo,
      goodiesId: number
    ) {
      try {
        return await client.goodies.update({
          where: { id: goodiesId },
          data: goodiesInfo,
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Delete a goodies by Id
    deleteGoodies: async function (goodiesId: number) {
      try {
        return await client.goodies.delete({ where: { id: goodiesId } });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Get number of challenges in db
    getGoodiesCount: async function () {
      try {
        return await client.goodies.count();
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },
  };
}

export default goodiesQueries;
