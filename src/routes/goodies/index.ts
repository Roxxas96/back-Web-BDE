//Import Prisma ORM Types
import { FastifyPluginAsync } from "fastify";

//Import Models
import { GoodiesInfo, GoodiesSchema } from "../../models/GoodiesInfo";

//Import controller functions
import {
  createGoodies,
  deleteGoodies,
  deleteGoodiesPicture,
  getGoodies,
  getGoodiesPicture,
  getManyGoodies,
  updateGoodies,
  updateGoodiesPicture,
} from "./controller";
import internal = require("stream");

const goodiesRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{
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
  }>(
    "/:id",
    {
      schema: {
        tags: ["goodies"],
        description: "Get a specific goodies info",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "number", description: "Id of the goodies to fetch" },
          },
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
          required: ["id"],
          properties: {
            id: { type: "number", description: "Id of the goodies to update" },
          },
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
          required: ["id"],
          properties: {
            id: { type: "number", description: "Id of the goodies to delte" },
          },
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

  fastify.put<{
    Querystring: { goodiesId: number };
    Reply: { message: string, goodiesPictureId: string };
  }>(
    "/picture",
    {
      schema: {
        tags: ["goodies"],
        description: "Upload a goodies picture for the designated goodies",
        consumes: ["multipart/form-data"],
        querystring: {
          type: "object",
          required: ["goodiesId"],
          properties: {
            goodiesId: {
              type: "number",
              description: "Id of the goodies",
            },
          },
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const goodies = await getGoodies(fastify, request.query.goodiesId);

      if (goodies.creatorId !== userId && goodies.creator?.id !== userId) {
        await fastify.auth.authorize(userId, 2);
      }

      const goodiesPictureId = await updateGoodiesPicture(
        fastify,
        (
          await request.file()
        ).file,
        goodies.id,
        goodies.imageId
      );

      reply.status(200).send({ message: "Success", goodiesPictureId });
    }
  );

  fastify.get<{
    Params: { id: string };
    Reply: internal.Readable;
  }>(
    "/picture/:id",
    {
      schema: {
        tags: ["goodies"],
        description: "Get the goodies picture of the designated goodies",
        produces: ["application/octet-stream"],
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Id of the goodiesPicture to fetch",
            },
          },
        },
      },
    },
    async function (request, reply) {
      const goodiesPicture = await getGoodiesPicture(
        fastify,
        request.params.id
      );

      reply.status(200).send(goodiesPicture);
    }
  );

  fastify.delete<{
    Querystring: { goodiesId: number };
    Reply: { message: string };
  }>(
    "/picture",
    {
      schema: {
        tags: ["goodies"],
        description: "Delete the goodies picture of the designated goodies",
        querystring: {
          type: "object",
          required: ["goodiesId"],
          properties: {
            goodiesId: {
              type: "number",
              description: "Id of the goodies",
            },
          },
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const goodies = await getGoodies(fastify, request.query.goodiesId);

      if (goodies.creatorId !== userId && goodies.creator?.id !== userId) {
        await fastify.auth.authorize(userId, 2);
      }

      await deleteGoodiesPicture(fastify, goodies.id);

      reply.status(200).send({ message: "Success" });
    }
  );
};

export default goodiesRoute;
