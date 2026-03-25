import { FastifyInstance } from "fastify";
import authMiddleware from "../../middleware/authMiddleware";

export default function assetRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);

  fastify.post("/create-asset", async (req, reply) => {
    const { id, name, type, category, classification, criticality } = req.body as any;
    try {
      await fastify.prisma.asset.create({
        data: {
          id,
          name,
          type,
          category,
          classification,
          criticality,
          userId: req.userId
        }
      })
      console.log("Asset created successfully.");
    } catch (error: any) {
      console.log(process.env.DATABASE_URL);
      console.error(error);
      return reply.status(500).send({ error: error.message });
    }
  });

  fastify.get("/get-assets", async (req, reply) => {
    try {
      const assets = await fastify.prisma.asset.findMany({
        where: { userId: req.userId }
      });
      reply.send(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      reply.status(500).send({ error: "Failed to fetch assets" });
    }
  });

  fastify.delete("/delete-asset/:id", async (req, reply) => {
    const { id } = req.params as any;
    try {
      await fastify.prisma.asset.delete({
        where: { id }
      });
      console.log("Asset deleted successfully.");
      reply.send({ message: "Asset deleted successfully" });
    } catch (error) {
      console.error("Error deleting asset:", error);
      reply.status(500).send({ error: "Failed to delete asset" });
    }
  });

  fastify.post("/create-option", async (req, reply) => {
    const { type, value, label } = req.body as any;
    try {
      const newOption = await fastify.prisma.assetOption.create({
        data: {
          type,
          value,
          label,
        }
      });
      reply.send(newOption);
    } catch (error) {
      console.error("Error creating asset option:", error);
      reply.status(500).send({ error: "Failed to create asset option" });
    }
  });

  fastify.get("/get-options", async (req, reply) => {
    try {
      const options = await fastify.prisma.assetOption.findMany();
      reply.send(options);
    } catch (error) {
      console.error("Error fetching asset options:", error);
      reply.status(500).send({ error: "Failed to fetch asset options" });      
    }
  });

  fastify.delete("/delete-option/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
  
    try {
      const option = await fastify.prisma.assetOption.findUnique({
        where: { id }
      });
  
      if (!option) {
        return reply.status(404).send({
          error: "Option not found"
        });
      }
  
      await fastify.prisma.assetOption.delete({
        where: { id },
      });
  
      return reply.send({ message: "Option deleted successfully" });
  
    } catch (error) {
      console.error("Error deleting asset option:", error);
      return reply.status(500).send({ error: "Failed to delete option" });
    }
  });
}