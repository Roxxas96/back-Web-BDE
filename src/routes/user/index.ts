import { Users } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { createUser, getUser, getUsers, modifyUser } from "./controller";

const userRoute: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get<{ Reply: Users[] }>("/", async function (request, reply) {
    await fastify.auth.authenticate(request.headers);

    const users = await getUsers(fastify);

    return reply.status(200).send(users);
  });

  fastify.get<{ Params: { id: string }; Reply: Users }>(
    "/:id",
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const user = await getUser(fastify, parseInt(request.params.id));

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

    await modifyUser(fastify, userId, userInfo);

    return reply.status(201).send("User updated");
  });

  fastify.delete<{ Params: { id: string }; Reply: string }>(
    "/:id",
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      await fastify.prisma.user.deleteUser(parseInt(request.params.id));

      return reply.status(200).send("User deleted");
    }
  );
};

export default userRoute;
