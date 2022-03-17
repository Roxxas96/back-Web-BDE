import { FastifyInstance } from "fastify";
import * as Minio from "minio";
import internal = require("stream");

export function ChallengePictureQueries(
  fastify: FastifyInstance,
  client: Minio.Client
) {
  return {
    putChallengePicture: async function (
      challengePicture: internal.Readable,
      id: string
    ) {
      try {
        return await client.putObject(
          "challengepictures",
          `${id}`,
          challengePicture
        );
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError(
          "Challenge Picture upload failed"
        );
      }
    },
    getChallengePicture: async function (id: string) {
      try {
        return await client.getObject("challengepictures", `${id}`);
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes("The specified key does not exist")
        ) {
          throw fastify.httpErrors.notFound("Challenge Picture not found");
        }

        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError(
          "Challenge Picture download failed"
        );
      }
    },
    deleteChallengePicture: async function (id: string) {
      try {
        return await client.removeObject("challengepictures", `${id}`);
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError(
          "ChallengePicture delete failed"
        );
      }
    },
  };
}
