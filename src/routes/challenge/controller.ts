import { FastifyInstance } from "fastify";
import ChallengeInfo from "../../models/ChallengeInfo";

export async function createChallenge(
  fastify: FastifyInstance,
  challengeInfo: ChallengeInfo
) {
  await fastify.prisma.challenge.createChallenge(challengeInfo);
}

export async function updateChallenge(
  fastify: FastifyInstance,
  challengeId: number,
  challengeInfo: ChallengeInfo
) {
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

  return challenge;
}

export async function getChallenges(fastify: FastifyInstance) {
  const challenges = await fastify.prisma.challenge.getChallenges();

  //Check if challenge DB empty
  if (!challenges) {
    throw fastify.httpErrors.notFound("No Challenge in DB");
  }

  return challenges;
}
