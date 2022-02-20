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
  userId?: number,
  goodiesId?: number,
  limit?: number,
  offset?: number
) {
  const purchases = await fastify.prisma.purchase.getManyPurchase(
    limit || 20,
    offset,
    userId,
    goodiesId
  );

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

  const user = await fastify.prisma.user.getUser(userId);

  if (!user) {
    throw fastify.httpErrors.badRequest("Referenced user not found");
  }

  const goodies = await fastify.prisma.goodies.getGoodies(goodiesId);

  if (!goodies) {
    throw fastify.httpErrors.badRequest("Referenced goodies not found");
  }

  const ownedPurchases = await fastify.prisma.purchase.getManyPurchase(
    undefined,
    undefined,
    user.id,
    goodies.id
  );

  if (ownedPurchases && ownedPurchases.length >= goodies.buyLimit) {
    throw fastify.httpErrors.badRequest(
      "Maximum buy limit reached for this goodies"
    );
  }

  if (user.wallet < goodies.price) {
    throw fastify.httpErrors.badRequest(
      "Not enought in wallet to buy this goodies"
    );
  }

  //Decrease user's wallet
  await fastify.prisma.user.updateUser(user.id, {
    wallet: user.wallet - goodies.price,
  });

  await fastify.prisma.purchase.createPurchase(user.id, goodies.id);
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

  const purchase = await fastify.prisma.purchase.getPurchase(purchaseId);

  if (!purchase) {
    throw fastify.httpErrors.notFound("Purchase not found");
  }

  await fastify.prisma.purchase.deletePurchase(purchaseId);
}
