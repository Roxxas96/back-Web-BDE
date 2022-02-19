import { Purchase } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { createPurchase, getUserPurchase } from "./controller";

const userPurchaseRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{
    Params: { id: number };
    Reply: { message: string; purchases: Purchase[] };
  }>(
    "/:id",
    {
      schema: {
        tags: ["user", "purchase"],
        description: "Get a user purchases",
        params: {
          type: "object",
          description: "Id of the user",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      if (request.params.id !== userId) {
        await fastify.auth.authorize(userId, 1);
      }

      const purchases = await getUserPurchase(fastify, request.params.id);

      return reply.status(200).send({ message: "Success", purchases });
    }
  );

  fastify.put<{
    Params: { id: number };
    Body: { goodiesId: number };
    Reply: { message: string };
  }>(
    "/:id",
    {
      schema: {
        tags: ["user", "purchase"],
        description: "Create a purchase for the provided user",
        body: {
          type: "object",
          description: "Id of the goodies to buy",
          properties: {
            goodiesId: { type: "number" },
          },
          required: ["goodiesId"],
        },
        params: {
          type: "object",
          description: "Id of the user",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
      },
    },
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const goodiesId = request.body.goodiesId;

      await createPurchase(fastify, request.params.id, goodiesId);

      return reply.status(201).send({ message: "Success" });
    }
  );
};

export default userPurchaseRoute;
