import { FastifyInstance } from "fastify";
import authMiddleware from "../../middleware/authMiddleware";

export default function AuditLogs(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);

  fastify.post("/create-log", async (req, reply) => {
    const {
      id,
      timestamp,
      name,
      action,
      details,
    } = req.body as any;

    try {
      const newLog = await fastify.prisma.auditLog.create({
        data: {
          id,
          timestamp,
          name,
          action,
          details,
          userId: req.userId,
        },
      });
      reply.send(newLog);
    } catch (error) {
      console.error("Error creating audit log:", error);
      reply.status(500).send({ error: "Failed to create audit log" });
    }
  });

  fastify.get("/get-logs", async (req, reply) => {
    try {
      const logs = await fastify.prisma.auditLog.findMany({
        orderBy: { timestamp: "desc" },
      });
      reply.send(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      reply.status(500).send({ error: "Failed to fetch audit logs" });
    }
  });
};