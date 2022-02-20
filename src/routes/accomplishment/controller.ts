import { Accomplishment, Validation } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { AccomplishmentInfo } from "../../models/AccomplishmentInfo";

//Get an accomplishment by Id
export async function getAccomplishment(
  fastify: FastifyInstance,
  accomplishmentId: number
) {
  //Check for accomplishmentId
  if (!accomplishmentId) {
    throw fastify.httpErrors.badRequest("Invalid accomplishment id");
  }

  const accomplishment = await fastify.prisma.accomplishment.getAccomplishment(
    accomplishmentId
  );

  //Check for empty result
  if (!accomplishment) {
    throw fastify.httpErrors.notFound("Accomplishment not found");
  }

  return accomplishment;
}

//Get accomplishments, if admin (ie. no userId provided) return all accomplishments in DB, if basic user (ie. userId provided) only return the related ones
export async function getManyAccomplishment(
  fastify: FastifyInstance,
  userId?: number,
  challengeId?: number,
  validation?: Validation,
  limit?: number,
  offset?: number
) {
  const accomplishments =
    await fastify.prisma.accomplishment.getManyAccomplishment(
      limit || 20,
      offset,
      userId,
      validation,
      challengeId
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

  const challenge = await fastify.prisma.challenge.getChallenge(challengeId);

  if (!challenge) {
    throw fastify.httpErrors.badRequest("Referenced challenge not found");
  }

  const user = await fastify.prisma.user.getUser(userId);

  if (!user) {
    throw fastify.httpErrors.badRequest("Referenced user not found");
  }

  const ownedAccomplishments =
    await fastify.prisma.accomplishment.getManyAccomplishment(
      undefined,
      undefined,
      user.id,
      undefined,
      challenge.id
    );

  if (
    ownedAccomplishments.filter((accomplishment) => {
      return accomplishment.validation !== "REFUSED";
    }).length
  ) {
    throw fastify.httpErrors.badRequest(
      "You already have a Pending or an Accepted accomplishment"
    );
  }

  if (
    ownedAccomplishments.filter((accomplishment) => {
      return accomplishment.validation === "REFUSED";
    }).length >= challenge.maxAtempts
  ) {
    throw fastify.httpErrors.badRequest(
      "You have failed to many times to accomplish this challenge"
    );
  }

  await fastify.prisma.accomplishment.createAccomplishment(
    accomplishmentInfo,
    user.id,
    challenge.id
  );
}

/*Update the provided accomplishment, the reason why we need to fetch the accomplishment before updating
  is beacause we need to check if the accomplishment has a validation state. We do not allow admin to modify validated accomplishments*/
export async function updateAccomplishment(
  fastify: FastifyInstance,
  accomplishment: Accomplishment,
  accomplishmentInfo?: AccomplishmentInfo,
  validation?: Validation
) {
  //Check for accomplishmendId
  if (!accomplishment.id) {
    throw fastify.httpErrors.badRequest("Invalid accomplishment id");
  }

  if (validation && accomplishmentInfo) {
    throw fastify.httpErrors.badRequest(
      "Can't modify both info and validation state at the same time"
    );
  }

  //Check if accomplishment has a validation state
  if (accomplishment.validation !== "PENDING") {
    throw fastify.httpErrors.badRequest(
      "Can't modify a validated accomplishment"
    );
  }

  //For validation update we need to check for wallet update
  //If accomplishment is referencing existing user & challenge then increase user wallet by reward
  if (validation && accomplishment.userId && accomplishment.challengeId) {
    const user = await fastify.prisma.user.getUser(accomplishment.userId);
    const challenge = await fastify.prisma.challenge.getChallenge(
      accomplishment.challengeId
    );

    //Increase user wallet
    if (user && challenge) {
      await fastify.prisma.user.updateUser(user.id, {
        wallet: user.wallet + challenge.reward,
      });
    }
  }

  await fastify.prisma.accomplishment.updateAccomplishment(
    accomplishment.id,
    accomplishmentInfo,
    validation
  );
}

//Delete the provided accomplishment, if it has no validation state
export async function deleteAccomplishment(
  fastify: FastifyInstance,
  accomplishment: Accomplishment
) {
  //Chack for accomplishmentId
  if (!accomplishment.id) {
    throw fastify.httpErrors.badRequest("Invalid accomplishment id");
  }

  //Check if it has a validation state
  if (accomplishment.validation !== "PENDING") {
    throw fastify.httpErrors.badRequest(
      "Can't modify a validated accomplishment"
    );
  }

  await fastify.prisma.accomplishment.deleteAccomplishment(accomplishment.id);
}
