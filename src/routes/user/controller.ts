import { FastifyInstance } from "fastify";
import internal = require("stream");
import { CreateUserInfo, UpdateUserInfo } from "../../models/UserInfo";
import { hashPassword } from "../../utils/bcrypt";
import { generateRandomKey } from "../../utils/crypto";

//Update user with provided info by id
export async function modifyUserInfo(
  fastify: FastifyInstance,
  userId: number,
  userInfo: UpdateUserInfo
) {
  //Check uesr id
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  //Check user info
  if (!userInfo) {
    throw fastify.httpErrors.badRequest("No user info provided");
  }

  //Check if mail match synthax
  if (
    userInfo.email &&
    !new RegExp(
      process.env["EMAIL_REGEX"] || /^[\w\-\.]+@([\w\-]+\.)+[\w\-]{2,4}$/g
    ).test(userInfo.email)
  ) {
    throw fastify.httpErrors.badRequest("User email must be a student mail");
  }

  if (userInfo.pseudo && userInfo.pseudo.length < 3) {
    throw fastify.httpErrors.badRequest("Pseudo is too small");
  }

  const user = await fastify.prisma.user.getUser(userId);

  console.log(user);

  if (!user) {
    throw fastify.httpErrors.notFound("User not found");
  }

  //Update user in DB
  return await fastify.prisma.user.updateUser(user.id, {
    ...userInfo,
    totalEarnedPoints:
      userInfo.wallet || userInfo.wallet === 0
        ? user.totalEarnedPoints + (userInfo.wallet - user.wallet)
        : undefined,
  });
}

//Create user with provided info
export async function createUser(
  fastify: FastifyInstance,
  userInfo: CreateUserInfo
) {
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

  const user = await fastify.prisma.user.getUser(undefined, userInfo.email);

  if (user) {
    throw fastify.httpErrors.badRequest(
      "A user already exists with this email"
    );
  }

  //Hash password
  const hashedPassword = await hashPassword(userInfo.password);

  if (!hashedPassword) {
    fastify.log.error("Error : hashed password empty on modify user");
    throw fastify.httpErrors.internalServerError("Password hash Error");
  }

  //Create user in DB
  return await fastify.prisma.user.createUser({
    ...userInfo,
    password: hashedPassword,
  });
}

//Get user by id
export async function getUser(fastify: FastifyInstance, userId: number) {
  //Check user id
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  const { password, ...user } = await fastify.prisma.user.getUser(userId);

  //Check if user is empty
  if (!user) {
    throw fastify.httpErrors.notFound("User not found");
  }

  return {
    ...user,
    recoverToken: undefined,
    password: undefined,
    recoverTokenExpiration: undefined,
  };
}

//Get all user in DB
export async function getManyUser(
  fastify: FastifyInstance,
  limit?: number,
  offset?: number
) {
  const users = await fastify.prisma.user.getManyUser(limit || 20, offset);

  return users.map((val) => {
    return {
      ...val,
      password: undefined,
      recoverToken: undefined,
      recoverTokenExpiration: undefined,
    };
  });
}

//Get information on self
export async function getMe(fastify: FastifyInstance, userId: number) {
  //Check user id
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  const { password, ...user } = await fastify.prisma.user.getUser(userId);

  return {
    ...user,
    recoverToken: undefined,
    password: undefined,
    recoverTokenExpiration: undefined,
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

  return await fastify.prisma.user.deleteUser(userId);
}

export async function getUserCount(
  fastify: FastifyInstance,
) {
  return await fastify.prisma.user.getUserCount();
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

  await fastify.mailer.sendMail({
    from: process.env["MAILER_USER"],
    to: user.email,
    subject: "Webbde Password Recovery",
    html: `
    <h1>Webbde Password Recovery</h1>
    <p>Hello,</p>
    <p>You recently asked to recover your password, please follow this link : https://${process.env["HOST"] || "localhost:3000"
      }/recover?token=${recoverToken}</p>
    <p>This link is effective ${process.env["RECOVER_TOKEN_EXPIRATION_HOURS"] || 1
      } hour(s)</p>
    <p>Warning ! : Do not share this link with anyone else !</p>
    <p>If you didn't asked for a recovery please contact a maintainer</p>
    `,
  });
}

export async function modifyUserPassword(
  fastify: FastifyInstance,
  password: string,
  recoverToken: string
) {
  //Check password
  if (!password) {
    throw fastify.httpErrors.badRequest("No password provided");
  }

  //Check password length
  if (password.length < 8) {
    throw fastify.httpErrors.badRequest("User password is too small");
  }

  const user = await fastify.prisma.user.getUser(
    undefined,
    undefined,
    recoverToken
  );

  if (!user) {
    throw fastify.httpErrors.notFound("User not found");
  }

  if (
    !user.recoverTokenExpiration ||
    user.recoverTokenExpiration < new Date()
  ) {
    throw fastify.httpErrors.badRequest("Token has expired");
  }

  //Hash password
  const hashedPassword = await hashPassword(password);

  if (!hashedPassword) {
    fastify.log.error("Error : hashed password empty on modify user");
    throw fastify.httpErrors.internalServerError("Password hash Error");
  }

  return await fastify.prisma.user.updateUser(user.id, {
    password: hashedPassword,
    recoverToken: null,
    recoverTokenExpiration: null,
  });
}

export async function updateAvatar(
  fastify: FastifyInstance,
  avatar: internal.Readable,
  userId: number,
  userAvatarId: string
) {
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user");
  }

  if (!avatar) {
    throw fastify.httpErrors.badRequest("Invalid avatar");
  }

  const avatarId =
    userAvatarId !== "" ? userAvatarId : await generateRandomKey(48);

  if (avatarId !== userAvatarId) {
    await fastify.prisma.user.updateUser(userId, { avatarId: avatarId });
  }

  await fastify.minio.avatar.putAvatar(avatar, avatarId);

  return avatarId;
}

export async function getAvatar(fastify: FastifyInstance, avatarId: string) {
  if (!avatarId) {
    throw fastify.httpErrors.badRequest("Invalid user");
  }

  return await fastify.minio.avatar.getAvatar(avatarId);
}

export async function deleteAvatar(fastify: FastifyInstance, userId: number) {
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user");
  }

  const user = await fastify.prisma.user.getUser(userId);

  await fastify.minio.avatar.getAvatar(user.avatarId);

  return await fastify.minio.avatar.deleteAvatar(user.avatarId);
}