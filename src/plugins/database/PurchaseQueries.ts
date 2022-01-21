import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

export function purchaseQueries(
  fastify: FastifyInstance,
  client: PrismaClient
) {
  return {
    getManyPurchase: async function (userId: number) {
      let purchases;
      try {
        purchases = await client.purchases.findMany({
          where: { userId: userId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Purchases"
        );
      }
      return purchases;
    },

    getPurchase: async function (purchaseId: number) {
      let purchase;
      try {
        purchase = await client.purchases.findUnique({
          where: { id: purchaseId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Purchases"
        );
      }
      return purchase;
    },

    createPurchase: async function (userId: number, goodiesId: number) {
      try {
        await client.purchases.create({
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
          "Database Create Error on Table Purchases"
        );
      }
    },

    deletePurchase: async function (purchaseId: number) {
      try {
        await client.purchases.delete({ where: { id: purchaseId } });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Delete Error on Table Purchases"
        );
      }
    },
  };
}

export default purchaseQueries;
