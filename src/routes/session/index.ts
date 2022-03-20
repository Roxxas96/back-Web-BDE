//Import Prisma ORM Types
import { FastifyPluginAsync } from "fastify";

//Import controller functions
import {
  createSession,
  deleteSession,
  getSession,
  getManySession,
  getSessionCount,
} from "./controller";

const sessionRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{
    Querystring: { limit?: number; offset?: number; userId?: number };
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
            userId: {
              type: "number",
              description: "Filter by user id",
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
        request.query.offset,
        request.query.userId
      );

      return reply.status(200).send({ message: "Success", sessions });
    }
  );

  fastify.get<{
    Params: { id: number };
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

  fastify.get<{
    Querystring: {
      userId?: number;
    };
  }>(
    "/count",
    {
      schema: {
        tags: ["session"],
        description: "Get the number of sessions",
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      //Only admins can fetch other's purchases or all purchases
      if (
        (request.query.userId && request.query.userId !== userId) ||
        !request.query.userId
      ) {
        await fastify.auth.authorize(userId, 1);
      }

      const sessionsCount = await getSessionCount(
        fastify,
        request.query.userId,
      );

      return reply.status(200).send({ message: "Success", count: sessionsCount });
    }
  );
};

export default sessionRoute;
