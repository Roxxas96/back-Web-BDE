import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

export function purchaseQueries(
  fastify: FastifyInstance,
  client: PrismaClient
) {
  return {
    getManyPurchase: async function (userId: number) {
      let purchase;
      try {
        purchase = await client.purchase.findMany({
          where: { userId: userId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Purchase"
        );
      }
      return purchase;
    },

    getPurchase: async function (purchaseId: number) {
      let purchase;
      try {
        purchase = await client.purchase.findUnique({
          where: { id: purchaseId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Purchase"
        );
      }
      return purchase;
    },

    createPurchase: async function (userId: number, goodiesId: number) {
      try {
        await client.purchase.create({
          data: { userId: userId, goodiesId: goodiesId },
        });
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes("Not enought money in wallet")) {
            throw fastify.httpErrors.badRequest("Not enought money in wallet");
          }
          if (err.message.includes("Limit reached")) {
            throw fastify.httpErrors.badRequest("Purchase limit reached");
          }
        }
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Create Error on Table Purchase"
        );
      }
    },

    deletePurchase: async function (purchaseId: number) {
      try {
        await client.purchase.delete({ where: { id: purchaseId } });
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes("Record to delete does not exist")) {
            throw fastify.httpErrors.notFound("Purchase not found");
          }
        }
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Delete Error on Table Purchase"
        );
      }
    },
  };
}

export default purchaseQueries;
