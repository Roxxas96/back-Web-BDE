import { FastifyPluginAsync } from "fastify"

const accomplishmentRoute: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", async function (request, reply) {
      
  })
}

export default accomplishmentRoute;
