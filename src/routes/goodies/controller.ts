import { Goodies } from "@prisma/client";
import { FastifyInstance } from "fastify";
import internal = require("stream");
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
export async function getManyGoodies(
  fastify: FastifyInstance,
  limit?: number,
  offset?: number
) {
  const goodies = await fastify.prisma.goodies.getManyGoodies(
    limit || 20,
    offset
  );

  //Check goodies id
  if (!goodies || !goodies.length) {
    throw fastify.httpErrors.notFound("No Goodies in DB");
  }

  return goodies.map<GoodiesInfoMinimal>((val) => {
    return {
      name: val.name,
      price: val.price,
      id: val.id,
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

  const creator = await fastify.prisma.user.getUser(creatorId);

  if (!creator) {
    throw fastify.httpErrors.badRequest("Creator not found");
  }

  return await fastify.prisma.goodies.createGoodies(goodiesInfo, creator.id);
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

  const goodies = await fastify.prisma.goodies.getGoodies(goodiesId);

  if (!goodies) {
    throw fastify.httpErrors.notFound("Goodies nor found");
  }

  return await fastify.prisma.goodies.updateGoodies(goodiesInfo, goodies.id);
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

  const goodies = await fastify.prisma.goodies.getGoodies(goodiesId);

  if (!goodies) {
    throw fastify.httpErrors.notFound("Goodies not found");
  }

  return await fastify.prisma.goodies.deleteGoodies(goodies.id);
}

export async function updateGoodiesPicture(
  fastify: FastifyInstance,
  goodiesPicture: internal.Readable,
  goodies: Goodies
) {
  if (!goodies || !goodies.id) {
    throw fastify.httpErrors.badRequest("Invalid goodies");
  }

  if (!goodiesPicture) {
    throw fastify.httpErrors.badRequest("Invalid goodies picture");
  }

  return await fastify.minio.goodiesPicture.putGoodiesPicture(goodiesPicture, goodies.id);
}

export async function getGoodiesPicture(
  fastify: FastifyInstance,
  goodies: Goodies
) {
  if (!goodies || !goodies.id) {
    throw fastify.httpErrors.badRequest("Invalid goodies");
  }

  return await fastify.minio.goodiesPicture.getGoodiesPicture(goodies.id);
}

export async function deleteGoodiesPicture(
  fastify: FastifyInstance,
  goodies: Goodies
) {
  if (!goodies || !goodies.id) {
    throw fastify.httpErrors.badRequest("Invalid goodies");
  }

  await fastify.minio.goodiesPicture.getGoodiesPicture(goodies.id);

  return await fastify.minio.goodiesPicture.deleteGoodiesPicture(goodies.id);
}