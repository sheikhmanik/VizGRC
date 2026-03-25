import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "../utils/mailer";

export default function authentication(fastify: FastifyInstance) {
  fastify.post("/login", async (req, reply) => {
    const { email, password } = req.body as any;
    try {

      const user = await fastify.prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return reply.status(404).send({ error: "User not found." });
      }

      const now = new Date();

      if (user.lockUntil && user.lockUntil > now) {
        return reply.status(403).send({
          error: `Account locked. Try again after sometime.`
        });
      }

      if (!user.password) {
        return reply.status(400).send({ error: "Invalid credentials." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        if (user.passwordExpiresAt && new Date(user.passwordExpiresAt) < new Date()){

          // If reset already generated with the last 5 minutes, don't send again
          if (user.emailSentAt && new Date(user.emailSentAt) > new Date(Date.now() - 1 * 60 * 1000)) {
            return reply.status(429).send({
              message: "Password reset email already sent. Please check your mail or try again later.",
              code: "EMAIL_ALREADY_SENT"
            });
          }

          const inviteToken = crypto.randomBytes(32).toString("hex");

          const updatedUser = await fastify.prisma.user.update({
            where: { id: user.id },
            data: {
              inviteToken,
              inviteExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
              emailSentAt: new Date(),
            }
          });
          
          const inviteLink = `${process.env.APP_URL}/accept-invite?token=${inviteToken}`;
          await sendEmail(updatedUser.email, updatedUser.name, inviteLink);

          return reply.status(401).send({
            message: "Password expired. Please check your mail and update password.",
            code: "PASSWORD_EXPIRED"
          });
        } else {
          await fastify.prisma.user.update({
            where: { id: user.id },
            data: {
              failedAttempts: 0,
              firstFailedAt: null,
              lockUntil: null
            }
          });
  
          const token = fastify.jwt.sign({ id: user?.id }, { expiresIn: "24h" });
          reply.send({ token });
          return;
        }

      } else {
        let failedAttempts = user.failedAttempts + 1;
        let firstFailedAt = user.firstFailedAt ?? now;
        let lockUntil = null;

        const fiveMinutes = 5 * 60 * 1000;

        // reset window if more than 5 minutes passed
        if (user.firstFailedAt && (now.getTime() - user.firstFailedAt.getTime()) > fiveMinutes) {
          failedAttempts = 1;
          firstFailedAt = now;
        }

        // lock if 5 attempts
        if (failedAttempts >= 5) {
          lockUntil = new Date(now.getTime() + 20 * 60 * 1000);
        }

        const roleId = user.roleId;
        const role = await fastify.prisma.role.findUnique({ where: { id: roleId } });

        if (role?.name !== "Administrator") {
          await fastify.prisma.user.update({
            where: { id: user.id },
            data: {
              failedAttempts,
              firstFailedAt,
              lockUntil
            }
          });
        }


        return reply.status(400).send({ error: "Invalid password" });
      }
    } catch (error) {
      console.error("Error during login:", error);
      reply.status(500).send({ error: "Login failed" });
    }
  });
}