//Import Prisma ORM Types
import { Goodies } from "@prisma/client";
import * as FormData from "form-data";

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
  deleteGoodiesPicture,
  getGoodies,
  getGoodiesPicture,
  getManyGoodies,
  getManyGoodiesPicture,
  updateGoodies,
  updateGoodiesPicture,
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
    Reply: { message: string };
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

      if (goodies.creatorId !== userId) {
        await fastify.auth.authorize(userId, 2);
      }

      await updateGoodiesPicture(fastify, (await request.file()).file, goodies);

      reply.status(200).send({ message: "Success" });
    }
  );

  fastify.get<{
    Querystring: { goodiesId?: number; limit?: number; offset?: number };
    Reply: FormData;
  }>(
    "/picture",
    {
      schema: {
        tags: ["goodies"],
        description: "Get the goodies picture of the designated goodies",
        produces: ["multipart/form-data"],
        querystring: {
          type: "object",
          properties: {
            goodiesId: {
              type: "number",
              description: "Id of the goodies",
            },
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

      if (request.query.goodiesId) {
        const accomplishment = await getGoodies(
          fastify,
          request.query.goodiesId
        );

        const { name, goodiesPicture } = await getGoodiesPicture(
          fastify,
          accomplishment
        );

        const formData = new FormData();
        formData.append(name, goodiesPicture);

        reply
          .status(200)
          .header("content-type", formData.getHeaders())
          .send(formData);
      } else {
        const { goodiesPictures, allQueriesSucceded } =
          await getManyGoodiesPicture(
            fastify,
            request.query.limit,
            request.query.offset
          );

        const formData = new FormData();
        goodiesPictures.forEach((val) =>
          formData.append(`${val.name}`, val.goodiesPicture)
        );

        reply
          .status(allQueriesSucceded ? 200 : 206)
          .header("content-type", formData.getHeaders())
          .send(formData);
      }
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

      if (goodies.creatorId !== userId) {
        await fastify.auth.authorize(userId, 2);
      }

      await deleteGoodiesPicture(fastify, goodies);

      reply.status(200).send({ message: "Success" });
    }
  );
};

export default goodiesRoute;
