import { Sessions } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import {
  createSession,
  deleteSession,
  getSession,
  getSessions,
} from "./controller";

const sessionRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{ Reply: Sessions[] }>("/", async function (request, reply) {
    const userId = await fastify.auth.authenticate(request.headers);

    await fastify.auth.authorize(userId, 2);

    const sessions = await getSessions(fastify);

    return reply.status(200).send(sessions);
  });

  fastify.get<{ Params: { id: string }; Reply: Sessions }>(
    "/:id",
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
  }>("/", async function (request, reply) {
    const userInfo = request.body;

    const token = await createSession(fastify, userInfo);

    return reply.status(201).send({ message: "Session created", token: token });
  });

  fastify.delete<{ Reply: string }>("/", async function (request, reply) {
    await fastify.auth.authenticate(request.headers);

    await deleteSession(fastify, request.headers);

    return reply.status(200).send("Session deleted");
  });
};

export default sessionRoute;
