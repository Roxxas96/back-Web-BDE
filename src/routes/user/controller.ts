import { FastifyInstance } from "fastify";
import { UserInfo } from "../../models/UserInfo";
import { hashPassword } from "../../utils/bcrypt";
import { generateRandomKey } from "../../utils/crypto";

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
  if (
    !new RegExp(
      process.env["EMAIL_REGEX"] || /^[\w\-\.]+@([\w\-]+\.)+[\w\-]{2,4}$/g
    ).test(userInfo.email)
  ) {
    throw fastify.httpErrors.badRequest("User email must be a student mail");
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

  const user = await fastify.prisma.user.getUser(userId);

  if (!user) {
    throw fastify.httpErrors.notFound("User not found");
  }

  //Update user in DB
  await fastify.prisma.user.updateUser(user.id, {
    email: userInfo.email,
    password: hashedPassword,
    name: userInfo.name,
    surname: userInfo.surname,
    pseudo: userInfo.pseudo,
    privilege: userInfo.privilege,
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

  return {
    id: user.id,
    name: user.name,
    surname: user.surname,
    pseudo: user.pseudo,
    email: user.email,
    wallet: user.wallet,
    privilege: user.privilege,
  };
}

//Get all user in DB
export async function getManyUser(
  fastify: FastifyInstance,
  limit?: number,
  offset?: number
) {
  const users = await fastify.prisma.user.getManyUser(limit || 20, offset);

  //Check if user is empty
  if (!users || !users.length) {
    throw fastify.httpErrors.notFound("No users in DB");
  }

  return users.map((val) => {
    return { pseudo: val.pseudo, id: val.id };
  });
}

//Get information on self
export async function getMe(fastify: FastifyInstance, userId: number) {
  //Check user id
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  const user = await fastify.prisma.user.getUser(userId);

  //Check if user is empty
  if (!user) {
    throw fastify.httpErrors.notFound("User not found");
  }

  return {
    id: user.id,
    name: user.name,
    surname: user.surname,
    pseudo: user.pseudo,
    email: user.email,
    wallet: user.wallet,
    privilege: user.privilege,
  };
}

//Delete user by id
export async function deleteUser(fastify: FastifyInstance, userId: number) {
  //Check user id
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  const user = await fastify.prisma.user.getUser(userId);

  if (!user) {
    throw fastify.httpErrors.notFound("User not found");
  }

  await fastify.prisma.user.deleteUser(userId);
}

export async function recoverPassword(fastify: FastifyInstance, email: string) {
  if (!email) {
    throw fastify.httpErrors.badRequest("Invalid email");
  }

  const user = await fastify.prisma.user.getUser(undefined, email);

  if (!user) {
    throw fastify.httpErrors.notFound("User not found");
  }

  const recoverToken = await generateRandomKey(
    parseInt(process.env["RECOVER_TOKEN_LENGTH"] || "32")
  );

  const recoverTokenExpiration = new Date();
  recoverTokenExpiration.setHours(
    new Date().getHours() +
      parseInt(process.env["RECOVER_TOKEN_EXPIRATION_HOURS"] || "1")
  );

  await fastify.prisma.user.updateUser(user.id, {
    recoverToken,
    recoverTokenExpiration,
  });
}
