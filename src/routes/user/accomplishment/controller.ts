import { FastifyInstance } from "fastify";
import { AccomplishmentInfo } from "../../../models/AccomplishmentInfo";

//Get user's accomplishments
export async function getUserAccomplishment(
  fastify: FastifyInstance,
  userId: number,
  limit?: number,
  offset?: number
) {
  const accomplishments =
    await fastify.prisma.accomplishment.getManyAccomplishment(
      limit || 20,
      offset,
      userId
    );

  //Check for empty result
  if (!accomplishments || !accomplishments.length) {
    throw fastify.httpErrors.notFound("No Accomplishment found");
  }

  return accomplishments;
}

//Create an accomplishment for the current user
export async function createAccomplishment(
  fastify: FastifyInstance,
  accomplishmentInfo: AccomplishmentInfo,
  userId: number,
  challengeId: number
) {
  //Check for userId
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  //Check for challengeId
  if (!challengeId) {
    throw fastify.httpErrors.badRequest("Invalid challenge id");
  }

  //Check for infos
  if (!accomplishmentInfo) {
    throw fastify.httpErrors.badRequest("No accomplishment info provided");
  }

  const ownedAccomplishments =
    await fastify.prisma.accomplishment.getManyAccomplishment(userId);

  if (
    ownedAccomplishments.filter((accomplishment) => {
      return (
        (accomplishment.validation === 1 ||
          accomplishment.validation === null) &&
        accomplishment.challengeId === challengeId
      );
    }).length
  ) {
    throw fastify.httpErrors.badRequest(
      "You already have a Pending or an Accepted accomplishment"
    );
  }

  await fastify.prisma.accomplishment.createAccomplishment(
    accomplishmentInfo,
    userId,
    challengeId
  );
}
