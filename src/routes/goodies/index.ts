//Import Prisma ORM Types
import { Goodies } from "@prisma/client";

import { FastifyPluginAsync } from "fastify";

//Import Models
import {
  GoodiesInfo,
  GoodiesInfoMinimal,
  GoodiesSchema,
} from "../../models/GoodiesInfo";

//Import controller functions
import {
  createGoodies,
  deleteGoodies,
  getGoodies,
  getManyGoodies,
  updateGoodies,
} from "./controller";

const goodiesRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{
    Reply: { message: string; goodies: GoodiesInfoMinimal[] };
    Querystring: { limit?: number; offset?: number };
  }>(
    "/",
    {
      schema: {
        tags: ["goodies"],
        description: "Fetch all goodies",
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
          },
        },
      },
    },
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const goodies = await getManyGoodies(
        fastify,
        request.query.limit,
        request.query.offset
      );

      return reply.status(200).send({ message: "Success", goodies });
    }
  );

  fastify.get<{
    Params: { id: number };
    Reply: { message: string; goodies: Goodies };
  }>(
    "/:id",
    {
      schema: {
        tags: ["goodies"],
        description: "Get a specific goodies info",
        params: {
          type: "object",
          description: "Id of the goodies to fetch",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
      },
    },
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const goodies = await getGoodies(fastify, request.params.id);

      return reply.status(200).send({ message: "Success", goodies });
    }
  );

  fastify.put<{
    Body: GoodiesInfo;
    Reply: { message: string; goodiesId: number };
  }>(
    "/",
    {
      schema: {
        tags: ["goodies", "admin"],
        description: "Create a goodies with provided info",
        body: GoodiesSchema,
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const goodiesInfo = request.body;

      await fastify.auth.authorize(userId, 1);

      const createdGoodies = await createGoodies(fastify, goodiesInfo, userId);

      return reply
        .status(201)
        .send({ message: "Goodies created", goodiesId: createdGoodies.id });
    }
  );

  fastify.patch<{
    Body: GoodiesInfo;
    Params: { id: number };
    Reply: { message: string; goodiesId: number };
  }>(
    "/:id",
    {
      schema: {
        tags: ["goodies", "admin"],
        description: "Update a goodies with the provided info",
        body: GoodiesSchema,
        params: {
          type: "object",
          description: "Id of the goodies to update",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const goodiesInfo = request.body;

      await fastify.auth.authorize(userId, 1);

      const updatedGoodies = await updateGoodies(
        fastify,
        goodiesInfo,
        request.params.id
      );

      return reply
        .status(201)
        .send({ message: "Goodies updated", goodiesId: updatedGoodies.id });
    }
  );

  fastify.delete<{
    Params: { id: number };
    Reply: { message: string; goodiesId: number };
  }>(
    "/:id",
    {
      schema: {
        tags: ["goodies", "admin"],
        description: "Delete a specific goodies",
        params: {
          type: "object",
          description: "Id of the goodies to delte",
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

      const deletedGoodies = await deleteGoodies(fastify, request.params.id);

      return reply
        .status(200)
        .send({ message: "Goodies deleted", goodiesId: deletedGoodies.id });
    }
  );
};

export default goodiesRoute;
