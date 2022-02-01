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
  fastify.get<{ Reply: ChallengeInfoMinimal[] }>(
    "/",
    {
      schema: {
        tags: ["challenge"],
        description: "Fetch Minimal info on all Challenge",
      },
    },
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const challenges = await getManyChallenge(fastify);

      return reply.status(200).send(challenges);
    }
  );
  fastify.get<{ Params: { id: number }; Reply: Challenge }>(
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

      return reply.status(200).send(challenge);
    }
  );
  fastify.put<{
    Body: ChallengeInfo;
    Reply: string;
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

      return reply.status(201).send("Challenge created");
    }
  );
  fastify.patch<{
    Body: ChallengeInfo;
    Params: { id: number };
    Reply: string;
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

      return reply.status(200).send("Challenge updated");
    }
  );
  fastify.delete<{ Params: { id: number }; Reply: string }>(
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

      return reply.status(200).send("Challenge deleted");
    }
  );
};

export default challengeRoute;
