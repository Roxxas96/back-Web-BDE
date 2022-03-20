//Import Prisma ORM Types
import { FastifyPluginAsync } from "fastify";

//Impor Models
import { ChallengeInfo, ChallengeSchema } from "../../models/ChallengeInfo";

//Import controller functions
import {
  createChallenge,
  deleteChallenge,
  deleteChallengePicture,
  getChallenge,
  getChallengeCount,
  getChallengePicture,
  getManyChallenge,
  updateChallenge,
  updateChallengePicture,
} from "./controller";
import internal = require("stream");

const challengeRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{
    Querystring: { limit?: number; offset?: number };
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
  }>(
    "/:id",
    {
      schema: {
        tags: ["challenge"],
        description: "Fetch info on a specific challenge",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "number", description: "Id of the challenge to fetch" },
          },
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
    Reply: { message: string; challengeId: number };
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

      const createdChallenge = await createChallenge(
        fastify,
        challengeInfo,
        userId
      );

      return reply.status(201).send({
        message: "Challenge created",
        challengeId: createdChallenge.id,
      });
    }
  );
  fastify.patch<{
    Body: ChallengeInfo;
    Params: { id: number };
    Reply: { message: string; challengeId: number };
  }>(
    "/:id",
    {
      schema: {
        tags: ["challenge", "admin"],
        description: "Update a challenge with the provided info",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "number",
              description: "Id of the challenge to update",
            },
          },
        },
        body: ChallengeSchema,
      },
    },
    async function (request, reply) {
      const challengeInfo = request.body;

      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 1);

      const updatedChallenge = await updateChallenge(
        fastify,
        request.params.id,
        challengeInfo
      );

      return reply.status(200).send({
        message: "Challenge updated",
        challengeId: updatedChallenge.id,
      });
    }
  );
  fastify.delete<{
    Params: { id: number };
    Reply: { message: string; challengeId: number };
  }>(
    "/:id",
    {
      schema: {
        tags: ["challenge", "admin"],
        description: "Delete a specific challenge",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "number",
              description: "Id of the challenge to delete",
            },
          },
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 1);

      const deletedChallenge = await deleteChallenge(
        fastify,
        request.params.id
      );

      return reply.status(200).send({
        message: "Challenge deleted",
        challengeId: deletedChallenge.id,
      });
    }
  );

  fastify.put<{
    Querystring: { challengeId: number };
    Reply: { message: string, challengePictureId: string };
  }>(
    "/picture",
    {
      schema: {
        tags: ["challenge"],
        description: "Upload a challenge picture for the designated challenge",
        consumes: ["multipart/form-data"],
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

      const challenge = await getChallenge(fastify, request.query.challengeId);

      if (challenge.creatorId !== userId && challenge.creator?.id !== userId) {
        await fastify.auth.authorize(userId, 2);
      }

      const challengePictureId = await updateChallengePicture(
        fastify,
        (
          await request.file()
        ).file,
        challenge.id,
        challenge.imageId
      );

      reply.status(200).send({ message: "Success", challengePictureId: challengePictureId });
    }
  );

  fastify.get<{
    Params: { id: string };
    Reply: internal.Readable;
  }>(
    "/picture/:id",
    {
      schema: {
        tags: ["challenge"],
        description: "Get the challenge picture of the designated challenge",
        produces: ["application/octet-stream"],
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Id of the challengePicture to fetch",
            },
          },
        },
      },
    },
    async function (request, reply) {
      const challengePicture = await getChallengePicture(
        fastify,
        request.params.id
      );

      reply.status(200).send(challengePicture);
    }
  );

  fastify.delete<{
    Querystring: { challengeId: number };
    Reply: { message: string };
  }>(
    "/picture",
    {
      schema: {
        tags: ["challenge"],
        description: "Delete the challenge picture of the designated challenge",
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

      const challenge = await getChallenge(fastify, request.query.challengeId);

      if (challenge.creatorId !== userId && challenge.creator?.id !== userId) {
        await fastify.auth.authorize(userId, 2);
      }

      await deleteChallengePicture(fastify, challenge.id);

      reply.status(200).send({ message: "Success" });
    }
  );

  fastify.get(
    "/count",
    {
      schema: {
        tags: ["challenge"],
        description: "Get the number of challenges",
      },
    },
    async function (request, reply) {
      const challengesCount = await getChallengeCount(fastify);
      return reply.status(200).send({ message: "Success", count: challengesCount });
    }
  );
};

export default challengeRoute;
