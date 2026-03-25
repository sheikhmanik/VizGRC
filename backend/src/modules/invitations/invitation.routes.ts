import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";

export default function AcceptInvite(fastify: FastifyInstance) {
  fastify.post("/accept-invite", async (req, reply) => {
    const { token, password } = req.body as { token: string, password: string };
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await fastify.prisma.user.findFirst({
      where: {
        inviteToken: token,
      }
    });

    console.log("Accepting invite for token:", token, "Found user:", user);

    if (!user) {
      return reply.status(400).send({ error: "Invalid or expired token" });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 2);
    // expiresAt.setMinutes(expiresAt.getMinutes() + 1);  // For testing, set password expiry to 1 minute

    await fastify.prisma.user.update({
      where: { id: user.id },
      data: {
        status: "Active",
        inviteToken: null,
        inviteExpires: null,
        password: hashedPassword,
        passwordExpiresAt: expiresAt,
      }
    });

    const tokenForLogin = fastify.jwt.sign({ id: user?.id }, { expiresIn: "24h" });
    reply.send({ tokenForLogin });

    return reply.send({ message: "Account activated successfully" });
  });
}