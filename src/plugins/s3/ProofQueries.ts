import { FastifyInstance } from "fastify";
import * as Minio from "minio";
import internal = require("stream");

export function ProofQueries(fastify: FastifyInstance, client: Minio.Client) {
  return {
    putProof: async function (
      proof: internal.Readable,
      accomplishmentId: number
    ) {
      try {
        return await client.putObject("proofs", `${accomplishmentId}`, proof);
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError("Proof upload failed");
      }
    },
    getProof: async function (accomplishmentId: number) {
      try {
        return await client.getObject("proofs", `${accomplishmentId}`);
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
    getManyProof: async function (limit: number, offset: number) {
      let allQueriesSucceded = true;
      let proofs: Array<{
        proof: internal.Readable;
        name: string;
      }> = [];
      for (let index = offset; index <= limit + offset; index++) {
        try {
          const proof = await client.getObject(
            "proofs",
            `${index}`
          );
          proofs.push({ proof, name: index.toString() });
        } catch (err) {
          if (
            !(
              err instanceof Error &&
              err.message.includes("The specified key does not exist")
            )
          ) {
            fastify.log.error(err);

            throw fastify.httpErrors.internalServerError(
              "Proof download failed"
            );
          }
          allQueriesSucceded = false;
        }
      }
      return { proofs, allQueriesSucceded };
    },
    deleteProof: async function (accomplishmentId: number) {
      try {
        return await client.removeObject("proofs", `${accomplishmentId})`);
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError("Proof delete failed");
      }
    },
  };
}
