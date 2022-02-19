import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

export function purchaseQueries(
  fastify: FastifyInstance,
  client: PrismaClient
) {
  return {
    //Get Many purchase, by default fetch all DB, if a userId is provided just fetch purchase made by this user
    getManyPurchase: async function (
      limit: number,
      offset?: number,
      userId?: number,
      goodiesId?: number
    ) {
      let purchase;
      try {
        purchase = await client.purchase.findMany({
          where: { userId, goodiesId },
          take: limit,
          skip: offset,
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Purchase"
        );
      }
      return purchase;
    },

    //Get a purchase by Id
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

    //Create a purchase
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

    //Delete a purchase
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
