//Import Prisma ORM Types
import { FastifyPluginAsync } from "fastify";

//Import Models
import { UserInfo, UserInfoMinimal, UserSchema, UserWithoutPassword } from "../../models/UserInfo";

//Import controller functions
import {
  createUser,
  deleteUser,
  getUser,
  getManyUser,
  modifyUser,
} from "./controller";

const userRoute: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get<{ Reply: { message: string; users: UserInfoMinimal[] } }>(
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

      return reply.status(200).send({ message: "Success", users });
    }
  );

  fastify.get<{
    Params: { id: number };
    Reply: {
      message: string;
      user: UserWithoutPassword;
    };
  }>(
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

      return reply.status(200).send({ message: "Success", user });
    }
  );

  fastify.put<{
    Body: UserInfo;
    Reply: { message: string };
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

      return reply.status(201).send({ message: "User created" });
    }
  );

  fastify.patch<{
    Body: UserInfo;
    Reply: { message: string };
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

      return reply.status(200).send({ message: "User updated" });
    }
  );

  fastify.patch<{
    Params: { id: number };
    Body: UserInfo;
    Reply: { message: string };
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

      return reply.status(200).send({ message: "User updated" });
    }
  );

  fastify.delete<{ Params: { id: number }; Reply: { message: string } }>(
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

      return reply.status(200).send({ message: "User deleted" });
    }
  );
};

export default userRoute;
