import { FastifyInstance } from "fastify";

export async function getPurchase(
  fastify: FastifyInstance,
  purchaseId: number
) {
  if (!purchaseId) {
    throw fastify.httpErrors.badRequest("Invalid purchase id");
  }

  const purchase = await fastify.prisma.purchase.getPurchase(purchaseId);

  if (!purchase) {
    throw fastify.httpErrors.notFound("Purchase not found");
  }

  return purchase;
}

export async function getManyPurchase(
  fastify: FastifyInstance,
  userId?: number
) {
  const purchases = await fastify.prisma.purchase.getManyPurchase(userId);

  if (!purchases || !purchases.length) {
    throw fastify.httpErrors.notFound("No Purchase in DB");
  }

  return purchases;
}

export async function createPurchase(
  fastify: FastifyInstance,
  userId: number,
  goodiesId: number
) {
  if (!goodiesId) {
    throw fastify.httpErrors.badRequest("Invalid goodies id");
  }

  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  await fastify.prisma.purchase.createPurchase(userId, goodiesId);
}

export async function deletePurchase(
  fastify: FastifyInstance,
  purchaseId: number
) {
  if (!purchaseId) {
    throw fastify.httpErrors.badRequest("Invalid purchase id");
  }

  await fastify.prisma.purchase.deletePurchase(purchaseId);
}
