import { Accomplishment } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { getUserAccomplishment } from "./controller";

const userAccomplishmentRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{
    Params: { id: number };
    Reply: { message: string; accomplishments: Accomplishment[] };
  }>("/:id", async function (request, reply) {
    const userId = await fastify.auth.authenticate(request.headers);

    if (request.params.id !== userId) {
      await fastify.auth.authorize(userId, 1);
    }

    const accomplishments = await getUserAccomplishment(fastify, request.id);

    return reply.status(200).send({ message: "Success", accomplishments });
  });
};

export default userAccomplishmentRoute;
