import { FastifyInstance } from "fastify";
import authMiddleware from "../../middleware/authMiddleware";

export default async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);
  
  fastify.get('/', async (request, reply) => {
    return { message: 'Welcome to the Dashboard!' };
  });
}