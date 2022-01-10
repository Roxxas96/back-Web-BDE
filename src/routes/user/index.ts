import { users } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";

import * as bcrypt from "bcrypt";

const userRoute: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get<{ Reply: users[] }>("/", async function (request, reply) {
    let users;
    try {
      users = await fastify.prisma.users.findMany();
    } catch (err) {
      fastify.log.error(err);
      throw fastify.httpErrors.internalServerError("Database fetch Error");
    }
    return reply.status(200).send(users);
  });

  fastify.get<{ Params: { id: string }; Reply: users }>(
    "/:id",
    async function (request, reply) {
      let user;
      try {
        user = await fastify.prisma.users.findUnique({
          where: { id: parseInt(request.params.id) },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError("Database fetch Error");
      }
      if (!user) {
        throw fastify.httpErrors.notFound("User not found");
      }
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

    if (!/\@.*umontpellier\.fr/g.test(userInfo.email)) {
      throw fastify.httpErrors.badRequest(
        "User email must be from umontpellier.fr"
      );
    }

    if (userInfo.password.length < 8) {
      throw fastify.httpErrors.badRequest("User password is too small");
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(userInfo.password, 10);
    } catch (err) {
      fastify.log.error(err);
      throw fastify.httpErrors.internalServerError("Password hash failed");
    }

    try {
      await fastify.prisma.users.create({
        data: {
          name: userInfo.name,
          surname: userInfo.surname,
          pseudo: userInfo.pseudo,
          email: userInfo.email,
          password: hashedPassword,
        },
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("Unique constraint failed")) {
          throw fastify.httpErrors.conflict("User already exists");
        }
        if (/Argument .* for .* is missing/g) {
          throw fastify.httpErrors.badRequest("Missing argument");
        }
      }
      fastify.log.error(err);
      throw fastify.httpErrors.internalServerError("Database create Error");
    }
    return reply.status(201).send("User created");
  });

  fastify.patch<{
    Params: { id: string };
    Body: {
      email: string;
      password: string;
      name: string;
      surname: string;
      pseudo: string;
    };
    Reply: string;
  }>("/:id", async function (request, reply) {
    let userInfo = request.body;

    if (userInfo.email && !/\@.*umontpellier\.fr/g.test(userInfo.email)) {
      throw fastify.httpErrors.badRequest(
        "User email must be from umontpellier.fr"
      );
    }

    let hashedPassword;
    if (userInfo.password) {
      if (userInfo.password.length < 8) {
        throw fastify.httpErrors.badRequest("User password is too small");
      }
      try {
        hashedPassword = await bcrypt.hash(userInfo.password, 10);
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError("Password hash failed");
      }
    }

    try {
      await fastify.prisma.users.update({
        where: { id: parseInt(request.params.id) },
        data: {
          name: userInfo.name,
          surname: userInfo.surname,
          pseudo: userInfo.pseudo,
          email: userInfo.email,
          password: hashedPassword,
        },
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("Unique constraint failed")) {
          throw fastify.httpErrors.conflict("User email already exists");
        }
        if (err.message.includes("Record to update not found")) {
          throw fastify.httpErrors.notFound("User not found");
        }
      }
      fastify.log.error(err);
      throw fastify.httpErrors.internalServerError("Database update Error");
    }
    return reply.status(201).send("User updated");
  });

  fastify.delete<{ Params: { id: string }; Reply: string }>(
    "/:id",
    async function (request, reply) {
      try {
        await fastify.prisma.users.delete({
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
