//Import Prisma ORM Types
import { Purchase } from "@prisma/client";

import { FastifyPluginAsync } from "fastify";

//Import contoller functions
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
  fastify.get<{ Reply: Purchase[] }>(
    "/",
    {
      schema: {
        tags: ["purchase"],
        description: "Fetch user's purchases",
      },
    },
    async function (request, reply) {
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
    }
  );

  fastify.get<{ Params: { id: number }; Reply: Purchase }>(
    "/:id",
    {
      schema: {
        tags: ["purchase"],
        description: "Fetch a specific user's purchase",
        params: {
          type: "object",
          description: "Id of the purchase to fetch",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const purchase = await getPurchase(fastify, request.params.id);

      if (purchase.userId !== userId) {
        await fastify.auth.authorize(userId, 1);
      }

      return reply.status(200).send(purchase);
    }
  );

  fastify.put<{ Body: { goodiesId: string }; Reply: string }>(
    "/",
    {
      schema: {
        tags: ["purchase"],
        description: "Create a purchase for the current user",
        body: {
          type: "object",
          description: "Id of the goodies to buy",
          properties: {
            goodiesId: { type: "number" },
          },
          required: ["goodiesId"],
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await createPurchase(fastify, userId, parseInt(request.body.goodiesId));

      return reply.status(201).send("Purchase created");
    }
  );

  fastify.delete<{ Params: { id: number }; Reply: string }>(
    "/:id",
    {
      schema: {
        tags: ["purchase", "admin"],
        description: "Delete a purchase (ie. refund the user)",
        params: {
          type: "object",
          description: "Id of the purchase to delete",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 1);

      await deletePurchase(fastify, request.params.id);

      return reply.status(200).send("Purchase deleted");
    }
  );
};

export default purchaseRoute;
