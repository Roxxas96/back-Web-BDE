import { FastifyInstance } from "fastify";
import { IncomingHttpHeaders } from "http";

//Impor ustils
import { comparePassword } from "../../utils/bcrypt";
import { createJWT } from "../../utils/jwt";
import { hashJWT } from "../../utils/crypto";
import { UserInfoMinimal } from "../../models/UserInfo";

export async function deleteSession(
  fastify: FastifyInstance,
  headers: IncomingHttpHeaders
) {
  //Check for empty headers
  if (!headers.authorization) {
    throw fastify.httpErrors.internalServerError("No token provided");
  }

  const token = headers.authorization.replace("Bearer ", "");

  //Check for empty token
  if (token.length <= 0) {
    throw fastify.httpErrors.internalServerError("No token provided");
  }

  //Hash token
  const hashedToken = hashJWT(token);

  const tokenInDB = await fastify.prisma.session.getSession(
    undefined,
    hashedToken
  );

  if (!tokenInDB) {
    throw fastify.httpErrors.notFound("Session not found");
  }

  //Delete Session in DB
  return await fastify.prisma.session.deleteSession(undefined, hashedToken);
}

export async function createSession(
  fastify: FastifyInstance,
  userInfo: { email: string; password: string }
) {
  //Check email
  if (!userInfo.email) {
    throw fastify.httpErrors.badRequest("No email provided");
  }

  //Check password
  if (!userInfo.password) {
    throw fastify.httpErrors.badRequest("No password provided");
  }

  //Fetch user
  const user = await fastify.prisma.user.getUser(undefined, userInfo.email);
  if (!user) {
    throw fastify.httpErrors.notFound("User not found");
  }

  //Check passwords match
  if (!(await comparePassword(userInfo.password, user.password))) {
    throw fastify.httpErrors.badRequest("Wrong password");
  }

  //Sign JWT with user id
  const token = await createJWT({ id: user.id });
  if (!token) {
    fastify.log.error("Got undefined token on jwt creation");
    throw fastify.httpErrors.internalServerError("Token creation error");
  }

  //Hash JWT
  const hashedToken = hashJWT(token);

  //Create session in DB
  await fastify.prisma.session.createSession(hashedToken, user.id);

  return {
    token,
  };
}

export async function getSession(fastify: FastifyInstance, sessionId: number) {
  //Check session id
  if (!sessionId) {
    throw fastify.httpErrors.badRequest("Invalid session id");
  }

  const session = await fastify.prisma.session.getSession(sessionId);

  //Check if session not found
  if (!session) {
    throw fastify.httpErrors.notFound("Session not found");
  }

  const user = await fastify.prisma.user.getUser(session.userId);

  return {
    ...session,
    user: user
      ? ({ id: user.id, pseudo: user.pseudo } as UserInfoMinimal)
      : undefined,
    userId: user ? undefined : session.userId,
  };
}

export async function getManySession(
  fastify: FastifyInstance,
  limit?: number,
  offset?: number,
  userId?: number
) {
  const sessions = await fastify.prisma.session.getManySession(
    limit || 20,
    offset,
    userId
  );

  //Check if session DB empty
  if (!sessions) {
    throw fastify.httpErrors.notFound("No Session in DB");
  }

  return await Promise.all(
    sessions.map(async (session) => {
      const user = await fastify.prisma.user.getUser(session.userId);

      return {
        ...session,
        user: user
          ? ({ id: user.id, pseudo: user.pseudo } as UserInfoMinimal)
          : undefined,
        userId: user ? undefined : session.userId,
      };
    })
  );
}
