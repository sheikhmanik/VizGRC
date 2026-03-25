import { FastifyReply, FastifyRequest } from "fastify";
// import crypto from "crypto";
// import { sendEmail } from "../modules/utils/mailer";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

export default async function authMiddleware( request: FastifyRequest, reply: FastifyReply) {
  try {
    const decoded = await request.jwtVerify<{ id: string }>();
    request.userId = decoded.id;

    // Fetch user
    const user = await request.server.prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return reply.status(401).send({
        message: "Unauthorized user"
      });
    }

    // Check password expiry
    if (user.passwordExpiresAt && new Date(user.passwordExpiresAt) < new Date()){

      // Sending email from middleware for password change is not ideal. 
      // But for demo purposes we can do it here.
      // In production, consider a background job or separate service for this.
      
      // Start =>
      
      // // If reset already generated and not expired, don't send again
      // if (user.inviteToken && user.inviteExpires && user.inviteExpires > new Date()) {
      //   return reply.status(401).send({
      //     message: "Password expired. Please check your mail and update password.",
      //     code: "PASSWORD_EXPIRED"
      //   });
      // }
      
      // const inviteToken = crypto.randomBytes(32).toString("hex");
      // const inviteExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // // Atomic update: only set token if none valid exists
      // const res = await request.server.prisma.user.updateMany({
      //   where: {
      //     id: user.id,
      //     OR: [
      //       { inviteToken: null },
      //       { inviteExpires: { lt: new Date() } } // expired token
      //     ]
      //   },
      //   data: {
      //     inviteToken,
      //     inviteExpires
      //   }
      // });

      // // Only the winner (count === 1) sends the email
      // if (res.count === 1) {
      //   const inviteLink = `${process.env.APP_URL}/accept-invite?token=${inviteToken}`;
      //   await sendEmail(user.email, user.name, inviteLink);
      // }

      // End.

      return reply.status(401).send({
        message: "Password expired. Please check your mail and update password.",
        code: "PASSWORD_EXPIRED"
      });

    }
  } catch (err) {
    return reply.status(401).send({
      message: "Unauthorized. Invalid or missing token.",
    });
  }
}