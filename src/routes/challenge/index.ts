import { Challenges } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { ChallengeInfoMinimal } from "../../models/ChallengeInfo";
import {
  createChallenge,
  deleteChallenge,
  getChallenge,
  getChallenges,
  updateChallenge,
} from "./controller";

const challengeRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{ Reply: ChallengeInfoMinimal[] }>(
    "/",
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const challenges = await getChallenges(fastify);

      return reply.status(200).send(challenges);
    }
  );
  fastify.get<{ Params: { id: string }; Reply: Challenges }>(
    "/:id",
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const challenge = await getChallenge(
        fastify,
        parseInt(request.params.id)
      );

      return reply.status(200).send(challenge);
    }
  );
  fastify.put<{
    Body: {
      name?: string;
      description?: string;
      reward?: number;
    };
    Reply: string;
  }>("/", async function (request, reply) {
    const challengeInfo = request.body;

    const userId = await fastify.auth.authenticate(request.headers);

    await fastify.auth.authorize(userId, 1);

    await createChallenge(fastify, { ...challengeInfo, creatorId: userId });

    return reply.status(201).send("Challenge created");
  });
  fastify.patch<{
    Body: {
      name?: string;
      description?: string;
      reward?: number;
    };
    Params: { id: string };
    Reply: string;
  }>("/:id", async function (request, reply) {
    console.log(typeof request.body.reward);

    const challengeInfo = request.body;

    const userId = await fastify.auth.authenticate(request.headers);

    await fastify.auth.authorize(userId, 1);

    await updateChallenge(fastify, parseInt(request.params.id), {
      ...challengeInfo,
      creatorId: userId,
    });

    return reply.status(200).send("Challenge updated");
  });
  fastify.delete<{ Params: { id: string }; Reply: string }>(
    "/:id",
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 1);

      await deleteChallenge(fastify, parseInt(request.params.id));

      return reply.status(200).send("Challenge deleted");
    }
  );
};

export default challengeRoute;
