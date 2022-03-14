//Import Prisma ORM Types
import { FastifyPluginAsync } from "fastify";

//Import contoller functions
import {
  createPurchase,
  deletePurchase,
  getManyPurchase,
  getPurchase,
  updatePurchase,
} from "./controller";

const purchaseRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{
    Querystring: {
      limit?: number;
      offset?: number;
      goodiesId?: number;
      userId?: number;
      delivered?: boolean;
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
            delivered: {
              type: "boolean",
              description: "Filter by delivered state",
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
        request.query.offset,
        request.query.delivered
      );

      return reply.status(200).send({ message: "Success", purchases });
    }
  );

  fastify.get<{
    Params: { id: number };
  }>(
    "/:id",
    {
      schema: {
        tags: ["purchase"],
        description: "Fetch a specific user's purchase",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "number", description: "Id of the purchase to fetch" },
          },
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
    Querystring: { goodiesId: number };
    Reply: { message: string; purchaseId: number };
  }>(
    "/",
    {
      schema: {
        tags: ["purchase"],
        description: "Create a purchase for the current user",
        querystring: {
          type: "object",
          required: ["goodiesId"],
          properties: {
            goodiesId: {
              type: "number",
              description: "Id of the goodies to buy",
            },
          },
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const createdPurchase = await createPurchase(
        fastify,
        userId,
        request.query.goodiesId
      );

      return reply
        .status(201)
        .send({ message: "Purchase created", purchaseId: createdPurchase.id });
    }
  );

  fastify.patch<{
    Params: { id: number };
    Body: { delivered: boolean };
    Reply: { message: string; purchaseId: number };
  }>(
    "/:id",
    {
      schema: {
        tags: ["purchase", "admin"],
        description:
          "Modify the the provided goodies, used to mark it as delivered",
        body: {
          type: "object",
          properties: {
            delivered: {
              type: "boolean",
              description: "Mark goodies as delivered or not",
            },
          },
        },
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "Id of the purchase to update" },
          },
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 1);

      const updatedPurchase = await updatePurchase(
        fastify,
        request.params.id,
        request.body.delivered
      );

      reply
        .status(200)
        .send({ message: "Success", purchaseId: updatedPurchase.id });
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
          required: ["id"],
          properties: {
            id: { type: "number", description: "Id of the purchase to delete" },
          },
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
