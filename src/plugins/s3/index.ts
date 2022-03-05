import fp from "fastify-plugin";
import * as Minio from "minio";
import { ProofQueries } from "./ProofQueries";

export interface MinioPluginOptions {
  // Specify Support plugin options here
}

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<MinioPluginOptions>(async (fastify, opts) => {
  const client = new Minio.Client({
    endPoint: process.env["MINIO_ENDPOINT"] || "localhost",
    port: parseInt(process.env["MINIO_PORT"] || "9000"),
    useSSL: false,
    accessKey: process.env["MINIO_ACCESS_KEY"] || "minio-admin",
    secretKey: process.env["MINIO_SECRET_KEY"] || "minio-admin",
  });

  let connectionTimeout = 1;
  async function connectToMinio() {
    try {
      if (await client.bucketExists("webbde")) {
        fastify.log.info("Minio bucket connected");
      } else {
        fastify.log.error(
          `Minio connected but bucket does not exist, retrying in ${connectionTimeout} seconds`
        );

        setTimeout(connectToMinio, connectionTimeout * 1000);

        connectionTimeout *= 2;
      }
    } catch {
      if (connectionTimeout > 100) {
        fastify.log.error(
          "Minio connection max retries reached, exiting process"
        );

        process.exit(1);
      }

      fastify.log.info(
        `Minio connection failed, retrying in ${connectionTimeout} seconds`
      );

      setTimeout(connectToMinio, connectionTimeout * 1000);

      connectionTimeout *= 2;
    }
  }
  connectToMinio();

  const minio = {
    client: client,
    proof: ProofQueries(fastify, client),
  };

  fastify.decorate("minio", minio);
});

// When using .decorate you have to specify added properties for Typescript
declare module "fastify" {
  export interface FastifyInstance {
    minio: {
      client: Minio.Client;
      proof: {
        putProof: (
          proof: Buffer,
          accomplishmentId: number,
          userId: number,
          tries: number
        ) => Promise<void>;
        getProof: (
          accomplishmentId: number,
          userId: number,
          tries: number
        ) => Promise<Buffer>;
      };
    };
  }
}
