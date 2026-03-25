import { FastifyInstance } from "fastify";
import authMiddleware from "../../middleware/authMiddleware";

export default function Profile(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);

  fastify.get("/get-profile-data", async (req: any, reply: any) => {
    const userId = req.user.id;

    try {
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: true,
          _count: {
            select: {
              asset: true,
              assessment: true,
              framework: true,
              control: true,
              complianceAssessment: true,
              evidence: true,
              project: true,
              auditLog: true
            }
          }
        }
      });

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      reply.send({
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role.name,
        createdAt: user.createdAt,
        failedAttempts: user.failedAttempts,
        lockUntil: user.lockUntil,

        stats: {
          assets: user._count.asset,
          assessments: user._count.assessment,
          frameworks: user._count.framework,
          controls: user._count.control,
          internalAssessments: user._count.complianceAssessment,
          evidence: user._count.evidence,
          projects: user._count.project,
          auditLogs: user._count.auditLog
        }
      });

    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: "Failed to fetch profile" });
    }
  });
}