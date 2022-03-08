import { FastifyInstance } from "fastify";
import * as Minio from "minio";
import internal = require("stream");

export function ChallengePictureQueries(fastify: FastifyInstance, client: Minio.Client) {
  return {
    putChallengePicture: async function (challengePicture: internal.Readable, challengeId: number) {
      try {
        return await client.putObject("challengepictures", `${challengeId}`, challengePicture);
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError("Challenge Picture upload failed");
      }
    },
    getChallengePicture: async function (challengeId: number) {
      try {
        return await client.getObject("challengepictures", `${challengeId}`);
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes("The specified key does not exist")
        ) {
          throw fastify.httpErrors.notFound("Challenge Picture not found");
        }

        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError("Challenge Picture download failed");
      }
    },
    deleteChallengePicture: async function (challengeId: number) {
      try {
        return await client.removeObject("challengepictures", `${challengeId}`);
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError("ChallengePicture delete failed");
      }
    },
  };
}
