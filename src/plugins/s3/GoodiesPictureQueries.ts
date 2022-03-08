import { FastifyInstance } from "fastify";
import * as Minio from "minio";
import internal = require("stream");

export function GoodiesPictureQueries(fastify: FastifyInstance, client: Minio.Client) {
  return {
    putGoodiesPicture: async function (goodiesPicture: internal.Readable, goodiesId: number) {
      try {
        return await client.putObject("goodiesPictures", `${goodiesId}`, goodiesPicture);
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError("Goodies Picture upload failed");
      }
    },
    getGoodiesPicture: async function (goodiesId: number) {
      try {
        return await client.getObject("goodiesPictures", `${goodiesId}`);
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes("The specified key does not exist")
        ) {
          throw fastify.httpErrors.notFound("Goodies Picture not found");
        }

        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError("Goodies Picture download failed");
      }
    },
    deleteGoodiesPicture: async function (goodiesId: number) {
      try {
        return await client.removeObject("goodiesPictures", `${goodiesId}`);
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError("GoodiesPicture delete failed");
      }
    },
  };
}
