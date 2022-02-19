//Import Prisma ORM Types
import { Challenge } from "@prisma/client";

import { FastifyPluginAsync } from "fastify";

//Impor Models
import {
  ChallengeInfo,
  ChallengeInfoMinimal,
  ChallengeSchema,
} from "../../models/ChallengeInfo";

//Import controller functions
import {
  createChallenge,
  deleteChallenge,
  getChallenge,
  getManyChallenge,
  updateChallenge,
} from "./controller";

const challengeRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{
    Querystring: { limit?: number; offset?: number };
    Reply: { message: string; challenges: ChallengeInfoMinimal[] };
  }>(
    "/",
    {
      schema: {
        tags: ["challenge"],
        description: "Fetch Minimal info on all Challenge",
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

      const challenges = await getManyChallenge(
        fastify,
        request.query.limit,
        request.query.offset
      );

      return reply.status(200).send({ message: "Success", challenges });
    }
  );
  fastify.get<{
    Params: { id: number };
    Reply: { message: string; challenge: Challenge };
  }>(
    "/:id",
    {
      schema: {
        tags: ["challenge"],
        description: "Fetch info on a specific challenge",
        params: {
          type: "object",
          description: "Id of the challenge to fetch",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
      },
    },
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const challenge = await getChallenge(fastify, request.params.id);

      return reply.status(200).send({ message: "Success", challenge });
    }
  );
  fastify.put<{
    Body: ChallengeInfo;
    Reply: { message: string };
  }>(
    "/",
    {
      schema: {
        tags: ["challenge", "admin"],
        description: "Create a challenge with the provided info",
        body: ChallengeSchema,
      },
    },
    async function (request, reply) {
      const challengeInfo = request.body;

      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 1);

      await createChallenge(fastify, challengeInfo, userId);

      return reply.status(201).send({ message: "Challenge created" });
    }
  );
  fastify.patch<{
    Body: ChallengeInfo;
    Params: { id: number };
    Reply: { message: string };
  }>(
    "/:id",
    {
      schema: {
        tags: ["challenge", "admin"],
        description: "Update a challenge with the provided info",
        params: {
          type: "object",
          description: "Id of the challenge to update",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
        body: ChallengeSchema,
      },
    },
    async function (request, reply) {
      const challengeInfo = request.body;

      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 1);

      await updateChallenge(fastify, request.params.id, challengeInfo);

      return reply.status(200).send({ message: "Challenge updated" });
    }
  );
  fastify.delete<{ Params: { id: number }; Reply: { message: string } }>(
    "/:id",
    {
      schema: {
        tags: ["challenge", "admin"],
        description: "Delete a specific challenge",
        params: {
          type: "object",
          description: "Id of the challenge to delete",
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

      await deleteChallenge(fastify, request.params.id);

      return reply.status(200).send({ message: "Challenge deleted" });
    }
  );
};

export default challengeRoute;
