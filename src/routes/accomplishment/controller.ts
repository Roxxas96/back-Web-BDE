import { Accomplishments } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { AccomplishmentInfo } from "../../models/AccomplishmentInfo";

export async function getAccomplishment(
  fastify: FastifyInstance,
  accomplishmentId: number
) {
  if (!accomplishmentId) {
    throw fastify.httpErrors.badRequest("Invalid accomplishment id");
  }

  const accomplishment = await fastify.prisma.accomplishment.getAccomplishment(
    accomplishmentId
  );

  if (!accomplishment) {
    throw fastify.httpErrors.notFound("Accomplishment not found");
  }

  return accomplishment;
}

export async function getManyAccomplishment(
  fastify: FastifyInstance,
  userId?: number
) {
  const accomplishments =
    await fastify.prisma.accomplishment.getManyAccomplishment(userId);

  if (!accomplishments || !accomplishments.length) {
    throw fastify.httpErrors.notFound("No Accomplishments found");
  }

  return accomplishments;
}

export async function createAccomplishment(
  fastify: FastifyInstance,
  accomplishmentInfo: AccomplishmentInfo,
  userId: number,
  challengeId: number
) {
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  if (!challengeId) {
    throw fastify.httpErrors.badRequest("Invalid challenge id");
  }

  if (!accomplishmentInfo) {
    throw fastify.httpErrors.badRequest("No accomplishment info provided");
  }

  await fastify.prisma.accomplishment.createAccomplishment(
    accomplishmentInfo,
    userId,
    challengeId
  );
}

export async function updateAccomplishment(
  fastify: FastifyInstance,
  accomplishmentInfo: AccomplishmentInfo,
  accomplishment: Accomplishments
) {
  if (!accomplishment.id) {
    throw fastify.httpErrors.badRequest("Invalid accomplishment id");
  }

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

export async function deleteAccomplishment(
  fastify: FastifyInstance,
  accomplishment: Accomplishments
) {
  if (!accomplishment.id) {
    throw fastify.httpErrors.badRequest("Invalid accomplishment id");
  }

  if (accomplishment.validation) {
    throw fastify.httpErrors.badRequest(
      "Can't modify a validated accomplishment"
    );
  }

  await fastify.prisma.accomplishment.deleteAccomplishment(accomplishment.id);
}

export async function validateAccomplishment(
  fastify: FastifyInstance,
  validation: 1 | -1,
  accomplishmentId: number
) {
  if (!accomplishmentId) {
    throw fastify.httpErrors.badRequest("Invalid accomplishment id");
  }

  if (!(validation === 1 || validation === -1)) {
    throw fastify.httpErrors.badRequest("Invalid validation state");
  }

  await fastify.prisma.accomplishment.updateAccomplishment(
    accomplishmentId,
    undefined,
    validation
  );
}
