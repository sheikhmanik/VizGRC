import authMiddleware from "../../middleware/authMiddleware";

export default function GlobalStats(fastify: any) {
  fastify.addHook("preHandler", authMiddleware);

  fastify.get("/get", async (req: any, reply: any) => {
    try {
      const globalStats = await fastify.prisma.globalStats.findUnique({
        where: { id: "GLOBAL_STATS" },
      });
      reply.send(globalStats);
    } catch (error) {
      console.error("Error fetching global stats:", error);
      reply.status(500).send({ error: "Failed to fetch global stats" });
    }
  });
}