import fp from "fastify-plugin";
import * as mailer from "nodemailer";
import SMTPTransport = require("nodemailer/lib/smtp-transport");

/**
 * This plugins adds some utilities to handle http errors
 *
 * @see https://github.com/fastify/fastify-sensible
 */
export default fp(async (fastify, opts) => {
  if (!process.env["MAILER_USER"] || !process.env["MAILER_PASSWORD"]) {
    fastify.log.error(
      "Please specify a mailer username and password in environment"
    );

    process.exit(1);
  }

  const client = mailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env["MAILER_USER"],
      pass: process.env["MAILER_PASSWORD"],
    },
  });

  fastify.decorate("mailer", client);
});

declare module "fastify" {
  export interface FastifyInstance {
    mailer: mailer.Transporter<SMTPTransport.SentMessageInfo>;
  }
}
