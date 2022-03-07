//Import Prisma ORM types
import { Accomplishment, Validation } from "@prisma/client";

import { FastifyPluginAsync } from "fastify";
import internal = require("stream");

//Import controller functions
import {
  createAccomplishment,
  deleteAccomplishment,
  deleteProof,
  getAccomplishment,
  getManyAccomplishment,
  getProof,
  updateAccomplishment,
  updateProof,
} from "./controller";

const accomplishmentRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{
    Querystring: {
      limit?: number;
      offset?: number;
      challengeId?: number;
      userId?: number;
      status?: Validation;
    };
    Reply: { message: string; accomplishments: Accomplishment[] };
  }>(
    "/",
    {
      schema: {
        tags: ["accomplishment"],
        description: "Fetch info on user's accomplishments",
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
            challengeId: {
              type: "number",
              description: "Filter by challenge id",
            },
            userId: {
              type: "number",
              description: "Filter by user id",
            },
            status: {
              type: "string",
              enum: ["ACCEPTED", "PENDING", "REFUSED"],
              description: "Filter by status",
            },
          },
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      //Only admins can fetch other's accomplishments or all accomplishments
      if (
        (request.query.userId && request.query.userId !== userId) ||
        !request.query.userId
      ) {
        await fastify.auth.authorize(userId, 1);
      }

      const accomplishments = await getManyAccomplishment(
        fastify,
        userId,
        request.query.challengeId,
        request.query.status,
        request.query.limit,
        request.query.offset
      );

      return reply.status(200).send({ message: "Success", accomplishments });
    }
  );

  fastify.get<{
    Params: { id: number };
    Reply: { accomplishment: Accomplishment; message: string };
  }>(
    "/:id",
    {
      schema: {
        tags: ["accomplishment"],
        description: "Fetch info on a specific user's accomplishment",
        params: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "Id of the accomplishment to fetch",
            },
          },
          required: ["id"],
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const accomplishment = await getAccomplishment(
        fastify,
        request.params.id
      );

      if (accomplishment.userId != userId) {
        await fastify.auth.authorize(userId, 1);
      }

      return reply.status(200).send({ message: "Success", accomplishment });
    }
  );

  fastify.put<{
    Body: {
      comment?: { value: string };
      challengeId: { value: number };
    };
    Reply: { message: string; accomplishmentId: number };
  }>(
    "/",
    {
      schema: {
        tags: ["accomplishment"],
        body: {
          type: "object",
          required: ["challengeId"],
          properties: {
            comment: {
              type: "string",
              description: "Optional comment in addition to the proof",
            },
            challengeId: {
              type: "number",
              description: "Id of the challenge",
            },
          },
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const createdAccomplishment = await createAccomplishment(
        fastify,
        userId,
        request.body.challengeId.value,
        request.body.comment?.value
      );

      return reply
        .status(201)
        .send({
          message: "Accomplishment created",
          accomplishmentId: createdAccomplishment.id,
        });
    }
  );
  fastify.patch<{
    Params: { id: number };
    Body: {
      comment?: { value: string };
      status?: { value: "ACCEPTED" | "REFUSED" };
    };
    Reply: { message: string; accomplishmentId: number };
  }>(
    "/:id",
    {
      schema: {
        tags: ["accomplishment"],
        description: "Update info related to a specific user's accomplishment",
        params: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "Id of the accomplishment to update",
            },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            comment: {
              type: "string",
              description: "Optional comment in addition to the proof",
            },
            status: {
              type: "string",
              enum: ["ACCEPTED", "REFUSED"],
              description: "Validation status to apply to the accomplishment",
            },
          },
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const accomplishment = await getAccomplishment(
        fastify,
        request.params.id
      );

      //Need super admin to modify other's accomplishments info
      if (request.body.comment && accomplishment.userId !== userId) {
        await fastify.auth.authorize(userId, 2);
      }

      //Need a classic admin to validate other's accomplishment
      if (request.body.status) {
        await fastify.auth.authorize(userId, 1);
      }

      const updatedAccomplishment = await updateAccomplishment(
        fastify,
        accomplishment,
        request.body.comment?.value,
        request.body.status?.value
      );

      return reply
        .status(201)
        .send({
          message: "Accomplishment updated",
          accomplishmentId: updatedAccomplishment.id,
        });
    }
  );

  fastify.delete<{
    Params: { id: number };
    Reply: { message: string; accomplishmentId: number };
  }>(
    "/:id",
    {
      schema: {
        tags: ["accomplishment"],
        description: "Delete a specific user's accomplishment",
        params: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "Id of the accomplishment to delete",
            },
          },
          required: ["id"],
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const accomplishment = await getAccomplishment(
        fastify,
        request.params.id
      );

      //Need super admin to delete other's accomplishments
      if (accomplishment.userId !== userId) {
        await fastify.auth.authorize(userId, 2);
      }

      const deletedAccomplishment = await deleteAccomplishment(
        fastify,
        accomplishment
      );

      return reply
        .status(200)
        .send({
          message: "Accomplishment deleted",
          accomplishmentId: deletedAccomplishment.id,
        });
    }
  );

  fastify.put<{
    Querystring: { accomplishmentId: number };
    Reply: { message: string };
  }>(
    "/proof",
    {
      schema: {
        tags: ["accomplishment"],
        description: "Upload a proof for the designated accomplishment",
        consumes: ["multipart/form-data"],
        querystring: {
          type: "object",
          properties: {
            accomplishmentId: {
              type: "number",
              description: "Id of the accomplishment",
            },
          },
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const accomplishment = await getAccomplishment(
        fastify,
        request.query.accomplishmentId
      );

      if (accomplishment.userId !== userId) {
        await fastify.auth.authorize(userId, 2);
      }

      await updateProof(fastify, (await request.file()).file, accomplishment);

      reply.status(200).send({ message: "Success" });
    }
  );

  fastify.get<{
    Querystring: { accomplishmentId: number };
    Reply: internal.Readable;
  }>(
    "/proof",
    {
      schema: {
        tags: ["accomplishment"],
        description: "Get the proof of the designated accomplishment",
        produces: ["application/octet-stream"],
        querystring: {
          type: "object",
          properties: {
            accomplishmentId: {
              type: "number",
              description: "Id of the accomplishment",
            },
          },
        },
      },
    },
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const accomplishment = await getAccomplishment(
        fastify,
        request.query.accomplishmentId
      );

      const proof = await getProof(fastify, accomplishment);

      reply.status(200).send(proof);
    }
  );

  fastify.delete<{
    Querystring: { accomplishmentId: number };
    Reply: { message: string };
  }>(
    "/proof",
    {
      schema: {
        tags: ["accomplishment"],
        description: "Delete the proof of the designated accomplishment",
        querystring: {
          type: "object",
          properties: {
            accomplishmentId: {
              type: "number",
              description: "Id of the accomplishment",
            },
          },
        },
      },
    },
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const accomplishment = await getAccomplishment(
        fastify,
        request.query.accomplishmentId
      );

      await deleteProof(fastify, accomplishment);

      reply.status(200).send({ message: "Success" });
    }
  );
};

export default accomplishmentRoute;
