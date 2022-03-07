import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { CreateUserInfo } from "../../models/UserInfo";

function userQueries(fastify: FastifyInstance, client: PrismaClient) {
  return {
    //Get all users in DB
    getManyUser: async function (limit: number, offset?: number) {
      try {
        return await client.user.findMany({
          take: limit,
          skip: offset,
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Get user by Id or by email
    getUser: async function (
      userId?: number,
      email?: string,
      recoverToken?: string
    ) {
      try {
        return await client.user.findUnique({
          where: { id: userId, email, recoverToken },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Create user
    createUser: async function (userInfo: CreateUserInfo) {
      try {
        return await client.user.create({
          data: userInfo,
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Update user by Id
    updateUser: async function (
      userId: number,
      userInfo: {
        email?: string;
        password?: string;
        pseudo?: string;
        name?: string;
        surname?: string;
        privilege?: number;
        wallet?: number;
        recoverToken?: string | null;
        recoverTokenExpiration?: Date | null;
      }
    ) {
      try {
        return await client.user.update({
          where: { id: userId },
          data: userInfo,
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },

    //Delete user by Id
    deleteUser: async function (userId: number) {
      try {
        return await fastify.prisma.client.user.delete({
          where: { id: userId },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError(
          "There was an error with the Database, please try again"
        );
      }
    },
  };
}

export default userQueries;
