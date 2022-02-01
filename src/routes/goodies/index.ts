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
  fastify.get<{ Reply: { message: string; goodies: GoodiesInfoMinimal[] } }>(
    "/",
    {
      schema: {
        tags: ["goodies"],
        description: "Fetch all goodies",
      },
    },
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const goodies = await getManyGoodies(fastify);

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

  fastify.put<{ Body: GoodiesInfo; Reply: { message: string } }>(
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

      await createGoodies(fastify, goodiesInfo, userId);

      return reply.status(201).send({ message: "Goodies created" });
    }
  );

  fastify.patch<{
    Body: GoodiesInfo;
    Params: { id: number };
    Reply: { message: string };
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

      await updateGoodies(fastify, goodiesInfo, request.params.id);

      return reply.status(201).send({ message: "Goodies updated" });
    }
  );

  fastify.delete<{ Params: { id: number }; Reply: { message: string } }>(
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

      await deleteGoodies(fastify, request.params.id);

      return reply.status(200).send({ message: "Goodies deleted" });
    }
  );
};

export default goodiesRoute;
