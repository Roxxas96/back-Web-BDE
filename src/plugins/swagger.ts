import fp from "fastify-plugin";
import swagger from "fastify-swagger";

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
      host: "localhost",
      schemes: ["http"],
      consumes: ["application/json"],
      produces: ["application/json"],
      tags: [
        { name: "user", description: "User related end-points" },
        { name: "challenge", description: "Challenge related end-points" },
        { name: "goodies", description: "Goodies related end-points" },
      ],
      definitions: {
        User: {
          type: "object",
          required: ["id", "email", "password"],
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            surname: { type: "string" },
            pseudo: { type: "string" },
            email: { type: "string", format: "student email" },
            password: { type: "string", format: "password" },
            privilege: { type: "number" },
            wallet: { type: "number" },
          },
        },
        Challenge: {
          type: "object",
          required: ["id", "creatorId"],
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            description: { type: "string" },
            reward: { type: "number" },
            creatorId: { type: "number" },
            createdAt: { type: "date" },
          },
        },
        Goodies: {
          type: "object",
          required: ["id", "creatorId"],
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            description: { type: "string" },
            image: { type: "string" },
            price: { type: "number" },
            buyLimit: { type: "number" },
            creatorId: { type: "number" },
            createdAt: { type: "date" },
          },
        },
      },
      securityDefinitions: {
        apiKey: {
          type: "apiKey",
          name: "apiKey",
          in: "header",
        },
      },
    },
    uiConfig: {
      docExpansion: "full",
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
