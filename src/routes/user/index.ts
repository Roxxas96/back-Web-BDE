//Import Prisma ORM Types
import { User } from "@prisma/client";

import { FastifyPluginAsync } from "fastify";

//Import Models
import { UserInfo, UserInfoMinimal, UserSchema } from "../../models/UserInfo";

//Import controller functions
import {
  createUser,
  deleteUser,
  getUser,
  getManyUser,
  modifyUser,
} from "./controller";

const userRoute: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get<{ Reply: UserInfoMinimal[] }>(
    "/",
    {
      schema: {
        tags: ["user"],
        description: "Fetch minimal info on all users",
      },
    },
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const users = await getManyUser(fastify);

      return reply.status(200).send(users);
    }
  );

  fastify.get<{ Params: { id: number }; Reply: User }>(
    "/:id",
    {
      schema: {
        tags: ["user"],
        description: "Fetch detailed info on a user",
        params: {
          type: "object",
          description: "Id of the user to fetch",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
      },
    },
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const user = await getUser(fastify, request.params.id);

      return reply.status(200).send(user);
    }
  );

  fastify.put<{
    Body: UserInfo;
    Reply: string;
  }>(
    "/",
    {
      schema: {
        tags: ["user"],
        description: "Create a user with provided info",
        body: UserSchema,
      },
    },
    async function (request, reply) {
      let userInfo = request.body;

      await createUser(fastify, userInfo);

      return reply.status(201).send("User created");
    }
  );

  fastify.patch<{
    Body: UserInfo;
    Reply: string;
  }>(
    "/",
    {
      schema: {
        tags: ["user"],
        description: "Modify info of the current user",
        body: UserSchema,
      },
    },
    async function (request, reply) {
      const userInfo = request.body;

      const userId = await fastify.auth.authenticate(request.headers);

      await modifyUser(fastify, userId, userInfo);

      return reply.status(200).send("User updated");
    }
  );

  fastify.patch<{
    Params: { id: number };
    Body: UserInfo;
    Reply: string;
  }>(
    "/:id",
    {
      schema: {
        tags: ["user", "super admin"],
        description: "Modify info of the designed user",
        params: {
          type: "object",
          description: "Id of the user to modify",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
        body: UserSchema,
      },
    },
    async function (request, reply) {
      const userInfo = request.body;

      const userId = await fastify.auth.authenticate(request.headers);

      await fastify.auth.authorize(userId, 2);

      await modifyUser(fastify, request.params.id, userInfo);

      return reply.status(200).send("User updated");
    }
  );

  fastify.delete<{ Params: { id: number }; Reply: string }>(
    "/:id",
    {
      schema: {
        tags: ["user", "super admin"],
        description: "Delete the designed user user",
        params: {
          type: "object",
          description: "Id of the user to delete",
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

      await deleteUser(fastify, request.params.id);

      return reply.status(200).send("User deleted");
    }
  );
};

export default userRoute;
