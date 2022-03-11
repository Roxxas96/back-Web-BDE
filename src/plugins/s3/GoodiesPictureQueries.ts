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
      goodiesId: number
    ) {
      try {
        return await client.putObject(
          "goodiespictures",
          `${goodiesId}`,
          goodiesPicture
        );
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError(
          "Goodies Picture upload failed"
        );
      }
    },
    getGoodiesPicture: async function (goodiesId: number) {
      try {
        return {goodiesPicture: await client.getObject("goodiespictures", `${goodiesId}`), name: goodiesId.toString()};
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
    getManyGoodiesPicture: async function (limit: number, offset: number) {
      let allQueriesSucceded = true;
      let goodiesPictures: Array<{
        goodiesPicture: internal.Readable;
        name: string;
      }> = [];
      for (let index = offset; index <= limit + offset; index++) {
        try {
          const goodiesPicture = await client.getObject(
            "goodiespictures",
            `${index}`
          );
          goodiesPictures.push({ goodiesPicture, name: index.toString() });
        } catch (err) {
          if (
            !(
              err instanceof Error &&
              err.message.includes("The specified key does not exist")
            )
          ) {
            fastify.log.error(err);

            throw fastify.httpErrors.internalServerError(
              "GoodiesPicture download failed"
            );
          }
          allQueriesSucceded = false;
        }
      }
      return { goodiesPictures, allQueriesSucceded };
    },
    deleteGoodiesPicture: async function (goodiesId: number) {
      try {
        return await client.removeObject("goodiespictures", `${goodiesId}`);
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError(
          "GoodiesPicture delete failed"
        );
      }
    },
  };
}
