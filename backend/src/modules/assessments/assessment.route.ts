import { FastifyInstance } from "fastify";
import authMiddleware from "../../middleware/authMiddleware";

export default function Assessment(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);

  fastify.post("/create-assessment", async (req, reply) => {

    const user = await fastify.prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    const {
      id,
      name,
      description,
      version,
      status,
      riskMatrix,
      authors,
      reviewers,
      dueDate,
      targetDate,
      owner,
      progress,
      lastUpdated
    } = req.body as any;
    
    try {
      const newAssessment = await fastify.prisma.assessment.create({
        data: {
          id,
          name,
          description,
          version,
          status,
          riskMatrix,
          authors,
          reviewers,
          dueDate: new Date(dueDate),
          targetDate: new Date(targetDate),
          owner,
          progress,
          lastUpdated: new Date(lastUpdated),
          userId: req.userId,
        },
      });

      await fastify.prisma.globalStats.upsert({
        where: { id: "GLOBAL_STATS" },
        update: {
          totalAssessments: {
            increment: 1,
          }
        },
        create: {
          id: "GLOBAL_STATS",
          totalAssessments: 1,
        }
      });

      reply.send(newAssessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      reply.status(500).send({ error: "Failed to create assessment" });
    }
  });

  fastify.put("/update-assessment", async (req, reply) => {
    const {
      id,
      name,
      status,
      riskMatrix,
      description,
      targetDate
    } = req.body as any;
    await fastify.prisma.assessment.update({
      where: { id, userId: req.userId },
      data: {
        name,
        status,
        riskMatrix,
        description,
        targetDate: new Date(targetDate),
        lastUpdated: new Date()
      }
    })
  });

  fastify.get("/get-assessments", async (req, reply) => {
    try {
      const assessments = await fastify.prisma.assessment.findMany({
        where: {
          userId: req.userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          risksInScope: true,
        }
      });
      reply.send(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      reply.status(500).send({ error: "Failed to fetch assessments" });
    }
  });

  fastify.delete("/delete-assessment/:id", async (req, reply) => {
    const { id } = req.params as any;
    try {
      await fastify.prisma.assessment.delete({
        where: { id, userId: req.userId },
      });
      console.log("Assessment deleted successfully.");
      reply.send({ message: "Assessment deleted successfully" });
    } catch (error) {
      console.error("Error deleting assessment:", error);
      reply.status(500).send({ error: "Failed to delete assessment" });
    }
  });

  fastify.post("/create-risk", async (req, reply) => {
    const {
      id,
      category,
      customAssets,
      customControls,
      description,
      inherentImpact,
      inherentLikelihood,
      inherentScore,
      linkedAssets,
      linkedControls,
      owner,
      residualImpact,
      residualLikelihood,
      residualScore,
      status,
      title,
      assessmentId
    } = req.body as any;

    try {
      const newRisk = await fastify.prisma.risk.create({
        data: {
          id,
          category,
          customAssets,
          customControls,
          description,
          inherentImpact,
          inherentLikelihood,
          inherentScore,
          linkedAssets,
          linkedControls,
          owner,
          residualImpact,
          residualLikelihood,
          residualScore,
          status,
          title,
          assessment: {
            connect: { id: assessmentId }
          },
        },
      });
      reply.send(newRisk);
    } catch (error) {
      console.error("Error creating risk:", error);
      reply.status(500).send({ error: "Failed to create risk" });
    }
  });

  fastify.put("/update-risk", async (req, reply) => {
    const {
      category,
      customAssets,
      customControls,
      description,
      inherentImpact,
      inherentLikelihood,
      inherentScore,
      linkedAssets,
      linkedControls,
      owner,
      residualImpact,
      residualLikelihood,
      residualScore,
      status,
      title,
      assessmentId
    } = req.body as any;

    const { id } = req.query as any;

    try {
      const newRisk = await fastify.prisma.risk.update({
        where: { id },
        data: {
          category,
          customAssets,
          customControls,
          description,
          inherentImpact,
          inherentLikelihood,
          inherentScore,
          linkedAssets,
          linkedControls,
          owner,
          residualImpact,
          residualLikelihood,
          residualScore,
          status,
          title,
          assessment: {
            connect: { id: assessmentId }
          },
        },
      });
      reply.send(newRisk);
    } catch (error) {
      console.error("Error creating risk:", error);
      reply.status(500).send({ error: "Failed to create risk" });
    }
  });

  fastify.delete("/delete-risk/:id", async (req, reply) => {
    const { id } = req.params as any;
    try {
      await fastify.prisma.risk.delete({
        where: { id },
      });
      console.log("Risk deleted successfully.");
      reply.send({ message: "Risk deleted successfully" });
    } catch (error) {
      console.error("Error deleting risk:", error);
      reply.status(500).send({ error: "Failed to delete risk" });
    }
  });

  fastify.get("/get-risks/:assessmentId", async (req, reply) => {
    const { assessmentId } = req.params as any;

    try {
      const risks = await fastify.prisma.risk.findMany({
        where: {
          assessmentId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      reply.send(risks);
    } catch (error) {
      console.error("Error fetching risks:", error);
      reply.status(500).send({ error: "Failed to fetch risks" });
    }
  });

  fastify.get("/get-risks", async (req, reply) => {
    try {
      const risks = await fastify.prisma.risk.findMany({
        where: {
          assessment: {
            userId: req.userId,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      reply.send(risks);
    } catch (error) {
      console.error("Error fetching risks:", error);
      reply.status(500).send({ error: "Failed to fetch risks" });
    }
  });
}