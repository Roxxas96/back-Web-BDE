import { FastifyInstance } from "fastify";

export async function getUserAccomplishment(
  fastify: FastifyInstance,
  userId: number
) {
  const accomplishments =
    await fastify.prisma.accomplishment.getManyAccomplishment(userId);

  if (!accomplishments || !accomplishments.length) {
    throw fastify.httpErrors.notFound("No Accomplishment found");
  }

  return accomplishments;
}
