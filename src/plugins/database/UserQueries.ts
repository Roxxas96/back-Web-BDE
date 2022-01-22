import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { UserInfo } from "../../models/UserInfo";

function userQueries(fastify: FastifyInstance, client: PrismaClient) {
  return {
    //Get all users in DB
    getManyUser: async function () {
      let User;
      try {
        User = await client.user.findMany();
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table User"
        );
      }
      return User;
    },

    //Get user by Id or by email
    getUser: async function (userId?: number, email?: string) {
      let user;
      try {
        user = await client.user.findUnique({
          where: { id: userId, email: email },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "Database Fetch Error on Table User"
        );
      }
      return user;
    },

    //Create user
    createUser: async function (userInfo: UserInfo) {
      try {
        await client.user.create({
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
          "Database Create Error on Table User"
        );
      }
    },

    //Update user by Id
    updateUser: async function (userId: number, userInfo: UserInfo) {
      try {
        await client.user.update({
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
          "Database Update Error on Table User"
        );
      }
    },

    //Delete user by Id
    deleteUser: async function (userId: number) {
      try {
        await fastify.prisma.client.user.delete({
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
          "Database Fetch Error on Table User"
        );
      }
    },
  };
}

export default userQueries;
