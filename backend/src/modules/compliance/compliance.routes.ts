import { FastifyInstance } from "fastify";
import authMiddleware from "../../middleware/authMiddleware";

export default function Compliance(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);

  fastify.post("/create-assessment", async (req, reply) => {
    const  {
      id,
      name,
      frameworkId,
      project,
      author,
      status,
      progress,
      lastUpdated,
    } = req.body as any;

    try {
      await fastify.prisma.complianceAssessment.create({
        data: {
          id,
          name,
          frameworkId,
          project,
          author,
          status,
          progress,
          lastUpdated: new Date(lastUpdated),
          userId: req.userId
        }
      });
      reply.status(201).send({ message: "Assessment created successfully" });
    } catch (error) {
      console.error("Error creating complianceAssessment:", error);
      reply.status(500).send({ error: "Failed to create complianceAssessment" });
    }
  });

  fastify.get("/get-assessments", async (req, reply) => {
    try {
      const internalAssessments = await fastify.prisma.complianceAssessment.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: "desc" },
      });
      reply.send(internalAssessments);
    } catch (error) {
      console.error("Error fetching internalAssessments:", error);
      reply.status(500).send({ error: "Failed to fetch internalAssessments" });
    }
  });

  fastify.put("/update-assessment/:id", async (req, reply) => {
    const  {
      name,
      frameworkId,
      project,
      author,
      status,
      progress,
      lastUpdated,
    } = req.body as any;
    const { id } = req.params as { id: string };

    try {
      await fastify.prisma.complianceAssessment.update({
        where: { id, userId: req.userId },
        data: {
          name,
          frameworkId,
          project,
          author,
          status,
          progress,
          lastUpdated: new Date(lastUpdated),
        }
      });
      reply.status(201).send({ message: "Assessment updated successfully" });
    } catch (error) {
      console.error("Error updating complianceAssessment:", error);
      reply.status(500).send({ error: "Failed to update complianceAssessment" });
    }
  });

  fastify.post("/create-audit", async (req, reply) => {
    const  {
      id,
      name,
      frameworkId,
      project,
      author,
      status,
      progress,
      lastUpdated,
    } = req.body as any;

    try {
      await fastify.prisma.complianceAudit.create({
        data: {
          id,
          name,
          frameworkId,
          project,
          author,
          status,
          progress,
          lastUpdated: new Date(lastUpdated),
          userId: req.userId
        }
      });
      reply.status(201).send({ message: "Assessment created successfully" });
    } catch (error) {
      console.error("Error creating complianceAssessment:", error);
      reply.status(500).send({ error: "Failed to create complianceAssessment" });
    }
  });

  fastify.get("/get-audits", async (req, reply) => {
    try {
      const complianceAudit = await fastify.prisma.complianceAudit.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: "desc" },
      });
      reply.send(complianceAudit);
    } catch (error) {
      console.error("Error fetching internalAssessments:", error);
      reply.status(500).send({ error: "Failed to fetch internalAssessments" });
    }
  });

  fastify.put("/update-audit/:id", async (req, reply) => {
    const  {
      name,
      frameworkId,
      project,
      author,
      status,
      progress,
      lastUpdated,
    } = req.body as any;
    const { id } = req.params as { id: string };

    try {
      await fastify.prisma.complianceAudit.update({
        where: { id, userId: req.userId },
        data: {
          name,
          frameworkId,
          project,
          author,
          status,
          progress,
          lastUpdated: new Date(lastUpdated),
        }
      });
      reply.status(201).send({ message: "Assessment updated successfully" });
    } catch (error) {
      console.error("Error updating complianceAssessment:", error);
      reply.status(500).send({ error: "Failed to update complianceAssessment" });
    }
  });

  fastify.post("/save-findings", async (req, reply) => {
    const {
      nodeId,
      controlId,
      status,
      observation,
      mitigations,
      manualMitigations,
      evidenceCount,
      evidence,
      assessmentId,
      auditId
    } = req.body as any;
  
    try {
      const result = await fastify.prisma.findings.upsert({
        where: {
          nodeId_controlId: {
            nodeId,
            controlId
          }
        },
        update: {
          status,
          observation,
          mitigations,
          manualMitigations,
          evidenceCount,
          evidence,
          assessmentId,
          auditId
        },
        create: {
          nodeId,
          controlId,
          status,
          observation,
          mitigations,
          manualMitigations,
          evidenceCount,
          evidence,
          assessmentId,
          auditId
        }
      });
  
      reply.send(result);
    } catch (err) {
      console.error(err);
      reply.status(500).send({ error: "Failed to save finding" });
    }
  });

  fastify.get("/get-findings/:nodeId/:controlId", async (req, reply) => {
    const { nodeId, controlId } = req.params as { nodeId: string; controlId: string };
  
    try {
      const finding = await fastify.prisma.findings.findUnique({
        where: {
          nodeId_controlId: {
            nodeId,
            controlId
          }
        }
      });
  
      if (!finding) return reply.send({ error: "Finding not found" });
  
      reply.send(finding);
    } catch (err) {
      console.error(err);
      reply.status(500).send({ error: "Failed to fetch finding" });
    }
  });

  fastify.get("/get-findings", async (req, reply) => {  
    try {
      const findings = await fastify.prisma.findings.findMany();
      reply.send(findings);
    } catch (err) {
      console.error(err);
      reply.status(500).send({ error: "Failed to fetch findings" });
    }
  });
}