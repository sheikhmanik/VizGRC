import { FastifyInstance } from "fastify";
import authMiddleware from "../../middleware/authMiddleware";
import { v2 as cloudinary } from "cloudinary";

export default function Upload(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);

  fastify.post("/evidence", async (req, reply) => {
    const data = await req.file();
    if (!data) {
      return reply.status(400).send({ error: "No file uploaded" });
    }

    const buffer = await data.toBuffer();

    try {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            type: "upload",
            folder: "vizgrc/evidence",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end(buffer);
      });

      return reply.send({
        url: uploadResult.secure_url,
      });

    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return reply.status(500).send({ error: "Upload failed" });
    }
  });
}
