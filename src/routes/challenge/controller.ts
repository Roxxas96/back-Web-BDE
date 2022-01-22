import { Challenge } from "@prisma/client";
import { FastifyInstance } from "fastify";
import {
  ChallengeInfo,
  ChallengeInfoMinimal,
} from "../../models/ChallengeInfo";

export async function createChallenge(
  fastify: FastifyInstance,
  challengeInfo: ChallengeInfo,
  creatorId: number
) {
  if (!challengeInfo) {
    throw fastify.httpErrors.badRequest("No challenge info provided");
  }

  if (challengeInfo.reward && challengeInfo.reward < 0) {
    throw fastify.httpErrors.badRequest("Reward must pe positive");
  }

  if (!creatorId) {
    throw fastify.httpErrors.badRequest("Invalid creator id");
  }

  await fastify.prisma.challenge.createChallenge(challengeInfo, creatorId);
}

export async function updateChallenge(
  fastify: FastifyInstance,
  challengeId: number,
  challengeInfo: ChallengeInfo
) {
  if (!challengeInfo) {
    throw fastify.httpErrors.badRequest("No challenge info provided");
  }

  if (challengeInfo.reward && challengeInfo.reward < 0) {
    throw fastify.httpErrors.badRequest("Reward must pe positive");
  }

  if (!challengeId) {
    throw fastify.httpErrors.badRequest("Invalid challenge id");
  }

  await fastify.prisma.challenge.updateChallenge(challengeInfo, challengeId);
}

export async function deleteChallenge(
  fastify: FastifyInstance,
  challengeId: number
) {
  if (!challengeId) {
    throw fastify.httpErrors.badRequest("Invalid challenge id");
  }

  await fastify.prisma.challenge.deleteChallenge(challengeId);
}

export async function getChallenge(
  fastify: FastifyInstance,
  challengeId: number
) {
  if (!challengeId) {
    throw fastify.httpErrors.badRequest("Invalid challenge id");
  }

  const challenge = await fastify.prisma.challenge.getChallenge(challengeId);

  //Check if challenge not found
  if (!challenge) {
    throw fastify.httpErrors.notFound("Challenge not found");
  }

  return convertTime(challenge);
}

export async function getManyChallenge(fastify: FastifyInstance) {
  const challenges = await fastify.prisma.challenge.getManyChallenge();

  //Check if challenge DB empty
  if (!challenges || !challenges.length) {
    throw fastify.httpErrors.notFound("No Challenge in DB");
  }

  //We only return name and reward, other values are not needed
  return challenges.map<ChallengeInfoMinimal>((val) => {
    return {
      name: val.name,
      reward: val.reward,
    };
  });
}

//Convert UTC time depending on user's timezone
function convertTime(challenge: Challenge) {
  challenge.createdAt.setMinutes(
    challenge.createdAt.getMinutes() - challenge.createdAt.getTimezoneOffset()
  );
  return challenge;
}
