import { FastifyInstance } from "fastify";
import authMiddleware from "../../middleware/authMiddleware";

export default function frameworkRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);

  fastify.post("/create-framework", async (req, reply) => {
    const { id, name, description, isCustom, totalControls, version } = req.body as any;
    try {
      await fastify.prisma.framework.create({
        data: {
          id,
          name,
          description,
          isCustom,
          totalControls,
          version,
          userId: req.userId
        }
      });
    } catch (error) {
      console.error("Error creating framework:", error);
      reply.status(500).send({ error: "Failed to create framework" });
    }
  });

  fastify.get("/get-frameworks", async (req, reply) => {
    console.log("Framework create userId:", req.userId);
    try {
      const frameworks = await fastify.prisma.framework.findMany({
        where: { userId: req.userId }
      });
      console.log("Current userId:", req);
      reply.send(frameworks);
    } catch (error) {
      console.error("Error fetching frameworks:", error);
      reply.status(500).send({ error: "Failed to fetch frameworks" });
    }
  });

  fastify.delete("/delete-framework/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await fastify.prisma.framework.delete({
        where: { id, userId: req.userId }
      });
      return reply.send({ message: "Deleted successfully" });
    } catch (error) {
      console.error("Error deleting framework:", error);
      return reply.status(500).send({ error: "Failed to delete framework" });
    }
  });

  fastify.post("/create-requirement", async (req, reply) => {
    const {
      name,
      description,
      owner,
      frequency,
      frameworkId,
      frameworks,
      controlSchema,
      customValues
    } = req.body as any;

    try {
      await fastify.prisma.requirement.create({
        data: {
          name,
          description,
          owner,
          frequency,
          frameworkId,
          frameworks,
          controlSchema,
          customValues
        }
      });
    } catch (error) {
      console.error("Error creating requirement:", error);
      return reply.status(500).send({ error: "Failed to create requirement" });
    }

    reply.send({ message: "Requirement created successfully" });
  });

  fastify.put("/update-requirement", async (req, reply) => {
    const {
      id,
      name,
      description,
      owner,
      frequency,
      frameworkId,
      frameworks,
      controlSchema,
      customValues
    } = req.body as any;

    try {
      await fastify.prisma.requirement.update({
        where: { id, frameworkId },
        data: {
          name,
          description,
          owner,
          frequency,
          frameworkId,
          frameworks,
          controlSchema,
          customValues
        }
      });
    } catch (error) {
      console.error("Error updating requirement:", error);
      return reply.status(500).send({ error: "Failed to update requirement" });
    }

    reply.send({ message: "Requirement updated successfully" });
  });

  fastify.delete("/delete-requirement", async (req, reply) => {
    const { id, frameworkId } = req.query as any;
    try {
      await fastify.prisma.requirement.delete({
        where: { id, frameworkId }
      });
      return reply.send({ message: "Deleted successfully" });
    } catch (error) {
      console.error("Error deleting requirement:", error);
      return reply.status(500).send({ error: "Failed to delete requirement" });
    }
  });

  fastify.get("/get-requirements", async (req, reply) => {
    try {
      const requirements = await fastify.prisma.requirement.findMany();
      reply.send(requirements);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      return reply.status(500).send({ error: "Failed to fetch requirements" });
    }
  });
}