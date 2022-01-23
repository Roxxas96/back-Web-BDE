import { FastifyInstance } from "fastify";
import { UserInfo } from "../../models/UserInfo";
import { hashPassword } from "../../utils/bcrypt";

//Update user with provided info by id
export async function modifyUser(
  fastify: FastifyInstance,
  userId: number,
  userInfo: UserInfo
) {
  //Check uesr id
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  //Check user info
  if (!userInfo) {
    throw fastify.httpErrors.badRequest("No user info provided");
  }

  //Check user email
  if (!userInfo.email) {
    throw fastify.httpErrors.badRequest("No email provided");
  }

  //Check if mail match synthax
  if (userInfo.email && !/\@.*umontpellier\.fr/g.test(userInfo.email)) {
    throw fastify.httpErrors.badRequest(
      "User email must be from umontpellier.fr"
    );
  }

  //Check user password
  if (!userInfo.password) {
    throw fastify.httpErrors.badRequest("No password provided");
  }

  //Check password length
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

//Create user with provided info
export async function createUser(fastify: FastifyInstance, userInfo: UserInfo) {
  //Check user info
  if (!userInfo) {
    throw fastify.httpErrors.badRequest("No user info provided");
  }

  //Check email
  if (!userInfo.email) {
    throw fastify.httpErrors.badRequest("No email provided");
  }

  //Check if mail match synthax
  if (
    userInfo.email &&
    !new RegExp(
      process.env["EMAIL_REGEX"] || /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g
    ).test(userInfo.email)
  ) {
    throw fastify.httpErrors.badRequest(
      "User email must match your student email domain"
    );
  }

  //Check password
  if (!userInfo.password) {
    throw fastify.httpErrors.badRequest("No password provided");
  }

  //Check password length
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

//Get user by id
export async function getUser(fastify: FastifyInstance, userId: number) {
  //Check user id
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  const user = await fastify.prisma.user.getUser(userId);

  //Check if user is empty
  if (!user) {
    throw fastify.httpErrors.notFound("User not found");
  }

  return user;
}

//Get all user in DB
export async function getManyUser(fastify: FastifyInstance) {
  const users = await fastify.prisma.user.getManyUser();

  //Check if user is empty
  if (!users || !users.length) {
    throw fastify.httpErrors.notFound("No users in DB");
  }

  return users.map((val) => {
    return { pseudo: val.pseudo };
  });
}

//Delete user by id
export async function deleteUser(fastify: FastifyInstance, userId: number) {
  //Check user id
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  await fastify.prisma.user.deleteUser(userId);
}
