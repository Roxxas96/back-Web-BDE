import { FastifyInstance } from "fastify";
import * as Minio from "minio";
import internal = require("stream");

export function ProofQueries(fastify: FastifyInstance, client: Minio.Client) {
  return {
    putProof: async function (proof: internal.Readable, id: string) {
      try {
        return await client.putObject("proofs", `${id}`, proof);
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError("Proof upload failed");
      }
    },
    getProof: async function (id: string) {
      try {
        return await client.getObject("proofs", `${id}`);
      } catch (err) {
        //TODO repace with a prefetch
        if (
          err instanceof Error &&
          err.message.includes("The specified key does not exist")
        ) {
          throw fastify.httpErrors.notFound("Proof not found");
        }

        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError("Proof download failed");
      }
    },
    deleteProof: async function (id: string) {
      try {
        return await client.removeObject("proofs", `${id})`);
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError("Proof delete failed");
      }
    },
  };
}
