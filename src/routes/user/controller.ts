import { FastifyInstance } from "fastify";
import { UserInfo } from "../../models/UserInfo";
import { hashPassword } from "../../utils/bcrypt";

export async function modifyUser(
  fastify: FastifyInstance,
  userId: number,
  userInfo: UserInfo
) {
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  if (!userInfo.email) {
    throw fastify.httpErrors.badRequest("No email provided");
  }

  //Check if mail match synthax
  if (userInfo.email && !/\@.*umontpellier\.fr/g.test(userInfo.email)) {
    throw fastify.httpErrors.badRequest(
      "User email must be from umontpellier.fr"
    );
  }

  if (!userInfo.password) {
    throw fastify.httpErrors.badRequest("No password provided");
  }

  if (userInfo.password.length < 8) {
    throw fastify.httpErrors.badRequest("User password is too small");
  }

  //Hash password
  const hashedPassword = await hashPassword(userInfo.password);

  if (!hashedPassword) {
    fastify.log.error("Error : hashed password empty on modify user");
    throw fastify.httpErrors.internalServerError("Password hash Error");
  }

  //Update user in DB
  await fastify.prisma.user.updateUser(userId, {
    email: userInfo.email,
    password: hashedPassword,
    name: userInfo.name,
    surname: userInfo.surname,
    pseudo: userInfo.pseudo,
  });
}

export async function createUser(fastify: FastifyInstance, userInfo: UserInfo) {
  if (!userInfo.email) {
    throw fastify.httpErrors.badRequest("No email provided");
  }

  //Check if mail match synthax
  if (userInfo.email && !/\@.*umontpellier\.fr/g.test(userInfo.email)) {
    throw fastify.httpErrors.badRequest(
      "User email must be from umontpellier.fr"
    );
  }

  if (!userInfo.password) {
    throw fastify.httpErrors.badRequest("No password provided");
  }

  if (userInfo.password.length < 8) {
    throw fastify.httpErrors.badRequest("User password is too small");
  }

  //Hash password
  const hashedPassword = await hashPassword(userInfo.password);

  if (!hashedPassword) {
    fastify.log.error("Error : hashed password empty on modify user");
    throw fastify.httpErrors.internalServerError("Password hash Error");
  }

  //Create user in DB
  await fastify.prisma.user.createUser({
    email: userInfo.email,
    password: hashedPassword,
    name: userInfo.name,
    surname: userInfo.surname,
    pseudo: userInfo.pseudo,
  });
}

export async function getUser(fastify: FastifyInstance, userId: number) {
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  const user = await fastify.prisma.user.getUser(userId);

  if (!user) {
    throw fastify.httpErrors.notFound("User not found");
  }

  return user;
}

export async function getUsers(fastify: FastifyInstance) {
  const users = await fastify.prisma.user.getUsers();

  if (!users || !users.length) {
    throw fastify.httpErrors.notFound("No users in DB");
  }

  return users.map((val) => {
    return { pseudo: val.pseudo };
  });
}

export async function deleteUser(fastify: FastifyInstance, userId: number) {
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  await fastify.prisma.user.deleteUser(userId);
}
