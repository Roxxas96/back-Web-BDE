//Import Prisma ORM types
import { Accomplishment } from "@prisma/client";

import { FastifyPluginAsync } from "fastify";

//Import Models
import {
  AccomplishmentInfo,
  AccomplishmentSchema,
} from "../../models/AccomplishmentInfo";

//Import controller functions
import {
  createAccomplishment,
  deleteAccomplishment,
  getAccomplishment,
  getUserAccomplishment as getUserAccomplishment,
  getPendingAccomplishment,
  updateAccomplishment,
  validateAccomplishment,
  getAllAccomplishment,
} from "./controller";

const accomplishmentRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{
    Params: { limit?: number; offset?: number };
    Reply: { message: string; accomplishments: Accomplishment[] };
  }>(
    "/",
    {
      schema: {
        tags: ["accomplishment"],
        description: "Fetch info on user's accomplishments",
        params: {
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
          required: [],
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const accomplishments = await getUserAccomplishment(
        fastify,
        userId,
        request.params.limit,
        request.params.offset
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

  fastify.get<{
    Params: { limit?: number; offset?: number };
    Reply: { message: string; accomplishments: Accomplishment[] };
  }>(
    "/pending",
    {
      schema: {
        tags: ["accomplishment", "admin"],
        description: "Fetch all pending accomplishments",
        params: {
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
          required: [],
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 1);

      const accomplishments = await getPendingAccomplishment(
        fastify,
        request.params.limit,
        request.params.offset
      );

      return reply.status(200).send({ message: "Success", accomplishments });
    }
  );

  fastify.get<{
    Params: { limit?: number; offset?: number };
    Reply: { message: string; accomplishments: Accomplishment[] };
  }>(
    "/all",
    {
      schema: {
        tags: ["accomplishment", "super admin"],
        description: "Fetch all existing acomplishments",
        params: {
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
          required: [],
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 2);

      const accomplishments = await getAllAccomplishment(
        fastify,
        request.params.limit,
        request.params.offset
      );

      return reply.status(200).send({ message: "Success", accomplishments });
    }
  );

  fastify.put<{
    Body: { info: AccomplishmentInfo; challengeId: number };
    Reply: { message: string };
  }>(
    "/",
    {
      schema: {
        tags: ["accomplishment"],
        description: "Create an accomplishment with the provided info",
        body: {
          type: "object",
          properties: {
            info: AccomplishmentSchema,
            challengeId: {
              type: "number",
              description: "Id of the challenge related to the accomplishment",
            },
          },
          required: ["info", "challengeId"],
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const accomplishmentInfo = request.body.info;

      await createAccomplishment(
        fastify,
        accomplishmentInfo,
        userId,
        request.body.challengeId
      );

      return reply.status(201).send({ message: "Accomplishment created" });
    }
  );
  fastify.patch<{
    Params: { id: number };
    Body: AccomplishmentInfo;
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
        body: AccomplishmentSchema,
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const accomplishmentInfo = request.body;

      const accomplishment = await getAccomplishment(
        fastify,
        request.params.id
      );

      //Need super admin to modify other's accomplishments
      if (accomplishment.userId !== userId) {
        await fastify.auth.authorize(userId, 2);
      }

      await updateAccomplishment(fastify, accomplishmentInfo, accomplishment);

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

  fastify.patch<{
    Params: { id: number };
    Body: { state: 1 | -1 };
    Reply: { message: string };
  }>(
    "/validate/:id",
    {
      schema: {
        tags: ["accomplishment", "admin"],
        description: "Validate a specific accomplishment",
        params: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "Id of the accomplishment to validate",
            },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          description: "Validation state, it can be Refused: -1 or Accepted: 1",
          properties: {
            state: { enum: [1, -1] },
          },
          required: ["state"],
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 1);

      await validateAccomplishment(
        fastify,
        request.body.state,
        request.params.id
      );

      return reply
        .status(201)
        .send({ message: "Accomplishment validation changed" });
    }
  );
};

export default accomplishmentRoute;
