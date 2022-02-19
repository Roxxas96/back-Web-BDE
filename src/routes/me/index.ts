import { FastifyPluginAsync } from "fastify";
import { UserWithoutPassword } from "../../models/UserInfo";
import { getMe } from "./controller";

const meRoute: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get<{
    Reply: {
      message: string;
      user: UserWithoutPassword;
    };
  }>(
    "/",
    {
      schema: {
        tags: ["user"],
        description: "Fetch info on self",
      },
    },
    async function (request, reply) {
      const userId = await fastify.auth.authenticate(request.headers);

      const user = await getMe(fastify, userId);

      return reply.status(200).send({ message: "Success", user });
    }
  );
};

export default meRoute;
