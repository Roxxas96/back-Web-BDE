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
  fastify.get<{
    Reply: { message: string; purchases: Purchase[] };
    Querystring: {
      limit?: number;
      offset?: number;
      goodiesId?: number;
      userId?: number;
    };
  }>(
    "/",
    {
      schema: {
        tags: ["purchase"],
        description: "Fetch user's purchases",
        querystring: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of elements to fetch",
            },
            offset: {
              type: "number",
              description: "Offset in element list from which fetch begins",
            },
            goodiesId: {
              type: "number",
              description: "Filter by goodies id",
            },
            userId: {
              type: "number",
              description: "Filter by user id",
            },
          },
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      //Only admins can get other's purchases or get all purchases
      if (request.query.userId) {
        if (request.query.userId !== userId) {
          await fastify.auth.authorize(userId, 1);
        }
      } else {
        await fastify.auth.authorize(userId, 1);
      }

      const purchases = await getManyPurchase(
        fastify,
        request.query.userId,
        request.query.goodiesId,
        request.query.limit,
        request.query.offset
      );

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

  fastify.put<{
    Body: { goodiesId: string };
    Reply: { message: string; purchaseId: number };
  }>(
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

      const createdPurchase = await createPurchase(
        fastify,
        userId,
        parseInt(request.body.goodiesId)
      );

      return reply
        .status(201)
        .send({ message: "Purchase created", purchaseId: createdPurchase.id });
    }
  );

  fastify.delete<{
    Params: { id: number };
    Reply: { message: string; purchaseId: number };
  }>(
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

      const deletedPurchase = await deletePurchase(fastify, request.params.id);

      return reply
        .status(200)
        .send({ message: "Purchase deleted", purchaseId: deletedPurchase.id });
    }
  );
};

export default purchaseRoute;
