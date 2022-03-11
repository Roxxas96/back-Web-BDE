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
      challengeId: number
    ) {
      try {
        return await client.putObject(
          "challengepictures",
          `${challengeId}`,
          challengePicture
        );
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError(
          "Challenge Picture upload failed"
        );
      }
    },
    getChallengePicture: async function (challengeId: number) {
      try {
        return {challengePicture: await client.getObject("challengepictures", `${challengeId}`), name: challengeId.toString()};
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
    getManyChallengePicture: async function (limit: number, offset: number) {
      let allQueriesSucceded = true;
      let challengePictures: Array<{
        challengePicture: internal.Readable;
        name: string;
      }> = [];
      for (let index = offset; index <= limit + offset; index++) {
        try {
          const challengePicture = await client.getObject(
            "challengepictures",
            `${index}`
          );
          challengePictures.push({ challengePicture, name: index.toString() });
        } catch (err) {
          if (
            !(
              err instanceof Error &&
              err.message.includes("The specified key does not exist")
            )
          ) {
            fastify.log.error(err);

            throw fastify.httpErrors.internalServerError(
              "ChallengePicture download failed"
            );
          }
          allQueriesSucceded = false;
        }
      }
      return { challengePictures, allQueriesSucceded };
    },
    deleteChallengePicture: async function (challengeId: number) {
      try {
        return await client.removeObject("challengepictures", `${challengeId}`);
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError(
          "ChallengePicture delete failed"
        );
      }
    },
  };
}
