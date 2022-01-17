import { Challenges } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import ChallengeInfo from "../../models/ChallengeInfo";
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
  fastify.get<{ Reply: Challenges[] }>("/", async function (request, reply) {
    await fastify.auth.authenticate(request.headers);

    const challenges = await getChallenges(fastify);

    return reply.status(200).send(challenges);
  });
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
  fastify.put<{ Body: ChallengeInfo; Reply: string }>(
    "/",
    async function (request, reply) {
      const challengeInfo = request.body;

      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 1);

      await createChallenge(fastify, challengeInfo);

      return reply.status(201).send("Challenge created");
    }
  );
  fastify.patch<{ Body: ChallengeInfo; Params: { id: string }; Reply: string }>(
    "/:id",
    async function (request, reply) {
      const challengeInfo = request.body;

      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 1);

      await updateChallenge(
        fastify,
        parseInt(request.params.id),
        challengeInfo
      );

      return reply.status(201).send("Challenge updated");
    }
  );
  fastify.delete<{ Params: { id: string }; Reply: string }>(
    "/:id",
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 1);

      await deleteChallenge(fastify, parseInt(request.params.id));
    }
  );
};

export default challengeRoute;
