import { Users } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { UserInfo, UserInfoMinimal } from "../../models/UserInfo";
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  modifyUser,
} from "./controller";

const userRoute: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get<{ Reply: UserInfoMinimal[] }>(
    "/",
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const users = await getUsers(fastify);

      return reply.status(200).send(users);
    }
  );

  fastify.get<{ Params: { id: string }; Reply: Users }>(
    "/:id",
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const user = await getUser(fastify, parseInt(request.params.id));

      return reply.status(200).send(user);
    }
  );

  fastify.put<{
    Body: UserInfo;
    Reply: string;
  }>("/", async function (request, reply) {
    let userInfo = request.body;

    await createUser(fastify, userInfo);

    return reply.status(201).send("User created");
  });

  fastify.patch<{
    Body: UserInfo;
    Reply: string;
  }>("/", async function (request, reply) {
    const userInfo = request.body;

    const userId = await fastify.auth.authenticate(request.headers);

    await modifyUser(fastify, userId, userInfo);

    return reply.status(200).send("User updated");
  });

  fastify.delete<{ Reply: string }>("/", async function (request, reply) {
    const userId = await fastify.auth.authenticate(request.headers);

    await fastify.auth.authorize(userId, 2);

    await deleteUser(fastify, userId);

    return reply.status(200).send("User deleted");
  });
};

export default userRoute;
