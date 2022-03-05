import fp from "fastify-plugin";
import multipart, { FastifyMultipartOptions } from "fastify-multipart";

/**
 * This plugins adds some utilities to handle http errors
 *
 * @see https://github.com/fastify/fastify-sensible
 */
export default fp<FastifyMultipartOptions>(async (fastify, opts) => {
  fastify.register(multipart, {
    limits: {
      fieldNameSize: 100, // Max field name size in bytes
      fieldSize: 100, // Max field value size in bytes
      fields: 10, // Max number of non-file fields
      fileSize: 100000000, // For multipart forms, the max file size in bytes
      files: 1, // Max number of file fields
      headerPairs: 2000, // Max number of header key=>value pairs
    },
    attachFieldsToBody: true,
    sharedSchemaId: "multipartSharedSchema",
  });
});
