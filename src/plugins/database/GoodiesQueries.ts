import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { GoodiesInfo } from "../../models/GoodiesInfo";

export function goodiesQueries(fastify: FastifyInstance, client: PrismaClient) {
  return {
    //Get all goodies in DB
    getManyGoodies: async function (limit: number, offset?: number) {
      let goodies;
      try {
        goodies = await client.goodies.findMany({
          take: limit,
          skip: offset,
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Goodies"
        );
      }
      return goodies;
    },

    //Get a goodies by Id
    getGoodies: async function (goodiesId: number) {
      let goodies;
      try {
        goodies = await client.goodies.findUnique({
          where: { id: goodiesId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Goodies"
        );
      }
      return goodies;
    },

    //Create a goodies
    createGoodies: async function (
      goodiesInfo: GoodiesInfo,
      creatorId: number
    ) {
      try {
        await client.goodies.create({
          data: { ...goodiesInfo, creatorId: creatorId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Create Error on Table Goodies"
        );
      }
    },

    //Update a goodies by Id
    updateGoodies: async function (
      goodiesInfo: GoodiesInfo,
      goodiesId: number
    ) {
      try {
        await client.goodies.update({
          where: { id: goodiesId },
          data: goodiesInfo,
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Update Error on Table Goodies"
        );
      }
    },

    //Delete a goodies by Id
    deleteGoodies: async function (goodiesId: number) {
      try {
        await client.goodies.delete({ where: { id: goodiesId } });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Delete Error on Table Goodies"
        );
      }
    },
  };
}

export default goodiesQueries;
