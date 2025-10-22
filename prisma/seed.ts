import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ROLES, PERMISSIONS, RESOURCES } from '@common/constants';

const prisma = new PrismaClient();

const roleDefinitions = [
  {
    name: ROLES.SUPER_ADMIN,
    description: 'Super Administrator with full system access',
    permissions: Object.values(RESOURCES).flatMap((resource) =>
      Object.values(PERMISSIONS).map((action) => ({ resource, action })),
    ),
  },
  {
    name: ROLES.ADMIN,
    description: 'Administrator with limited management rights',
    permissions: Object.values(RESOURCES).flatMap((resource) =>
      Object.values(PERMISSIONS)
        .filter((a) => !(resource === RESOURCES.ROLES && a === PERMISSIONS.DELETE)) // Prevent delete role
        .map((action) => ({ resource, action })),
    ),
  },
];

async function main() {
  await prisma.userPermissions.deleteMany();
  await prisma.userRoles.deleteMany();
  await prisma.rolePermissions.deleteMany();
  await prisma.userSessions.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.permissions.deleteMany();
  await prisma.roles.deleteMany();
  await prisma.users.deleteMany();

  // Users
  const userEmailMap: Record<string, string> = {
    [ROLES.SUPER_ADMIN]: 'doston1@gmail.com',
    [ROLES.ADMIN]: 'doston2@gmail.com',
    [ROLES.USER]: 'rustamdostondev@gmail.com',
  };
  const hashedPassword = await bcrypt.hash('dos130230', 10);
  const users = await Promise.all([
    prisma.users.create({
      data: {
        email: userEmailMap[ROLES.SUPER_ADMIN],
        fullName: 'Super Admin User',
        password: hashedPassword,
        isVerified: true,
        lastLoginAt: new Date(),
        role: ROLES.SUPER_ADMIN,
      },
    }),
    prisma.users.create({
      data: {
        email: userEmailMap[ROLES.ADMIN],
        fullName: 'Admin User',
        password: hashedPassword,
        isVerified: true,
        lastLoginAt: new Date(),
        role: ROLES.ADMIN,
      },
    }),
    prisma.users.create({
      data: {
        email: userEmailMap[ROLES.USER],
        fullName: "Dostonbek O'ktamov",
        password: hashedPassword,
        provider: 'google',
        providerId: '112402898287004800806',
        authMethod: 'oauth',
        isVerified: true,
        lastLoginAt: new Date(),
        role: ROLES.USER,
      },
    }),
  ]);

  // Permissions
  const permissionMap = new Map();
  for (const resource of Object.values(RESOURCES)) {
    for (const action of Object.values(PERMISSIONS)) {
      const name = `${resource}:${action}`;
      const permission = await prisma.permissions.create({
        data: {
          name,
          description: `Can ${action} ${resource}`,
          resource,
          action,
        },
      });
      permissionMap.set(name, permission);
    }
  }

  // Roles
  for (const roleDef of roleDefinitions) {
    const role = await prisma.roles.create({
      data: {
        name: roleDef.name,
        description: roleDef.description,
      },
    });

    for (const perm of roleDef.permissions) {
      const permission = permissionMap.get(`${perm.resource}:${perm.action}`);
      if (permission) {
        await prisma.rolePermissions.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }

    const email = userEmailMap[roleDef.name];
    const user = users.find((u) => u.email === email);
    if (user) {
      await prisma.userRoles.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });
    }
  }

  console.log('✅ Seed completed.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
