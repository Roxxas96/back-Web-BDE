import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { GoodiesInfo } from "../../models/GoodiesInfo";

export function goodiesQueries(fastify: FastifyInstance, client: PrismaClient) {
  return {
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

    getManyGoodies: async function () {
      let goodies;
      try {
        goodies = await client.goodies.findMany();
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Goodies"
        );
      }
      return goodies;
    },

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
