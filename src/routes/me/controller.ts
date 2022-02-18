import { FastifyInstance } from "fastify";

//Get user by id
export async function getMe(fastify: FastifyInstance, userId: number) {
    //Check user id
    if (!userId) {
      throw fastify.httpErrors.badRequest("Invalid user id");
    }
  
    const user = await fastify.prisma.user.getUser(userId);
  
    //Check if user is empty
    if (!user) {
      throw fastify.httpErrors.notFound("User not found");
    }
  
    return {
      id: user.id,
      name: user.name,
      surname: user.surname,
      pseudo: user.pseudo,
      email: user.email,
      wallet: user.wallet,
      privilege: user.privilege,
    };
  }