import { sessions } from "@prisma/client";
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
  fastify.get<{ Reply: sessions[] }>("/", async function (request, reply) {
    await fastify.auth.authorize(request.headers);

    const sessions = await getSessions(fastify);

    return reply.status(200).send(sessions);
  });

  fastify.get<{ Params: { id: string }; Reply: sessions }>(
    "/:id",
    async function (request, reply) {
      await fastify.auth.authorize(request.headers);

      const session = await getSession(fastify, request.params.id);

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
    await fastify.auth.authorize(request.headers);

    await deleteSession(fastify, request.headers);

    return reply.status(200).send("Session deleted");
  });
};

export default sessionRoute;
