import { IncomingHttpHeaders } from "http";
import fp from "fastify-plugin";

import { getPayload } from "../utils/jwt";
import { hashJWT } from "../utils/crypto";

export interface AuthenticationPluginOptions {
  // Specify Support plugin options here
}

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<AuthenticationPluginOptions>(async (fastify, opts) => {
  const auth = {
    authenticate: async function (headers: IncomingHttpHeaders) {
      //Check for empty headers
      if (!headers.authorization) {
        throw fastify.httpErrors.unauthorized("No token provided");
      }

      const token = headers.authorization.replace("Bearer ", "");

      console.log(token.length);

      //Check for empty token
      if (!token) {
        throw fastify.httpErrors.unauthorized("No token provided");
      }

      console.log(token);

      const payload: { id: number } | undefined = await getPayload(token);

      //Check if token is valid eq. it contains a userId
      if (!payload || !payload.id) {
        throw fastify.httpErrors.unauthorized("Token invalid");
      }

      //Hash token
      const hashedToken = hashJWT(token);

      const session = await fastify.prisma.session.getSession(
        undefined,
        hashedToken
      );

      //Check if session is empty or userId doesn't match
      if (!session || session.userId !== payload.id) {
        throw fastify.httpErrors.unauthorized("Token Invalid");
      }

      return payload.id;
    },
    authorize: async function (userId: number, requiredPrivilege: 1 | 2) {
      if (requiredPrivilege < 1 || requiredPrivilege > 2) {
        fastify.httpErrors.internalServerError("Privilege error");
      }

      const user = await fastify.prisma.user.getUser(userId);

      //Check if no user found
      if (!user) {
        throw fastify.httpErrors.forbidden("User not found");
      }

      //Check if have enought privilege
      if (user.privilege < requiredPrivilege) {
        throw fastify.httpErrors.forbidden("Not enought privilege");
      }
    },
    getPrivilege: async function (userId: number) {
      const user = await fastify.prisma.user.getUser(userId);

      //Check if no user found
      if (!user) {
        throw fastify.httpErrors.forbidden("User not found");
      }

      return user.privilege;
    },
  };

  fastify.decorate("auth", auth);
});

// When using .decorate you have to specify added properties for Typescript
declare module "fastify" {
  export interface FastifyInstance {
    auth: {
      authenticate: (headers: IncomingHttpHeaders) => Promise<number>;
      authorize: (userId: number, requiredPrivilege: 1 | 2) => Promise<void>;
      getPrivilege: (userId: number) => Promise<number>;
    };
  }
}
