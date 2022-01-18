import { Challenges } from "@prisma/client";
import { FastifyInstance } from "fastify";
import {
  ChallengeInfo,
  ChallengeInfoMinimal,
} from "../../models/ChallengeInfo";

export async function createChallenge(
  fastify: FastifyInstance,
  challengeInfo: ChallengeInfo
) {
  if (challengeInfo.reward && challengeInfo.reward < 0) {
    throw fastify.httpErrors.badRequest("Reward must pe positive");
  }

  await fastify.prisma.challenge.createChallenge(challengeInfo);
}

export async function updateChallenge(
  fastify: FastifyInstance,
  challengeId: number,
  challengeInfo: ChallengeInfo
) {
  if (challengeInfo.reward && challengeInfo.reward < 0) {
    throw fastify.httpErrors.badRequest("Reward must pe positive");
  }

  await fastify.prisma.challenge.updateChallenge(challengeInfo, challengeId);
}

export async function deleteChallenge(
  fastify: FastifyInstance,
  challengeId: number
) {
  await fastify.prisma.challenge.deleteChallenge(challengeId);
}

export async function getChallenge(
  fastify: FastifyInstance,
  challengeId: number
) {
  const challenge = await fastify.prisma.challenge.getChallenge(challengeId);

  //Check if challenge not found
  if (!challenge) {
    throw fastify.httpErrors.notFound("Challenge not found");
  }

  return convertTime(challenge);
}

export async function getChallenges(fastify: FastifyInstance) {
  const challenges = await fastify.prisma.challenge.getChallenges();

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
function convertTime(challenge: Challenges) {
  challenge.createdAt.setMinutes(
    challenge.createdAt.getMinutes() - challenge.createdAt.getTimezoneOffset()
  );
  return challenge;
}
