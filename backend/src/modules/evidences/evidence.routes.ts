import { FastifyInstance } from "fastify";
import authMiddleware from "../../middleware/authMiddleware";

export default function Evidence(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);

  fastify.post("/create-evidence", async (req, reply) => {
    const {
      id,
      title,
      type,
      format,
      fileUrl,
      uploadedAt,
    } = req.body as any;

    try {
      await fastify.prisma.evidence.create({
        data: {
          id,
          title,
          type,
          format,
          fileUrl,
          uploadedAt: new Date(uploadedAt),
          userId: req.userId
        }
      });
      reply.status(201).send({ message: "Evidence created successfully" });
    } catch (error) {
      console.error("Error creating evidence:", error);
      reply.status(500).send({ error: "Failed to create evidence" });
    }
  });

  fastify.get("/get-evidences", async (req, reply) => {
    try {
      const evidences = await fastify.prisma.evidence.findMany({
        where: { userId: req.userId }
      });
      reply.send(evidences);
    } catch (error) {
      console.error("Error fetching evidences:", error);
      reply.status(500).send({ error: "Failed to fetch evidences" });
    }
  });

  fastify.delete("/delete-evidence/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await fastify.prisma.evidence.delete({
        where: { id, userId: req.userId }
      });
      return reply.send({ message: "Deleted successfully" });
    } catch (error) {
      console.error("Error deleting evidence:", error);
      return reply.status(500).send({ error: "Failed to delete evidence" });
    }
  });
}