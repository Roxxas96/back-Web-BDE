import { Accomplishment } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import {
  AccomplishmentInfo,
  AccomplishmentSchema,
} from "../../../models/AccomplishmentInfo";
import { createAccomplishment, getUserAccomplishment } from "./controller";

const userAccomplishmentRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{
    Params: { id: number; limit?: number; offset?: number };
    Reply: { message: string; accomplishments: Accomplishment[] };
  }>(
    "/:id",
    {
      schema: {
        tags: ["user", "accomplishment"],
        description: "Get a user accomplishments",
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "Id of the user" },
            limit: {
              type: "number",
              description: "Number of elements to fetch",
            },
            offset: {
              type: "number",
              description: "Offset in element list from which fetch begins",
            },
          },
          required: ["id"],
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      if (request.params.id !== userId) {
        await fastify.auth.authorize(userId, 1);
      }

      const accomplishments = await getUserAccomplishment(
        fastify,
        request.params.id,
        request.params.limit,
        request.params.offset
      );

      return reply.status(200).send({ message: "Success", accomplishments });
    }
  );

  fastify.put<{
    Params: { id: number };
    Body: { info: AccomplishmentInfo; challengeId: number };
    Reply: { message: string };
  }>(
    "/:id",
    {
      schema: {
        tags: ["user", "accomplishment"],
        description:
          "Create an accomplishment for a user with the provided info",
        body: {
          type: "object",
          properties: {
            info: AccomplishmentSchema,
            challengeId: {
              type: "number",
              description: "Id of the challenge related to the accomplishment",
            },
          },
          required: ["info", "challengeId"],
        },
        params: {
          type: "object",
          description: "Id of the user",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
      },
    },
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      await createAccomplishment(
        fastify,
        request.body.info,
        request.params.id,
        request.body.challengeId
      );

      return reply.status(201).send({ message: "Success" });
    }
  );
};

export default userAccomplishmentRoute;
