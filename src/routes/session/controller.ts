import { FastifyInstance } from "fastify";
import { IncomingHttpHeaders } from "http";

import { comparePassword } from "../../utils/bcrypt";
import { createJWT } from "../../utils/jwt";
import { hashJWT } from "../../utils/crypto";

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

  //Delete Session in DB
  await fastify.prisma.session.deleteSession(hashedToken);
}

export async function createSession(
  fastify: FastifyInstance,
  userInfo: { email: string; password: string }
) {
  if (!userInfo.email) {
    throw fastify.httpErrors.badRequest("No email provided");
  }

  if (!userInfo.password) {
    throw fastify.httpErrors.badRequest("No password provided");
  }

  //Fetch user
  const user = await fastify.prisma.user.getUserByEMail(userInfo.email);
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

  return token;
}

export async function getSession(fastify: FastifyInstance, sessionId: number) {
  if (!sessionId) {
    throw fastify.httpErrors.badRequest("Invalid session id");
  }

  const session = await fastify.prisma.session.getSession(sessionId);

  //Check if session not found
  if (!session) {
    throw fastify.httpErrors.notFound("Session not found");
  }

  return session;
}

export async function getSessions(fastify: FastifyInstance) {
  const sessions = await fastify.prisma.session.getManySession();

  //Check if session DB empty
  if (!sessions) {
    throw fastify.httpErrors.notFound("No Sessions in DB");
  }

  return sessions;
}
