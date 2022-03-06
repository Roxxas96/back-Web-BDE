import fp from "fastify-plugin";
import swagger from "fastify-swagger";
import { ChallengeSchema } from "../models/ChallengeInfo";
import { GoodiesSchema } from "../models/GoodiesInfo";
import { CreateUserSchema } from "../models/UserInfo";

export interface SwaggerPluginOptions {
  // Specify Support plugin options here
}

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<SwaggerPluginOptions>(async (fastify, opts) => {
  fastify.register(swagger, {
    routePrefix: "/doc",
    swagger: {
      info: {
        title: "Web BDE Swagger",
        description: "Documentation for the Web BDE application",
        version: "0.1.0",
      },
      externalDocs: {
        url: "https://swagger.io",
        description: "Find more info here",
      },
      host: process.env["API_HOST"] || "localhost:4000",
      schemes: ["http"],
      consumes: ["application/json", "form/multipart"],
      produces: ["application/json", "multipart/mixed"],
      tags: [
        { name: "user", description: "User related end-points" },
        {
          name: "session",
          description: "End-points related to user connection",
        },
        { name: "challenge", description: "Challenge related end-points" },
        {
          name: "accomplishment",
          description: "End-points related to challenge accomplishment",
        },
        { name: "goodies", description: "Goodies related end-points" },
        {
          name: "purchase",
          description: "End-points related to goodies purchase",
        },
        { name: "admin", description: "Admin (or greater) only end-points" },
        { name: "super admin", description: "Super admin only end-points" },
      ],
      definitions: {
        User: CreateUserSchema,
        Challenge: ChallengeSchema,
        Goodies: GoodiesSchema,
      },
      securityDefinitions: {
        apiKey: {
          type: "apiKey",
          name: "Authorization",
          in: "header",
        },
      },
      security: [{ apiKey: [] }],
    },
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next();
      },
      preHandler: function (request, reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    exposeRoute: true,
  });
});

// When using .decorate you have to specify added properties for Typescript
declare module "fastify" {
  export interface FastifyInstance {}
}
