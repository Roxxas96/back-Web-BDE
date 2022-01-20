import { FastifyInstance } from "fastify";
import { GoodiesInfo, GoodiesInfoMinimal } from "../../models/GoodiesInfo";

export async function getGoodies(fastify: FastifyInstance, goodiesId: number) {
  if (!goodiesId) {
    throw fastify.httpErrors.badRequest("Invalid goodies id");
  }

  const goodies = await fastify.prisma.goodies.getGoodies(goodiesId);

  if (!goodies) {
    throw fastify.httpErrors.notFound("Goodies not found");
  }

  return goodies;
}

export async function getManyGoodies(fastify: FastifyInstance) {
  const goodies = await fastify.prisma.goodies.getManyGoodies();

  if (!goodies || !goodies.length) {
    throw fastify.httpErrors.notFound("No Goodies in DB");
  }

  return goodies.map<GoodiesInfoMinimal>((val) => {
    return {
      name: val.name,
      price: val.price,
      image: val.image,
    };
  });
}

export async function createGoodies(
  fastify: FastifyInstance,
  goodiesInfo: GoodiesInfo,
  creatorId: number
) {
  if (!goodiesInfo) {
    throw fastify.httpErrors.badRequest("No goodies info provided");
  }

  if (goodiesInfo && goodiesInfo.price && goodiesInfo.price < 0) {
    throw fastify.httpErrors.badRequest("Price must be positive");
  }

  if (!creatorId) {
    throw fastify.httpErrors.badRequest("Invalid creator id");
  }

  await fastify.prisma.goodies.createGoodies(goodiesInfo, creatorId);
}

export async function updateGoodies(
  fastify: FastifyInstance,
  goodiesInfo: GoodiesInfo,
  goodiesId: number
) {
  if (!goodiesInfo) {
    throw fastify.httpErrors.badRequest("No goodies info provided");
  }

  if (goodiesInfo.price && goodiesInfo.price < 0) {
    throw fastify.httpErrors.badRequest("Price must be positive");
  }

  if (!goodiesId) {
    throw fastify.httpErrors.badRequest("Invalid goodies id");
  }

  await fastify.prisma.goodies.updateGoodies(goodiesInfo, goodiesId);
}

export async function deleteGoodies(
  fastify: FastifyInstance,
  goodiesId: number
) {
  if (!goodiesId) {
    throw fastify.httpErrors.badRequest("Invalid goodies id");
  }

  await fastify.prisma.goodies.deleteGoodies(goodiesId);
}
