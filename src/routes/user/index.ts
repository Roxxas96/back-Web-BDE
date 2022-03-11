//Import Prisma ORM Types
import { FastifyPluginAsync } from "fastify";
import * as FormData from "form-data";

//Import Models
import {
  CreateUserInfo,
  UserInfoMinimal,
  CreateUserSchema,
  UserWithoutPassword,
  UpdateUserInfo,
  UpdateUserSchema,
} from "../../models/UserInfo";

//Import controller functions
import {
  createUser,
  deleteUser,
  getUser,
  getManyUser,
  modifyUserInfo,
  getMe,
  recoverPassword,
  modifyUserPasswor,
  updateAvatar,
  getAvatar,
  deleteAvatar,
  getManyAvatar,
} from "./controller";

const userRoute: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get<{
    Reply: { message: string; users: UserInfoMinimal[] };
    Querystring: { limit?: number; offset?: number };
  }>(
    "/",
    {
      schema: {
        tags: ["user"],
        description: "Fetch minimal info on all users",
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
      await fastify.auth.authenticate(request.headers);

      const users = await getManyUser(
        fastify,
        request.query.limit,
        request.query.offset
      );

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

  fastify.get<{ Reply: { message: string; user: UserWithoutPassword } }>(
    "/me",
    {
      schema: {
        tags: ["user"],
        description: "Get information on self",
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const user = await getMe(fastify, userId);

      return reply.status(200).send({ message: "Success", user });
    }
  );

  fastify.put<{
    Body: CreateUserInfo;
    Reply: { message: string; userId: number };
  }>(
    "/",
    {
      schema: {
        tags: ["user"],
        description: "Create a user with provided info",
        body: CreateUserSchema,
      },
    },
    async function (request, reply) {
      let userInfo = request.body;

      if (userInfo.privilege || userInfo.wallet) {
        const userId = await fastify.auth.authenticate(request.headers);

        await fastify.auth.authorize(userId, userInfo.privilege ? 2 : 1);
      }

      const createdUser = await createUser(fastify, userInfo);

      return reply
        .status(201)
        .send({ message: "User created", userId: createdUser.id });
    }
  );

  fastify.patch<{
    Body: UpdateUserInfo;
    Reply: { message: string; userId: number };
    Querystring: { recoverToken?: string };
  }>(
    "/",
    {
      schema: {
        tags: ["user"],
        description: "Modify info of the current user",
        body: UpdateUserSchema,
        querystring: {
          type: "object",
          properties: {
            recoverToken: {
              type: "string",
              description: "Recovery token that has been sent by email",
            },
          },
        },
      },
    },
    async function (request, reply) {
      const userInfo = request.body;

      let modifiedUser;

      if (request.query.recoverToken && userInfo.password) {
        modifiedUser = await modifyUserPasswor(
          fastify,
          userInfo.password,
          request.query.recoverToken
        );
      } else {
        const userId = await fastify.auth.authenticate(request.headers);

        if (userInfo.privilege || userInfo.wallet) {
          await fastify.auth.authorize(userId, userInfo.privilege ? 2 : 1);
        }

        modifiedUser = await modifyUserInfo(fastify, userId, userInfo);
      }

      return reply
        .status(200)
        .send({ message: "User updated", userId: modifiedUser.id });
    }
  );

  fastify.patch<{
    Params: { id: number };
    Body: UpdateUserInfo;
    Reply: { message: string; userId: number };
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
        body: UpdateUserSchema,
      },
    },
    async function (request, reply) {
      const userInfo = request.body;

      const userId = await fastify.auth.authenticate(request.headers);

      if (
        request.params.id !== userId ||
        userInfo.privilege ||
        userInfo.wallet
      ) {
        await fastify.auth.authorize(userId, userInfo.privilege ? 2 : 1);
      }

      const modifiedUser = await modifyUserInfo(
        fastify,
        request.params.id,
        userInfo
      );

      return reply
        .status(200)
        .send({ message: "User updated", userId: modifiedUser.id });
    }
  );

  fastify.delete<{
    Params: { id: number };
    Reply: { message: string; userId: number };
  }>(
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

      const deletedUser = await deleteUser(fastify, request.params.id);

      return reply
        .status(200)
        .send({ message: "User deleted", userId: deletedUser.id });
    }
  );

  fastify.post<{ Querystring: { email: string }; Reply: { message: string } }>(
    "/recover",
    {
      schema: {
        tags: ["user"],
        description: "Send a mail to recover password",
        querystring: {
          type: "object",
          properties: {
            email: {
              type: "string",
              description: "email to which the recover request will be sent",
            },
          },
          required: ["email"],
        },
      },
    },
    async function (request, reply) {
      await recoverPassword(fastify, request.query.email);

      reply
        .status(200)
        .send({ message: `A mail has been sent to ${request.query.email}` });
    }
  );

  fastify.put<{
    Querystring: { userId: number };
    Reply: { message: string };
  }>(
    "/avatar",
    {
      schema: {
        tags: ["user"],
        description: "Upload an avatar for the designated user",
        consumes: ["multipart/form-data"],
        querystring: {
          type: "object",
          properties: {
            userId: {
              type: "number",
              description: "Id of the user",
            },
          },
        },
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const user = await getUser(fastify, request.query.userId);

      if (user.id !== userId) {
        await fastify.auth.authorize(userId, 2);
      }

      await updateAvatar(fastify, (await request.file()).file, user);

      reply.status(200).send({ message: "Success" });
    }
  );

  fastify.get<{
    Querystring: { userId?: number; limit?: number; offset?: number };
    Reply: FormData;
  }>(
    "/picture",
    {
      schema: {
        tags: ["user"],
        description: "Get the user picture of the designated user",
        produces: ["multipart/form-data"],
        querystring: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: {
              type: "number",
              description: "Id of the user",
            },
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
      await fastify.auth.authenticate(request.headers);

      if (request.query.userId) {
        const accomplishment = await getUser(fastify, request.query.userId);

        const { name, avatar } = await getAvatar(fastify, accomplishment);

        const formData = new FormData();
        formData.append(name, avatar);

        reply.status(200).send(formData);
      } else {
        const { avatars, allQueriesSucceded } = await getManyAvatar(
          fastify,
          request.query.limit,
          request.query.offset
        );

        const formData = new FormData();
        avatars.forEach((val) => formData.append(`${val.name}`, val.avatar));

        reply.status(allQueriesSucceded ? 200 : 206).send(formData);
      }
    }
  );

  fastify.delete<{
    Querystring: { userId: number };
    Reply: { message: string };
  }>(
    "/avatar",
    {
      schema: {
        tags: ["user"],
        description: "Delete the avatar of the designated user",
        querystring: {
          type: "object",
          properties: {
            userId: {
              type: "number",
              description: "Id of the user",
            },
          },
        },
      },
    },
    async function (request, reply) {
      await fastify.auth.authenticate(request.headers);

      const user = await getUser(fastify, request.query.userId);

      await deleteAvatar(fastify, user);

      reply.status(200).send({ message: "Success" });
    }
  );
};

export default userRoute;
