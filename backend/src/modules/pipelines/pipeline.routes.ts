import { FastifyInstance } from "fastify";
import authMiddleware from "../../middleware/authMiddleware";

export default function Pipeline(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);

  fastify.post("/create-project", async (req, reply) => {
    const {
      id,
      name,
      key,
      description,
      owner,
      startDate,
      endDate,
    } = req.body as any;

    try {
      await fastify.prisma.project.create({
        data: {
          id,
          name,
          key,
          description,
          owner,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          userId: req.userId
        }
      });
    } catch (error) {
      console.error("Error creating pipeline project:", error);
      reply.status(500).send({ error: "Failed to create pipeline project" });
    }
  });

  fastify.put("/update-project/:id", async (req, reply) => {
    const { id } = req.params as any;
    const {
      name,
      key,
      description,
      owner,
      startDate,
      endDate,
    } = req.body as any;

    try {
      await fastify.prisma.project.update({
        where: { id, userId: req.userId },
        data: {
          name,
          key,
          description,
          owner,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        }
      });
      reply.send({ message: "Pipeline project updated successfully" });
    } catch (error) {
      console.error("Error updating pipeline project:", error);
      reply.status(500).send({ error: "Failed to update pipeline project" });
    }
  });

  fastify.delete("/delete-project/:id", async (req, reply) => {
    const { id } = req.params as any;

    try {
      await fastify.prisma.project.delete({
        where: { id, userId: req.userId }
      });
      reply.send({ message: "Pipeline project deleted successfully" });
    } catch (error) {
      console.error("Error deleting pipeline project:", error);
      reply.status(500).send({ error: "Failed to delete pipeline project" });
    }
  });

  fastify.get("/get-projects", async (req, reply) => {
    try {
      const projects = await fastify.prisma.project.findMany({
        where: { userId: req.userId }
      });
      reply.send(projects);
    } catch (error) {
      console.error("Error fetching pipeline projects:", error);
      reply.status(500).send({ error: "Failed to fetch pipeline projects" });
    }
  });

  fastify.post("/create-task", async (req, reply) => {
    const {
      id,
      projectId,
      title,
      description,
      severity,
      stage,
      owner,
      progress,
      startDate,
      dueDate,
    } = req.body as any;

    try {
      await fastify.prisma.task.create({
        data: {
          id,
          projectId,
          title,
          description,
          severity,
          stage,
          owner,
          progress,
          startDate: new Date(startDate),
          dueDate: new Date(dueDate),
        }
      });
    } catch (error) {
      console.error("Error creating pipeline task:", error);
      reply.status(500).send({ error: "Failed to create pipeline task" });      
    }
  });

  fastify.put("/update-task/:id/:projectId", async (req, reply) => {
    const { id, projectId } = req.params as any;
    const {
      title,
      description,
      severity,
      stage,
      startDate,
      dueDate,
    } = req.body as any;

    try {
      await fastify.prisma.task.update({
        where: { id, projectId },
        data: {
          title,
          description,
          severity,
          stage,
          startDate: new Date(startDate),
          dueDate: new Date(dueDate),
        }
      });
      reply.send({ message: "Pipeline task updated successfully" });
    } catch (error) {
      console.error("Error updating pipeline task:", error);
      reply.status(500).send({ error: "Failed to update pipeline task" });
    }
  });

  fastify.delete("/delete-task/:id/:projectId", async (req, reply) => {
    const { id, projectId } = req.params as any;

    try {
      await fastify.prisma.task.delete({
        where: { id, projectId }
      });
      reply.send({ message: "Pipeline task deleted successfully" });
    } catch (error) {
      console.error("Error deleting pipeline task:", error);
      reply.status(500).send({ error: "Failed to delete pipeline task" });
    }
  });

  fastify.get("/get-tasks", async (req, reply) => {
    try {
      const tasks = await fastify.prisma.task.findMany();
      reply.send(tasks);
    } catch (error) {
      console.error("Error fetching pipeline tasks:", error);
      reply.status(500).send({ error: "Failed to fetch pipeline tasks" });
    }
  });
}