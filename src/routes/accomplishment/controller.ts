import { Accomplishment } from "@prisma/client";
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
export async function getUserAccomplishment(
  fastify: FastifyInstance,
  userId: number
) {
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  const accomplishments =
    await fastify.prisma.accomplishment.getManyAccomplishment(userId);

  //Check for empty result
  if (!accomplishments || !accomplishments.length) {
    throw fastify.httpErrors.notFound("No Accomplishment found");
  }

  return accomplishments;
}

export async function getAllAccomplishment(fastify: FastifyInstance) {
  const accomplishments =
    await fastify.prisma.accomplishment.getManyAccomplishment();

  if (!accomplishments || !accomplishments.length) {
    throw fastify.httpErrors.notFound("No Accomplishment found");
  }

  return accomplishments;
}

//Get pending accomplishments, return all pending accomplishments, admin only
export async function getPendingAccomplishment(fastify: FastifyInstance) {
  const accomplishments =
    await fastify.prisma.accomplishment.getManyAccomplishment(undefined, null);

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

/*Update the provided accomplishment, the reason why we need to fetch the accomplishment before updating
  is beacause we need to check if the accomplishment has a validation state. We do not allow admin to modify validated accomplishments*/
export async function updateAccomplishment(
  fastify: FastifyInstance,
  accomplishmentInfo: AccomplishmentInfo,
  accomplishment: Accomplishment
) {
  //Check for accomplishmendId
  if (!accomplishment.id) {
    throw fastify.httpErrors.badRequest("Invalid accomplishment id");
  }

  //Check if accomplishment has a validation state
  if (accomplishment.validation) {
    throw fastify.httpErrors.badRequest(
      "Can't modify a validated accomplishment"
    );
  }

  await fastify.prisma.accomplishment.updateAccomplishment(
    accomplishment.id,
    accomplishmentInfo
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
  if (accomplishment.validation) {
    throw fastify.httpErrors.badRequest(
      "Can't modify a validated accomplishment"
    );
  }

  await fastify.prisma.accomplishment.deleteAccomplishment(accomplishment.id);
}

//Validate accomplishment
export async function validateAccomplishment(
  fastify: FastifyInstance,
  validation: 1 | -1,
  accomplishmentId: number
) {
  //check for accomplishmentId
  if (!accomplishmentId) {
    throw fastify.httpErrors.badRequest("Invalid accomplishment id");
  }

  //Check if it has a validation state
  if (!(validation === 1 || validation === -1)) {
    throw fastify.httpErrors.badRequest("Invalid validation state");
  }

  await fastify.prisma.accomplishment.updateAccomplishment(
    accomplishmentId,
    undefined,
    validation
  );
}
