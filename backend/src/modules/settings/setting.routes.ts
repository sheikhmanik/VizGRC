import { FastifyInstance } from "fastify";
import authMiddleware from "../../middleware/authMiddleware";
import { sendEmail } from "../utils/mailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export default function Settings(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authMiddleware);

  fastify.post("/send-invitation", async (req, reply) => {
    const {
      id,
      name,
      email,
      role,
      status,
    } = req.body as any;

    const user = await fastify.prisma.user.findUnique({ where: { email }});
    
    if (user) {
      return reply.status(400).send({ error: "User with this email already exists" });
    };

    const roleRecord = await fastify.prisma.role.findUnique({ where: { name: role }});
    
    if (!roleRecord) {
      return reply.status(400).send({ error: "Role not found" });
    }

    const inviteToken = crypto.randomBytes(32).toString("hex");

    try {
      await fastify.prisma.user.create({
        data: {
          id,
          name,
          email,
          status,
          roleId: roleRecord.id,
          inviteToken,
          inviteExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }
      });
      
      const inviteLink = `${process.env.APP_URL}/accept-invite?token=${inviteToken}`;
      await sendEmail(email, name, inviteLink);

      reply.send({ message: "Invitation sent successfully" });
    } catch (error) {
      console.error("Error sending invitation:", error);
      reply.status(500).send({ error: "Failed to send invitation" });
    }
  });

  fastify.delete("/delete-user/:id", async (req, reply) => {
    const { id } = req.params as any;
    const currentUser = req.user as any;

    try {

      if (currentUser.id === id) {
        return reply.status(400).send({ error: "You cannot delete your own account." });
      }

      await fastify.prisma.user.delete({ where: { id } });
      reply.send({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      reply.status(500).send({ error: "Failed to delete user" });
    }
  });

  fastify.put("/update-user-role/:id", async (req, reply) => {
    const { id } = req.params as any;
    const { role } = req.body as any;

    // Only allowing administrators to update user roles
    const RequestUser = await fastify.prisma.user.findUnique({ where: { id: req.userId }});
    const RequestUserRole = await fastify.prisma.role.findUnique({ where: { id: RequestUser!.roleId }});
    if (RequestUserRole?.name !== "Administrator") {
      return reply.status(403).send({ error: "Only administrators can update user roles." });
    }

    const roleRecord = await fastify.prisma.role.findUnique({ where: { name: role }});

    if (!roleRecord) {
      return reply.status(400).send({ error: "Role not found" });
    }

    try {
      await fastify.prisma.user.update({
        where: { id },
        data: { roleId: roleRecord.id },
      });
      reply.send({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      reply.status(500).send({ error: "Failed to update user role" });
    }
  });

  fastify.get("/get-users", async (req, reply) => {
    try {
      const users = await fastify.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
        orderBy: {
          createdAt: "asc"
        }
      });
      reply.send(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      reply.status(500).send({ error: "Failed to fetch users" });
    }
  });

  fastify.get("/get-user", async (req, reply) => {
    try {
      const user = await fastify.prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      });
      reply.send(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      reply.status(500).send({ error: "Failed to fetch user" });
    }
  });

  fastify.post("/toggle-permission", async (req, reply) => {
    const { roleName, permId } = req.body as {
      roleName: string;
      permId: string;
    };
  
    const [resource, action] = permId.split("-");

    if (!resource || !action) {
      return reply.status(400).send({ error: "Invalid permission ID format" });
    };
  
    const role = await fastify.prisma.role.findUnique({
      where: { name: roleName }
    });
  
    if (!role) {
      return reply.status(404).send({ error: "Role not found" });
    }
  
    const permission = await fastify.prisma.permission.findUnique({
      where: {
        resource_action: {
          resource: resource,
          action: action
        }
      }
    });
  
    if (!permission) {
      return reply.status(404).send({ error: "Permission not found" });
    }
  
    const existing = await fastify.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id
        }
      }
    });
  
    if (existing) {
      await fastify.prisma.rolePermission.delete({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        }
      });
  
      return reply.send({ message: "Permission revoked" });
    } else {
      await fastify.prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
  
      return reply.send({ message: "Permission granted" });
    }
  });

  fastify.get("/get-role-permissions", async (req, reply) => {
    const roles = await fastify.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
  
    const formatted: Record<string, string[]> = {};
  
    roles.forEach((role: any) => {
      formatted[role.name] = role.permissions.map((rp: any) =>
        `${rp.permission.resource}-${rp.permission.action}`
      );
    });
  
    return reply.send(formatted);
  });

  fastify.post("/update-password", async (req, reply) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const user = await fastify.prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user || !user.password) {
      return reply.status(404).send({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return reply.status(400).send({ error: "Current password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 2);
    // expiresAt.setMinutes(expiresAt.getMinutes() + 1);  // For testing, set password expiry to 1 minute

    await fastify.prisma.user.update({
      where: { id: req.userId },
      data: {
        password: hashedNewPassword,
        passwordExpiresAt: expiresAt,
      }
    });

    return reply.send({ message: "Password updated successfully" });
  });

  fastify.post("/update-password-policy", async (req, reply) => {
    const {
      lowercase,
      uppercase,
      number,
      symbol,
      noEmail,
      noFirstName,
      noLastName,
      noCommon,
      minLength,
      expiry,
    } = req.body as any;

    // Only allowing administrators to update password policy
    const user = await fastify.prisma.user.findUnique({ where: { id: req.userId }});
    if (!user) return reply.status(404).send({ error: "User not found." })
    const userRole = await fastify.prisma.role.findUnique({ where: { id: user.roleId }});
    if (userRole?.name !== "Administrator") {
      return reply.status(403).send({ error: "Only administrators can update user roles." });
    }

    try {
      const updatedPolicy = await fastify.prisma.passwordPolicy.upsert({
        where: { id: "GLOBAL_POLICY" },
        update: {
          lowercase,
          uppercase,
          number,
          symbol,
          noEmail,
          noFirstName,
          noLastName,
          noCommon,
          minLength,
          expiry,
        },
        create: {
          id: "GLOBAL_POLICY",
          lowercase,
          uppercase,
          number,
          symbol,
          noEmail,
          noFirstName,
          noLastName,
          noCommon,
          minLength,
          expiry,
        }
      });
      reply.send(updatedPolicy);
    } catch (error) {
      console.error("Error updating password policy:", error);
      reply.status(500).send({ error: "Failed to update password policy" });      
    }
  });

  fastify.get("/get-password-policy", async (req, reply) => {
    try {
      const policy = await fastify.prisma.passwordPolicy.findUnique({
        where: { id: "GLOBAL_POLICY" }
      });
      reply.send(policy);
    } catch (error) {
      console.error("Error fetching password policy:", error);
      reply.status(500).send({ error: "Failed to fetch password policy" });      
    }
  });
}