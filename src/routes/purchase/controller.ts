import { FastifyInstance } from "fastify";

//Get purchase by id
export async function getPurchase(
  fastify: FastifyInstance,
  purchaseId: number
) {
  //Check purchase id
  if (!purchaseId) {
    throw fastify.httpErrors.badRequest("Invalid purchase id");
  }

  const purchase = await fastify.prisma.purchase.getPurchase(purchaseId);

  //Check if purchase is empty
  if (!purchase) {
    throw fastify.httpErrors.notFound("Purchase not found");
  }

  return purchase;
}

//Get all purchase concerning the user when userId is provided, or if admin (ie. no userId provided) get all purchases in DB
export async function getManyPurchase(
  fastify: FastifyInstance,
  userId?: number
) {
  const purchases = await fastify.prisma.purchase.getManyPurchase(userId);

  //Check if purchase is empty
  if (!purchases || !purchases.length) {
    throw fastify.httpErrors.notFound("No Purchase in DB");
  }

  return purchases;
}

//Create a purchase with provided info
export async function createPurchase(
  fastify: FastifyInstance,
  userId: number,
  goodiesId: number
) {
  //Check goodies id
  if (!goodiesId) {
    throw fastify.httpErrors.badRequest("Invalid goodies id");
  }

  //Check buyer id
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  await fastify.prisma.purchase.createPurchase(userId, goodiesId);
}

//Delete  purchase (ie. refund) by id
export async function deletePurchase(
  fastify: FastifyInstance,
  purchaseId: number
) {
  //Check purchase id
  if (!purchaseId) {
    throw fastify.httpErrors.badRequest("Invalid purchase id");
  }

  await fastify.prisma.purchase.deletePurchase(purchaseId);
}
