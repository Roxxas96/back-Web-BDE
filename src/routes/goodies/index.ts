import { Goodies } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { GoodiesInfo, GoodiesInfoMinimal } from "../../models/GoodiesInfo";
import {
  createGoodies,
  deleteGoodies,
  getGoodies,
  getManyGoodies,
  updateGoodies,
} from "./controller";

const goodiesRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{ Reply: GoodiesInfoMinimal[] }>(
    "/",
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const goodies = await getManyGoodies(fastify);

      return reply.status(200).send(goodies);
    }
  );

  fastify.get<{ Params: { id: string }; Reply: Goodies }>(
    "/:id",
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const goodies = await getGoodies(fastify, parseInt(request.params.id));

      return reply.status(200).send(goodies);
    }
  );

  fastify.put<{ Body: GoodiesInfo; Reply: string }>(
    "/",
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const goodiesInfo = request.body;

      await fastify.auth.authorize(userId, 1);

      await createGoodies(fastify, goodiesInfo, userId);

      return reply.status(201).send("Goodies created");
    }
  );

  fastify.patch<{ Body: GoodiesInfo; Params: { id: string }; Reply: string }>(
    "/:id",
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const goodiesInfo = request.body;

      await fastify.auth.authorize(userId, 1);

      await updateGoodies(fastify, goodiesInfo, parseInt(request.params.id));

      return reply.status(201).send("Goodies updated");
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 1);

      await deleteGoodies(fastify, parseInt(request.params.id));

      return reply.status(200).send("Goodies deleted");
    }
  );
};

export default goodiesRoute;
