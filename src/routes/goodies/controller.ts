import { FastifyInstance } from "fastify";
import { GoodiesInfo, GoodiesInfoMinimal } from "../../models/GoodiesInfo";

//Get Goodies by id
export async function getGoodies(fastify: FastifyInstance, goodiesId: number) {
  //Check goodies id
  if (!goodiesId) {
    throw fastify.httpErrors.badRequest("Invalid goodies id");
  }

  const goodies = await fastify.prisma.goodies.getGoodies(goodiesId);

  //Check if goodies empty
  if (!goodies) {
    throw fastify.httpErrors.notFound("Goodies not found");
  }

  return goodies;
}

//Get all goodies in DB
export async function getManyGoodies(fastify: FastifyInstance) {
  const goodies = await fastify.prisma.goodies.getManyGoodies();

  //Check goodies id
  if (!goodies || !goodies.length) {
    throw fastify.httpErrors.notFound("No Goodies in DB");
  }

  return goodies.map<GoodiesInfoMinimal>((val) => {
    return {
      name: val.name,
      price: val.price,
      image: val.image,
      id: val.id
    };
  });
}

//Create goodies with provided info
export async function createGoodies(
  fastify: FastifyInstance,
  goodiesInfo: GoodiesInfo,
  creatorId: number
) {
  //Check goodies info
  if (!goodiesInfo) {
    throw fastify.httpErrors.badRequest("No goodies info provided");
  }

  //Check if price is positive
  if (goodiesInfo && goodiesInfo.price && goodiesInfo.price < 0) {
    throw fastify.httpErrors.badRequest("Price must be positive");
  }

  //Check creator id
  if (!creatorId) {
    throw fastify.httpErrors.badRequest("Invalid creator id");
  }

  await fastify.prisma.goodies.createGoodies(goodiesInfo, creatorId);
}

//Update goodies with provided info by id
export async function updateGoodies(
  fastify: FastifyInstance,
  goodiesInfo: GoodiesInfo,
  goodiesId: number
) {
  //Check infos
  if (!goodiesInfo) {
    throw fastify.httpErrors.badRequest("No goodies info provided");
  }

  //Check if price is positive
  if (goodiesInfo.price && goodiesInfo.price < 0) {
    throw fastify.httpErrors.badRequest("Price must be positive");
  }

  //Check goodies id
  if (!goodiesId) {
    throw fastify.httpErrors.badRequest("Invalid goodies id");
  }

  await fastify.prisma.goodies.updateGoodies(goodiesInfo, goodiesId);
}

//Delete goodies by id
export async function deleteGoodies(
  fastify: FastifyInstance,
  goodiesId: number
) {
  //Check goodies id
  if (!goodiesId) {
    throw fastify.httpErrors.badRequest("Invalid goodies id");
  }

  await fastify.prisma.goodies.deleteGoodies(goodiesId);
}
