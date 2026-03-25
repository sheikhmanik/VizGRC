import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function initializeSystem() {
  // 1️⃣ Roles
  const roles = [
    { id: "role-admin", name: "Administrator" },
    { id: "role-risk-manager", name: "Risk Manager" },
    { id: "role-compliance-analyst", name: "Compliance Analyst" },
    { id: "role-auditor", name: "Auditor" },
    { id: "role-viewer", name: "Viewer" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // 2️⃣ Permissions
  const modules = {
    risks: ["View", "Create", "Edit", "Delete"],
    assets: ["View", "Create", "Edit", "Delete"],
    controls: ["View", "Create", "Edit", "Delete"],
    frameworks: ["View", "Create", "Edit", "Delete"],
    compliance: ["View", "Assess", "Audit"],
    pipeline: ["View", "Create", "Edit", "Move"],
    audit: ["View", "Export"],
    settings: ["View", "Identity", "Schema"],
  };

  for (const [resource, actions] of Object.entries(modules)) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: {
          resource_action: { resource, action },
        },
        update: {},
        create: {
          resource,
          action,
        },
      });
    }
  }

  // 3️⃣ Default Admin User
  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      id: "U-1",
      name: "Admin Name",
      email: "admin@gmail.com",
      status: "Active",
      password: hashedPassword,
      roleId: "role-admin",
    },
  });

  // 4️⃣ Seeding Asset Dropdown Options
  const NODE_TYPES = [
    { value: 'Application', label: 'Application' },
    { value: 'Server', label: 'Infrastructure / Server' },
    { value: 'Database', label: 'Database' },
    { value: 'Network', label: 'Network Device' },
    { value: 'SaaS', label: 'SaaS Solution' },
    { value: 'Endpoint', label: 'User Endpoint' },
    { value: 'OT', label: 'Operational Tech (OT)' },
    { value: 'Vendor', label: 'Third-party Vendor' },
  ];
  
  const ASSET_CATEGORIES = [
    { value: 'Information', label: 'Information' },
    { value: 'Software', label: 'Software' },
    { value: 'Hardware', label: 'Hardware' },
    { value: 'Service', label: 'Service' },
    { value: 'People', label: 'People' },
  ];
  
  const CRITICALITY_LEVELS = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' },
  ];
  
  const CLASSIFICATION_OPTIONS = [
    { value: 'Internal', label: 'Internal' },
    { value: 'Public', label: 'Public' },
    { value: 'Confidential', label: 'Confidential' },
    { value: 'Restricted', label: 'Restricted' },
  ];

  async function seedOptions(type: string, options: { value: string; label: string }[]) {
    for (const option of options) {
      await prisma.assetOption.upsert({
        where: {
          type_value: {
            type,
            value: option.value,
          },
        },
        update: {
          type,
          value: option.value,
          label: option.label,
        },
        create: {
          type,
          value: option.value,
          label: option.label,
        },
      });
    }
  }

  await seedOptions("NODE_TYPE", NODE_TYPES);
  await seedOptions("ASSET_CATEGORIES", ASSET_CATEGORIES);
  await seedOptions("CRITICALITY_LEVELS", CRITICALITY_LEVELS);
  await seedOptions("CLASSIFICATION_OPTIONS", CLASSIFICATION_OPTIONS);

  console.log("Database seeded successfully.");
}