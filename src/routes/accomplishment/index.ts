import { Accomplishments } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { AccomplishmentInfo } from "../../models/AccomplishmentInfo";
import {
  createAccomplishment,
  deleteAccomplishment,
  getAccomplishment,
  getAccomplishments,
  updateAccomplishment,
  validateAccomplishment,
} from "./controller";

//TODO : Rework of routes, some are not logic

const accomplishmentRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{ Reply: Accomplishments[] }>(
    "/",
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 1);

      const accomplishments = await getAccomplishments(fastify);

      return reply.status(200).send(accomplishments);
    }
  );

  fastify.get<{ Params: { id: string; Reply: Accomplishments } }>(
    "/:id",
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const accomplishment = await getAccomplishment(
        fastify,
        parseInt(request.params.id)
      );

      return reply.status(200).send(accomplishment);
    }
  );
  fastify.put<{ Body: AccomplishmentInfo; Reply: string }>(
    "/",
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const accomplishmentInfo = request.body;

      await createAccomplishment(fastify, accomplishmentInfo);

      return reply.status(201).send("Accomplishment created");
    }
  );
  fastify.patch<{
    Params: { id: string };
    Body: AccomplishmentInfo;
    Reply: string;
  }>("/:id", async function (request, reply) {
    await fastify.auth.authenticate(request.headers);

    const accomplishmentInfo = request.body;

    await updateAccomplishment(
      fastify,
      accomplishmentInfo,
      parseInt(request.params.id)
    );

    return reply.status(201).send("Accomplishment updated");
  });

  fastify.delete<{ Params: { id: string }; Reply: string }>(
    "/:id",
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      await deleteAccomplishment(fastify, parseInt(request.params.id));

      return reply.status(200).send("Accomplishment deleted");
    }
  );

  fastify.patch<{ Params: { id: string }; Body: { state: 1 | -1 } }>(
    "/validate/:id",
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 1);

      await validateAccomplishment(
        fastify,
        request.body.state,
        parseInt(request.params.id)
      );

      return reply.status(201).send("Accomplishment validation changed");
    }
  );
};

export default accomplishmentRoute;
