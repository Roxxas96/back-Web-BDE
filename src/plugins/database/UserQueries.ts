import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { UserInfo } from "../../models/UserInfo";

function userQueries(fastify: FastifyInstance, client: PrismaClient) {
  return {
    updateUser: async function (userId: number, userInfo: UserInfo) {
      try {
        await client.users.update({
          where: { id: userId },
          data: userInfo,
        });
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes("Unique constraint failed")) {
            throw fastify.httpErrors.conflict("User already exists");
          }
          if (err.message.includes("Record to update not found")) {
            throw fastify.httpErrors.notFound("User not found");
          }
        }

        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Update Error on Table Users"
        );
      }
    },

    createUser: async function (userInfo: UserInfo) {
      try {
        await client.users.create({
          data: userInfo,
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
        throw fastify.httpErrors.internalServerError(
          "Database Create Error on Table Users"
        );
      }
    },

    deleteUser: async function (userId: number) {
      try {
        await fastify.prisma.client.users.delete({
          where: { id: userId },
        });
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes("Record to delete does not exist")) {
            throw fastify.httpErrors.notFound("User not found");
          }
        }

        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Users"
        );
      }
    },

    getUser: async function (userId?: number, email?: string) {
      let user;
      try {
        user = await client.users.findUnique({
          where: { id: userId, email: email },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Users"
        );
      }
      return user;
    },

    getManyUser: async function () {
      let Users;
      try {
        Users = await client.users.findMany();
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table Users"
        );
      }
      return Users;
    },
  };
}

export default userQueries;
