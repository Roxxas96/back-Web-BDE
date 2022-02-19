//Import Prisma ORM Types
import { Session } from "@prisma/client";

import { FastifyPluginAsync } from "fastify";

//Import controller functions
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
  fastify.get<{
    Reply: { message: string; sessions: Session[] };
    Querystring: { limit?: number; offset?: number };
  }>(
    "/",
    {
      schema: {
        tags: ["session", "super admin"],
        description: "Fetch all sessions",
        querystring: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of elements to fetch",
            },
            offset: {
              type: "number",
              description: "Offset in element list from which fetch begins",
            },
          },
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 2);

      const sessions = await getManySession(
        fastify,
        request.query.limit,
        request.query.offset
      );

      return reply.status(200).send({ message: "Success", sessions });
    }
  );

  fastify.get<{
    Params: { id: number };
    Reply: { message: string; session: Session };
  }>(
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

      const session = await getSession(fastify, request.params.id);

      return reply.status(200).send({ message: "Success", session });
    }
  );

  fastify.put<{
    Body: { email: string; password: string };
    Reply: {
      message: string;
      token: string;
      userId: number;
    };
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

      const session = await createSession(fastify, userInfo);

      return reply.status(201).send({
        message: "Session created",
        token: session.token,
        userId: session.userId,
      });
    }
  );

  fastify.delete<{ Reply: { message: string } }>(
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

      return reply.status(200).send({ message: "Session deleted" });
    }
  );
};

export default sessionRoute;
