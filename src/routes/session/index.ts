import { sessions } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";

import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";

const sessionRoute: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get<{ Reply: sessions[] }>("/", async function (request, reply) {
    let sessions;
    try {
      sessions = await fastify.prisma.sessions.findMany();
    } catch (err) {
      fastify.log.error(err);
      throw fastify.httpErrors.internalServerError("Database fetch Error");
    }
    return reply.status(200).send(sessions);
  });

  fastify.get<{ Params: { id: string }; Reply: sessions }>(
    "/:id",
    async function (request, reply) {
      let session;
      try {
        session = await fastify.prisma.sessions.findUnique({
          where: { id: parseInt(request.params.id) },
        });
      } catch (err) {
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError("Database fetch Error");
      }
      if (!session) {
        throw fastify.httpErrors.notFound("Session not found");
      }
      return reply.status(200).send(session);
    }
  );

  fastify.put<{
    Body: { email: string; password: string };
    Reply: { message: string; token: string };
  }>("/", async function (request, reply) {
    let userInfo = request.body;
    //Find user with provided email
    let user;
    try {
      user = await fastify.prisma.users.findUnique({
        where: { email: userInfo.email },
      });
      if (!user) {
        throw fastify.httpErrors.notFound("User not found");
      }
    } catch (err) {
      fastify.log.error(err);
      throw fastify.httpErrors.internalServerError("Database fetch Error");
    }
    //Check passwords match
    try {
      if (!(await bcrypt.compare(userInfo.password, user.password))) {
        throw fastify.httpErrors.badRequest("Password does not match");
      }
    } catch (err) {
      fastify.log.error(err);
      throw fastify.httpErrors.internalServerError("Password hash failed");
    }
    //Sign JWT with user id
    let token;
    try {
      token = await jwt.sign(
        { id: user.id },
        process.env["JWT_TOKEN"] || "secretkey",
        { expiresIn: "15d" }
      );
      if (!token) {
        fastify.log.error("Got user id = null on jwt creation");
        throw fastify.httpErrors.internalServerError(
          "Got user id = null on jwt creation"
        );
      }
    } catch (err) {
      fastify.log.error(err);
      throw fastify.httpErrors.internalServerError("JWT creation failed");
    }
    //Hash JWT
    let hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    //Create session in DB
    try {
      await fastify.prisma.sessions.create({
        data: {
          userid: user.id,
          jwt: hashedToken,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      throw fastify.httpErrors.internalServerError("Database create Error");
    }
    return reply.status(201).send({ message: "Session created", token: token });
  });

  fastify.delete<{ Headers: { Authorization: string } }>(
    "/",
    async function (request, reply) {
      let token = request.headers.Authorization.replace("Bearer ", "");
      let hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      //Delete Session from jwt
      try {
        await fastify.prisma.sessions.delete({
          where: { jwt: hashedToken },
        });
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes("Record to delete does not exist")) {
            throw fastify.httpErrors.notFound("Session not found");
          }
        }
        fastify.log.error(err);
        throw fastify.httpErrors.internalServerError("Database fetch failed");
      }
      return reply.status(200).send("Session deleted");
    }
  );
};

export default sessionRoute;
