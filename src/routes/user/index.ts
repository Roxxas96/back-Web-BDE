import { users } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { createUser, getUser, getUsers, modifyUser } from "./controller";

const userRoute: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get<{ Reply: users[] }>("/", async function (request, reply) {
    await fastify.auth.authenticate(request.headers);

    const users = await getUsers(fastify);

    return reply.status(200).send(users);
  });

  fastify.get<{ Params: { id: string }; Reply: users }>(
    "/:id",
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const user = await getUser(fastify, request.params.id);

      return reply.status(200).send(user);
    }
  );

  fastify.put<{
    Body: {
      email: string;
      password: string;
      name: string;
      surname: string;
      pseudo: string;
    };
    Reply: string;
  }>("/", async function (request, reply) {
    let userInfo = request.body;

    await createUser(fastify, userInfo);

    return reply.status(201).send("User created");
  });

  fastify.patch<{
    Body: {
      email: string;
      password: string;
      name: string;
      surname: string;
      pseudo: string;
    };
    Reply: string;
  }>("/", async function (request, reply) {
    const userInfo = request.body;

    const userId = await fastify.auth.authenticate(request.headers);

    await modifyUser(fastify, userId.toString(), userInfo);

    return reply.status(201).send("User updated");
  });

  fastify.delete<{ Params: { id: string }; Reply: string }>(
    "/:id",
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);
      try {
        await fastify.prisma.client.users.delete({
          where: { id: parseInt(request.params.id) },
        });
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes("Record to delete does not exist")) {
            throw fastify.httpErrors.notFound("User not found");
          }
        }
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError("Database fetch Error");
      }
      return reply.status(200).send("User deleted");
    }
  );
};

export default userRoute;
