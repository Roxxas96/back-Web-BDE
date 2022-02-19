import { FastifyInstance } from "fastify";

//Get all purchase concerning the user when userId is provided, or if admin (ie. no userId provided) get all purchases in DB
export async function getUserPurchase(
  fastify: FastifyInstance,
  userId: number
) {
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid User id");
  }

  const purchases = await fastify.prisma.purchase.getManyPurchase(userId);

  //Check if purchase is empty
  if (!purchases || !purchases.length) {
    throw fastify.httpErrors.notFound("No Purchase found");
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
