import { FastifyInstance } from "fastify";
import authMiddleware from "../../middleware/authMiddleware";

export default function Control(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);

  fastify.post("/create-control", async (req, reply) => {
    const {
      id,
      name,
      description,
      type,
      category,
      frequency,
      link,
      tags,
      owner,
    } = req.body as any;

    try {
      await fastify.prisma.control.create({
        data: {
          id,
          name,
          description,
          type,
          category,
          frequency,
          link,
          tags,
          owner,
          userId: req.userId
        }
      });
      reply.send({ message: "Control created successfully" });
    } catch (error) {
      console.error("Error creating control:", error);
      reply.status(500).send({ error: "Failed to create control" });
    }
  });

  fastify.get("/get-controls", async (req, reply) => {
    try {
      const controls = await fastify.prisma.control.findMany({
        where: { userId: req.userId }
      });
      reply.send(controls);
      console.log("Current userId:", req.userId);
    } catch (error) {
      console.error("Error fetching controls:", error);
      reply.status(500).send({ error: "Failed to fetch controls" });
    }
  });
}