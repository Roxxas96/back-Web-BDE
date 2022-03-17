import { FastifyInstance } from "fastify";
import * as Minio from "minio";
import internal = require("stream");

export function GoodiesPictureQueries(
  fastify: FastifyInstance,
  client: Minio.Client
) {
  return {
    putGoodiesPicture: async function (
      goodiesPicture: internal.Readable,
      id: string
    ) {
      try {
        return await client.putObject(
          "goodiespictures",
          `${id}`,
          goodiesPicture
        );
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError(
          "Goodies Picture upload failed"
        );
      }
    },
    getGoodiesPicture: async function (id: string) {
      try {
        return await client.getObject("goodiespictures", `${id}`);
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes("The specified key does not exist")
        ) {
          throw fastify.httpErrors.notFound("Goodies Picture not found");
        }

        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError(
          "Goodies Picture download failed"
        );
      }
    },
    deleteGoodiesPicture: async function (id: string) {
      try {
        return await client.removeObject("goodiespictures", `${id}`);
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError(
          "GoodiesPicture delete failed"
        );
      }
    },
  };
}
