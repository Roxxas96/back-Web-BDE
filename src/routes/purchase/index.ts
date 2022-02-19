//Import Prisma ORM Types
import { Purchase } from "@prisma/client";

import { FastifyPluginAsync } from "fastify";

//Import contoller functions
import {
  createPurchase,
  deletePurchase,
  getUserPurchase,
  getPurchase,
  getAllPurchase,
} from "./controller";

const purchaseRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{ Reply: { message: string; purchases: Purchase[] } }>(
    "/",
    {
      schema: {
        tags: ["purchase"],
        description: "Fetch user's purchases",
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const purchases = await getUserPurchase(fastify, userId);

      return reply.status(200).send({ message: "Success", purchases });
    }
  );

  fastify.get<{
    Params: { id: number };
    Reply: { message: string; purchase: Purchase };
  }>(
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

      return reply.status(200).send({ message: "Success", purchase });
    }
  );

  fastify.get(
    "/all",
    {
      schema: {
        tags: ["purchase", "super admin"],
        description: "Fetch all existing purchases",
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 2);

      const purchases = await getAllPurchase(fastify);

      return reply.status(200).send({ message: "Success", purchases });
    }
  );

  fastify.put<{ Body: { goodiesId: string }; Reply: { message: string } }>(
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

      return reply.status(201).send({ message: "Purchase created" });
    }
  );

  fastify.delete<{ Params: { id: number }; Reply: { message: string } }>(
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

      return reply.status(200).send({ message: "Purchase deleted" });
    }
  );
};

export default purchaseRoute;
