//Import Prisma ORM types
import { Accomplishment, Validation } from "@prisma/client";

import { FastifyPluginAsync } from "fastify";
import { MultipartFile } from "fastify-multipart";

//Import controller functions
import {
  createAccomplishment,
  deleteAccomplishment,
  getAccomplishment,
  getManyAccomplishment,
  updateAccomplishment,
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

      //Only admins can fetch other's accomplishments or all accomplishmants
      if (request.query.userId) {
        if (request.query.userId !== userId) {
          await fastify.auth.authorize(userId, 1);
        }
      } else {
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
    Reply: { message: string; accomplishment: Accomplishment };
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

      //Classic users can't fetch other's accomplishments
      if (accomplishment.userId !== userId) {
        await fastify.auth.authorize(userId, 1);
      }

      return reply.status(200).send({ message: "Success", accomplishment });
    }
  );

  fastify.put<{
    Body: {
      comment?: { value: string };
      challengeId: { value: number };
      proof: MultipartFile
    };
    Reply: { message: string };
  }>(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["challengeId", "proof"],
          properties: {
            proof: { $ref: "multipartSharedSchema" },
            comment: {
              properties: {
                value: {
                  type: "string",
                  description: "Optional comment in addition to the proof",
                },
              },
            },
            challengeId: {
              properties: {
                value: {
                  type: "number",
                  description: "Id of the challenge",
                },
              },
            },
          },
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const file = await request.body.proof.toBuffer();

      console.log(file);

      await createAccomplishment(
        fastify,
        userId,
        request.body.challengeId.value,
        file,
        request.body.comment?.value
      );

      return reply.status(201).send({ message: "Accomplishment created" });
    }
  );
  fastify.patch<{
    Params: { id: number };
    Body: { comment?: string; status?: "ACCEPTED" | "REFUSED" };
    Reply: { message: string };
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

      await updateAccomplishment(
        fastify,
        accomplishment,
        request.body.comment,
        request.body.status
      );

      return reply.status(201).send({ message: "Accomplishment updated" });
    }
  );

  fastify.delete<{ Params: { id: number }; Reply: { message: string } }>(
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

      await deleteAccomplishment(fastify, accomplishment);

      return reply.status(200).send({ message: "Accomplishment deleted" });
    }
  );
};

export default accomplishmentRoute;
