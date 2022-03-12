import fp from "fastify-plugin";
import * as Minio from "minio";
import internal = require("stream");
import { AvatarQueries } from "./AvatarQueries";
import { ChallengePictureQueries } from "./ChallengePictureQueries";
import { GoodiesPictureQueries } from "./GoodiesPictureQueries";
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
      await client.listBuckets();

      fastify.log.info("Minio bucket connected");
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
    avatar: AvatarQueries(fastify, client),
    challengePicture: ChallengePictureQueries(fastify, client),
    goodiesPicture: GoodiesPictureQueries(fastify, client),
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
          proof: internal.Readable,
          accomplishmentId: number
        ) => Promise<Minio.UploadedObjectInfo>;
        getProof: (accomplishmentId: number) => Promise<{
          proof: internal.Readable;
          name: string;
        }>;
        getManyProof: (
          limit: number,
          offset: number
        ) => Promise<{
          proofs: Array<{
            proof: internal.Readable;
            name: string;
          }>;
          allQueriesSucceded: boolean;
        }>;
        deleteProof: (accomplishmentId: number) => Promise<void>;
      };
      avatar: {
        putAvatar: (
          avatar: internal.Readable,
          userId: number
        ) => Promise<Minio.UploadedObjectInfo>;
        getAvatar: (userId: number) => Promise<{
          avatar: internal.Readable;
          name: string;
        }>;
        getManyAvatar: (
          limit: number,
          offset: number
        ) => Promise<{
          avatars: Array<{
            avatar: internal.Readable;
            name: string;
          }>;
          allQueriesSucceded: boolean;
        }>;
        deleteAvatar: (userId: number) => Promise<void>;
      };
      challengePicture: {
        putChallengePicture: (
          challengePicture: internal.Readable,
          challengeId: number
        ) => Promise<Minio.UploadedObjectInfo>;
        getChallengePicture: (challengeId: number) => Promise<{
          challengePicture: internal.Readable;
          name: string;
        }>;
        getManyChallengePicture: (
          limit: number,
          offset: number
        ) => Promise<{
          challengePictures: Array<{
            challengePicture: internal.Readable;
            name: string;
          }>;
          allQueriesSucceded: boolean;
        }>;
        deleteChallengePicture: (challengeId: number) => Promise<void>;
      };
      goodiesPicture: {
        putGoodiesPicture: (
          goodiesPicture: internal.Readable,
          goodiesId: number
        ) => Promise<Minio.UploadedObjectInfo>;
        getGoodiesPicture: (goodiesId: number) => Promise<{
          goodiesPicture: internal.Readable;
          name: string;
        }>;
        getManyGoodiesPicture: (
          offset: number,
          limit: number
        ) => Promise<{
          goodiesPictures: Array<{
            goodiesPicture: internal.Readable;
            name: string;
          }>;
          allQueriesSucceded: boolean;
        }>;
        deleteGoodiesPicture: (goodiesId: number) => Promise<void>;
      };
    };
  }
}
