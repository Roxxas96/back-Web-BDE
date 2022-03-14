import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

export function purchaseQueries(
  fastify: FastifyInstance,
  client: PrismaClient
) {
  return {
    //Get Many purchase, by default fetch all DB, if a userId is provided just fetch purchase made by this user
    getManyPurchase: async function (
      limit?: number,
      offset?: number,
      userId?: number,
      goodiesId?: number,
      delivered?: boolean,
      purchaseIds?: number[]
    ) {
      try {
        return await client.purchase.findMany({
          where: { userId, goodiesId, delivered, id: { in: purchaseIds } },
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

    //Get a purchase by Id
    getPurchase: async function (purchaseId: number) {
      try {
        return await client.purchase.findUnique({
          where: { id: purchaseId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Create a purchase
    createPurchase: async function (userId: number, goodiesId: number) {
      try {
        return await client.purchase.create({
          data: { userId: userId, goodiesId: goodiesId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    updatePurchase: async function (purchaseId: number, delivered: boolean) {
      try {
        return await client.purchase.update({
          where: { id: purchaseId },
          data: { delivered },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Delete a purchase
    deletePurchase: async function (purchaseId: number) {
      try {
        return await client.purchase.delete({ where: { id: purchaseId } });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },
  };
}

export default purchaseQueries;
