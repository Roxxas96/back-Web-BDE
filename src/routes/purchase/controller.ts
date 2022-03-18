import { FastifyInstance } from "fastify";
import { GoodiesInfoMinimal } from "../../models/GoodiesInfo";
import { UserInfoMinimal } from "../../models/UserInfo";

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

  const user = purchase.userId
    ? await fastify.prisma.user.getUser(purchase.userId)
    : undefined;

  const goodies = purchase.goodiesId
    ? await fastify.prisma.goodies.getGoodies(purchase.goodiesId)
    : undefined;

  return {
    ...purchase,
    goodies: goodies
      ? ({
          id: goodies.id,
          name: goodies.name,
          price: goodies.price,
        } as GoodiesInfoMinimal)
      : undefined,
    user: user
      ? ({ id: user.id, pseudo: user.pseudo } as UserInfoMinimal)
      : undefined,
    goodiesId: goodies ? undefined : purchase.goodiesId,
    userId: user ? undefined : purchase.userId,
  };
}

//Get all purchase concerning the user when userId is provided, or if admin (ie. no userId provided) get all purchases in DB
export async function getManyPurchase(
  fastify: FastifyInstance,
  userId?: number,
  goodiesId?: number,
  limit?: number,
  offset?: number,
  delivered?: boolean
) {
  const purchases = await fastify.prisma.purchase.getManyPurchase(
    limit || 20,
    offset,
    userId,
    goodiesId,
    delivered
  );

  return await Promise.all(
    purchases.map(async (purchase) => {
      const user = purchase.userId
        ? await fastify.prisma.user.getUser(purchase.userId)
        : undefined;

      const goodies = purchase.goodiesId
        ? await fastify.prisma.goodies.getGoodies(purchase.goodiesId)
        : undefined;

      return {
        ...purchase,
        goodies: goodies
          ? ({
              id: goodies.id,
              name: goodies.name,
              price: goodies.price,
            } as GoodiesInfoMinimal)
          : undefined,
        user: user
          ? ({ id: user.id, pseudo: user.pseudo } as UserInfoMinimal)
          : undefined,
        goodiesId: goodies ? undefined : purchase.goodiesId,
        userId: user ? undefined : purchase.userId,
      };
    })
  );
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

  if (goodies.bought >= goodies.stock) {
    throw fastify.httpErrors.badRequest("Out of stock for this goodies");
  }

  //Increase goodies bough amount
  await fastify.prisma.goodies.updateGoodies(
    { bought: goodies.bought + 1 },
    goodies.id
  );

  //Decrease user's wallet
  await fastify.prisma.user.updateUser(user.id, {
    wallet: user.wallet - goodies.price,
  });

  return await fastify.prisma.purchase.createPurchase(user.id, goodies.id);
}

export async function updatePurchase(
  fastify: FastifyInstance,
  purchaseId: number,
  delivered: boolean
) {
  if (!purchaseId) {
    throw fastify.httpErrors.badRequest("Invalid purchase id");
  }

  const purchase = await fastify.prisma.purchase.getPurchase(purchaseId);

  if (!purchase) {
    throw fastify.httpErrors.notFound("Purchase not found");
  }

  return await fastify.prisma.purchase.updatePurchase(purchaseId, delivered);
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

  //If purchase is referencing valid goodies & user, refund user
  if (purchase.goodiesId && purchase.userId) {
    const goodies = await fastify.prisma.goodies.getGoodies(purchase.goodiesId);
    const user = await fastify.prisma.user.getUser(purchase.userId);

    //Refund user
    if (user && goodies) {
      await fastify.prisma.user.updateUser(user.id, {
        wallet: user.wallet + goodies.price,
      });
    }
  }

  return await fastify.prisma.purchase.deletePurchase(purchaseId);
}
