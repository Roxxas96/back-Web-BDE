import { FastifyInstance } from "fastify";
import internal = require("stream");
import { GoodiesInfo } from "../../models/GoodiesInfo";
import { UserInfoMinimal } from "../../models/UserInfo";
import { generateRandomKey } from "../../utils/crypto";

//Get Goodies by id
export async function getGoodies(fastify: FastifyInstance, goodiesId: number) {
  //Check goodies id
  if (!goodiesId) {
    throw fastify.httpErrors.badRequest("Invalid goodies id");
  }

  const goodies = await fastify.prisma.goodies.getGoodies(goodiesId);

  const creator = goodies.creatorId
    ? await fastify.prisma.user.getUser(goodies.creatorId)
    : undefined;

  return {
    ...goodies,
    creator: creator
      ? ({ id: creator.id, pseudo: creator.pseudo } as UserInfoMinimal)
      : undefined,
    creatorId: creator ? undefined : goodies.creatorId,
  };
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

  return await Promise.all(
    goodies.map(async (goodies) => {
      const creator = goodies.creatorId
        ? await fastify.prisma.user.getUser(goodies.creatorId)
        : undefined;

      return {
        ...goodies,
        creator: creator
          ? ({ id: creator.id, pseudo: creator.pseudo } as UserInfoMinimal)
          : undefined,
        creatorId: creator ? undefined : goodies.creatorId,
      };
    })
  );
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
  goodiesId: number,
  goodiesGoodiesPictureId: string
) {
  if (!goodiesId) {
    throw fastify.httpErrors.badRequest("Invalid goodies");
  }

  if (!goodiesPicture) {
    throw fastify.httpErrors.badRequest("Invalid goodiesPicture");
  }

  const goodiesPictureId =
    goodiesGoodiesPictureId !== ""
      ? goodiesGoodiesPictureId
      : await generateRandomKey(48);

  if (goodiesPictureId !== goodiesGoodiesPictureId) {
    await fastify.prisma.goodies.updateGoodies(
      { imageId: goodiesPictureId },
      goodiesId
    );
  }

  await fastify.minio.goodiesPicture.putGoodiesPicture(
    goodiesPicture,
    goodiesPictureId
  );

  return goodiesPictureId;
}

export async function getGoodiesPicture(
  fastify: FastifyInstance,
  goodiesPictureId: string
) {
  if (!goodiesPictureId) {
    throw fastify.httpErrors.badRequest("Invalid goodies");
  }

  return await fastify.minio.goodiesPicture.getGoodiesPicture(goodiesPictureId);
}

export async function deleteGoodiesPicture(
  fastify: FastifyInstance,
  goodiesId: number
) {
  if (!goodiesId) {
    throw fastify.httpErrors.badRequest("Invalid goodies");
  }

  const goodies = await fastify.prisma.goodies.getGoodies(goodiesId);

  await fastify.minio.goodiesPicture.getGoodiesPicture(goodies.imageId);

  return await fastify.minio.goodiesPicture.deleteGoodiesPicture(
    goodies.imageId
  );
}
