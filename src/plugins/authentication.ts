import fp from "fastify-plugin";

export interface AuthenticationPluginOptions {
  // Specify Support plugin options here
}

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<AuthenticationPluginOptions>(async (fastify, opts) => {});

// When using .decorate you have to specify added properties for Typescript
declare module "fastify" {
  export interface FastifyInstance {}
}
