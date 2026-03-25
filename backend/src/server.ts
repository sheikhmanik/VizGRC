import * as dotenv from "dotenv";
dotenv.config();

import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import assetRoutes from "./modules/assets/asset.routes";
import prismaPlugin from "./plugins/prisma";
import frameworkRoutes from "./modules/frameworks/framework.routes";
import fastifyJwt from "@fastify/jwt";
import authentication from "./modules/authentication/auth";
import assessmentRoutes from "./modules/assessments/assessment.route";
import controlRoutes from "./modules/controls/control.routes";
import complianceRoutes from "./modules/compliance/compliance.routes";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "path";
import uploadRoutes from "./modules/evidences/upload.routes";
import { v2 as cloudinary } from "cloudinary";
import evidenceRoutes from "./modules/evidences/evidence.routes";
import pipelineRoutes from "./modules/pipelines/pipeline.routes";
import settingRoutes from "./modules/settings/setting.routes";
import auditRoutes from "./modules/audit-logs/audit.routes";
import profileRoutes from "./modules/profile/profile.routes";
import invitationRoutes from "./modules/invitations/invitation.routes";
import { initializeSystem } from "./bootstrap/seed";
import globalStatsRoutes from "./modules/global-stats/globalStats.routes";

const app = Fastify({ logger: true });

// Plugins
app.register(fastifyCors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
});
app.register(prismaPlugin);
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET as string
});
app.register(multipart);
app.register(fastifyStatic, {
  root: path.join(__dirname, "../uploads"),
  prefix: "/uploads/",
});

// Routes
app.register(authentication, { prefix: "/auth" });
app.register(dashboardRoutes, { prefix: "/dashboard" });
app.register(assetRoutes, { prefix: "/assets" });
app.register(frameworkRoutes, { prefix: "/frameworks" });
app.register(assessmentRoutes, { prefix: "/assessments" });
app.register(controlRoutes, { prefix: "/controls" });
app.register(complianceRoutes, { prefix: "/compliance" });
app.register(uploadRoutes, { prefix: "/upload" });
app.register(evidenceRoutes, { prefix: "/evidence" });
app.register(pipelineRoutes, { prefix: "/pipeline" });
app.register(settingRoutes, { prefix: "/settings" });
app.register(auditRoutes, { prefix: "/audit" });
app.register(profileRoutes, { prefix: "/profile" });
app.register(invitationRoutes, { prefix: "/invitations" });
app.register(globalStatsRoutes, { prefix: "/global-stats" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

app.get("/", () => {
  return { message: "Server is running 🚀" };
});

const start = async () => {
  try {
    await initializeSystem();
    const port = Number(process.env.PORT) || 4000;
    await app.listen({ port, host: "0.0.0.0" });
    console.log("🚀 Server running on http://localhost:4000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();