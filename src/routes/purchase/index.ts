import { Purchases } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import {
  createPurchase,
  deletePurchase,
  getManyPurchase,
  getPurchase,
} from "./controller";

const purchaseRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{ Reply: Purchases[] }>("/", async function (request, reply) {
    const userId = await fastify.auth.authenticate(request.headers);

    let purchases;

    switch (await fastify.auth.getPrivilege(userId)) {
      case 0:
        purchases = await getManyPurchase(fastify, userId);
        break;
      default:
        purchases = await getManyPurchase(fastify);
        break;
    }

    return reply.status(200).send(purchases);
  });

  fastify.get<{ Params: { id: string }; Reply: Purchases }>(
    "/:id",
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const purchase = await getPurchase(fastify, parseInt(request.params.id));

      if (purchase.userId !== userId) {
        await fastify.auth.authorize(userId, 1);
      }

      return reply.status(200).send(purchase);
    }
  );

  fastify.put<{ Body: { goodiesId: string }; Reply: string }>(
    "/",
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await createPurchase(fastify, userId, parseInt(request.body.goodiesId));

      return reply.status(201).send("Purchase created");
    }
  );

  fastify.delete<{ Params: { id: string }; Reply: string }>(
    "/:id",
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 1);

      await deletePurchase(fastify, parseInt(request.params.id));

      return reply.status(200).send("Purchase deleted");
    }
  );
};

export default purchaseRoute;
