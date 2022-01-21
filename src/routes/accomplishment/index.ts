import { Accomplishments } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { AccomplishmentInfo } from "../../models/AccomplishmentInfo";
import {
  createAccomplishment,
  deleteAccomplishment,
  getAccomplishment,
  getManyAccomplishment,
  updateAccomplishment,
  validateAccomplishment,
} from "./controller";

const accomplishmentRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{ Reply: Accomplishments[] }>(
    "/",
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      let accomplishments;

      switch (await fastify.auth.getPrivilege(userId)) {
        //Classic user route
        case 0:
          accomplishments = await getManyAccomplishment(fastify, userId);
          break;
        //Admin route
        default:
          accomplishments = await getManyAccomplishment(fastify);
          break;
      }

      return reply.status(200).send(accomplishments);
    }
  );

  fastify.get<{ Params: { id: string; Reply: Accomplishments } }>(
    "/:id",
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const accomplishment = await getAccomplishment(
        fastify,
        parseInt(request.params.id)
      );

      //Classic users can't fetch other's accomplishments
      if (accomplishment.userId !== userId) {
        await fastify.auth.authorize(userId, 1);
      }

      return reply.status(200).send(accomplishment);
    }
  );
  fastify.put<{
    Body: { Info: AccomplishmentInfo; challengeId: number };
    Reply: string;
  }>("/", async function (request, reply) {
    const userId = await fastify.auth.authenticate(request.headers);

    const accomplishmentInfo = request.body.Info;

    await createAccomplishment(
      fastify,
      accomplishmentInfo,
      userId,
      request.body.challengeId
    );

    return reply.status(201).send("Accomplishment created");
  });
  fastify.patch<{
    Params: { id: string };
    Body: AccomplishmentInfo;
    Reply: string;
  }>("/:id", async function (request, reply) {
    const userId = await fastify.auth.authenticate(request.headers);

    const accomplishmentInfo = request.body;

    const accomplishment = await getAccomplishment(
      fastify,
      parseInt(request.params.id)
    );

    //Need super admin to modify other's accomplishments
    if (accomplishment.userId !== userId) {
      await fastify.auth.authorize(userId, 2);
    }

    await updateAccomplishment(fastify, accomplishmentInfo, accomplishment);

    return reply.status(201).send("Accomplishment updated");
  });

  fastify.delete<{ Params: { id: string }; Reply: string }>(
    "/:id",
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const accomplishment = await getAccomplishment(
        fastify,
        parseInt(request.params.id)
      );

      //Need super admin to delete other's accomplishments
      if (accomplishment.userId !== userId) {
        await fastify.auth.authorize(userId, 2);
      }

      await deleteAccomplishment(fastify, accomplishment);

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
