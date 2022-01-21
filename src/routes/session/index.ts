import { Sessions } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import {
  createSession,
  deleteSession,
  getSession,
  getManySession,
} from "./controller";

const sessionRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{ Reply: Sessions[] }>(
    "/",
    {
      schema: {
        tags: ["session", "super admin"],
        description: "Fetch all sessions",
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 2);

      const sessions = await getManySession(fastify);

      return reply.status(200).send(sessions);
    }
  );

  fastify.get<{ Params: { id: string }; Reply: Sessions }>(
    "/:id",
    {
      schema: {
        tags: ["session", "super admin"],
        description: "Fetch a session",
        params: {
          type: "object",
          description: "Id of the session to fetch",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 2);

      const session = await getSession(fastify, parseInt(request.params.id));

      return reply.status(200).send(session);
    }
  );

  fastify.put<{
    Body: { email: string; password: string };
    Reply: { message: string; token: string };
  }>(
    "/",
    {
      schema: {
        tags: ["session"],
        description: "Create a session for the current user",
        body: {
          type: "object",
          description: "User logins",
          properties: {
            email: { type: "string" },
            password: { type: "string" },
          },
          required: ["email", "password"],
        },
      },
    },
    async function (request, reply) {
      const userInfo = request.body;

      const token = await createSession(fastify, userInfo);

      return reply
        .status(201)
        .send({ message: "Session created", token: token });
    }
  );

  fastify.delete<{ Reply: string }>(
    "/",
    {
      schema: {
        tags: ["session"],
        description: "Delete the current user's session",
      },
    },
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      await deleteSession(fastify, request.headers);

      return reply.status(200).send("Session deleted");
    }
  );
};

export default sessionRoute;
