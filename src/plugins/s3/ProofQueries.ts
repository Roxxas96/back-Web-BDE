import { FastifyInstance } from "fastify";
import * as Minio from "minio";

export function ProofQueries(fastify: FastifyInstance, client: Minio.Client) {
  return {
    putProof: async function (
      proof: Buffer,
      accomplishmentId: number,
      userId: number,
      tries: number
    ) {
      try {
        await client.putObject(
          "proofs",
          `${accomplishmentId}_${userId}_${tries}`,
          proof
        );
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError("Proof upload failed");
      }
    },
    getProof: async function (
      accomplishmentId: number,
      userId: number,
      tries: number
    ) {
      let proof;
      try {
        proof = await client.getObject(
          "proofs",
          `${accomplishmentId}_${userId}_${tries}`
        );
      } catch (err) {
        fastify.log.error(err);

        throw fastify.httpErrors.internalServerError("Proof download failed");
      }
      return proof;
    },
  };
}
