//Import Prisma ORM types
import { Validation } from "@prisma/client";
import * as FormData from "form-data";

import { FastifyPluginAsync } from "fastify";

//Import controller functions
import {
  createAccomplishment,
  deleteAccomplishment,
  deleteProof,
  getAccomplishment,
  getManyAccomplishment,
  getManyProof,
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
        request.query.userId,
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
  }>(
    "/:id",
    {
      schema: {
        tags: ["accomplishment"],
        description: "Fetch info on a specific user's accomplishment",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "number",
              description: "Id of the accomplishment to fetch",
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

      if (
        accomplishment.userId != userId &&
        accomplishment.user?.id != userId
      ) {
        await fastify.auth.authorize(userId, 1);
      }

      return reply.status(200).send({ message: "Success", accomplishment });
    }
  );

  fastify.put<{
    Body: {
      comment?: string;
    };
    Querystring: { challengeId: number };
    Reply: { message: string; accomplishmentId: number };
  }>(
    "/",
    {
      schema: {
        tags: ["accomplishment"],
        description:
          "Create an accomplishment (mad by the user) referencing the specified challenge",
        body: {
          type: "object",
          properties: {
            comment: {
              type: "string",
              description: "Optional comment in addition to the proof",
            },
          },
        },
        querystring: {
          type: "object",
          required: ["challengeId"],
          properties: {
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
        request.query.challengeId,
        request.body.comment
      );

      return reply.status(201).send({
        message: "Accomplishment created",
        accomplishmentId: createdAccomplishment.id,
      });
    }
  );
  fastify.patch<{
    Params: { id: number };
    Body: {
      comment?: string;
      status?: "ACCEPTED" | "REFUSED";
      refusedComment?: string;
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
          required: ["id"],
          properties: {
            id: {
              type: "number",
              description: "Id of the accomplishment to update",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            comment: {
              type: "string",
              description: "Optional comment in addition to the proof",
            },
            refusedComment: {
              type: "string",
              description:
                "Optional comment for the admin when he refuses the accomplishment",
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

      const { user, challenge, ...accomplishment } = await getAccomplishment(
        fastify,
        request.params.id
      );

      //Need super admin to modify other's accomplishments info
      if (
        request.body.comment &&
        accomplishment.userId !== userId &&
        user?.id !== userId
      ) {
        await fastify.auth.authorize(userId, 2);
      }

      //Need a classic admin to validate other's accomplishment
      if (request.body.status) {
        await fastify.auth.authorize(userId, 1);
      }

      const updatedAccomplishment = await updateAccomplishment(
        fastify,
        {
          ...accomplishment,
          userId: accomplishment.userId || user?.id || null,
          challengeId: accomplishment.challengeId || null,
        },
        request.body.comment,
        request.body.status,
        request.body.refusedComment
      );

      return reply.status(201).send({
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
          required: ["id"],
          properties: {
            id: {
              type: "number",
              description: "Id of the accomplishment to delete",
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

      //Need super admin to delete other's accomplishments
      if (
        accomplishment.userId !== userId &&
        accomplishment.user?.id !== userId
      ) {
        await fastify.auth.authorize(userId, 2);
      }

      const deletedAccomplishment = await deleteAccomplishment(
        fastify,
        accomplishment.id,
        accomplishment.validation
      );

      return reply.status(200).send({
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
          required: ["accomplishmentId"],
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

      if (
        accomplishment.userId !== userId &&
        accomplishment.user?.id !== userId
      ) {
        await fastify.auth.authorize(userId, 2);
      }

      await updateProof(
        fastify,
        (
          await request.file()
        ).file,
        accomplishment.id
      );

      reply.status(200).send({ message: "Success" });
    }
  );

  fastify.get<{
    Querystring: { accomplishmentId?: number; limit?: number; offset?: number };
    Reply: FormData;
  }>(
    "/proof",
    {
      schema: {
        tags: ["accomplishment"],
        description: "Get the proof of the designated accomplishment",
        produces: ["multipart/form-data"],
        querystring: {
          type: "object",
          properties: {
            accomplishmentId: {
              type: "number",
              description: "Id of the accomplishment",
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

      if (request.query.accomplishmentId) {
        const accomplishment = await getAccomplishment(
          fastify,
          request.query.accomplishmentId
        );

        const { name, proof } = await getProof(fastify, accomplishment.id);

        const formData = new FormData();
        formData.append(name, proof);

        reply
          .status(200)
          .headers({ ...formData.getHeaders() })
          .send(formData);
      } else {
        const { proofs, allQueriesSucceded } = await getManyProof(
          fastify,
          request.query.limit,
          request.query.offset
        );

        const formData = new FormData();
        proofs.forEach((val) => formData.append(`${val.name}`, val.proof));

        reply
          .status(allQueriesSucceded ? 200 : 206)
          .headers({ ...formData.getHeaders() })
          .send(formData);
      }
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
          required: ["accomplishmentId"],
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

      if (
        accomplishment.userId !== userId &&
        accomplishment.user?.id !== userId
      ) {
        await fastify.auth.authorize(userId, 2);
      }

      await deleteProof(fastify, accomplishment.id);

      reply.status(200).send({ message: "Success" });
    }
  );
};

export default accomplishmentRoute;
