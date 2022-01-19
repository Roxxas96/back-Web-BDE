import { FastifyInstance } from "fastify";
import { AccomplishmentInfo } from "../../models/AccomplishmentInfo";

export async function getAccomplishment(
  fastify: FastifyInstance,
  accomplishmentId: number
) {
  const accomplishment = await fastify.prisma.accomplishment.getAccomplishment(
    accomplishmentId
  );

  if (!accomplishment) {
    throw fastify.httpErrors.notFound("Accomplishment not found");
  }

  return accomplishment;
}

export async function getAccomplishments(fastify: FastifyInstance) {
  const accomplishments =
    await fastify.prisma.accomplishment.getAccomplishments();

  if (!accomplishments || !accomplishments.length) {
    throw fastify.httpErrors.notFound("No Accomplishments in DB");
  }

  return accomplishments;
}

export async function createAccomplishment(
  fastify: FastifyInstance,
  accomplishmentInfo: AccomplishmentInfo
) {
  await fastify.prisma.accomplishment.createAccomplishment(accomplishmentInfo);
}

export async function updateAccomplishment(
  fastify: FastifyInstance,
  accomplishmentInfo: AccomplishmentInfo,
  accomplishmentId: number
) {
  await fastify.prisma.accomplishment.updateAccomplishment(
    accomplishmentInfo,
    accomplishmentId
  );
}

export async function deleteAccomplishment(
  fastify: FastifyInstance,
  accomplishmentId: number
) {
  await fastify.prisma.accomplishment.deleteAccomplishment(accomplishmentId);
}
