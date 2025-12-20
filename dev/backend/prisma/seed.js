const { PrismaClient, UserRole, UserStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const users = [
    {
      email: 'superadmin@mining.com',
      password: 'SuperAdmin@123',
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      department: 'Administration',
      position: 'Super Administrator',
    },
    {
      email: 'itmanager@mining.com',
      password: 'ITManager@123',
      firstName: 'IT',
      lastName: 'Manager',
      role: UserRole.IT_MANAGER,
      department: 'Information Technology',
      position: 'IT Manager',
    },
    {
      email: 'ceo@mining.com',
      password: 'CEO@1234',
      firstName: 'Chief',
      lastName: 'Executive',
      role: UserRole.CEO,
      department: 'Executive',
      position: 'Chief Executive Officer',
    },
    {
      email: 'cfo@mining.com',
      password: 'CFO@1234',
      firstName: 'Chief',
      lastName: 'Financial',
      role: UserRole.CFO,
      department: 'Finance',
      position: 'Chief Financial Officer',
    },
    {
      email: 'accountant@mining.com',
      password: 'Accountant@1234',
      firstName: 'John',
      lastName: 'Accountant',
      role: UserRole.ACCOUNTANT,
      department: 'Finance',
      position: 'Senior Accountant',
    },
    {
      email: 'operations@mining.com',
      password: 'Operations@1234',
      firstName: 'Operations',
      lastName: 'Manager',
      role: UserRole.OPERATIONS_MANAGER,
      department: 'Operations',
      position: 'Operations Manager',
    },
    {
      email: 'warehouse@mining.com',
      password: 'Warehouse@1234',
      firstName: 'Warehouse',
      lastName: 'Manager',
      role: UserRole.WAREHOUSE_MANAGER,
      department: 'Warehouse',
      position: 'Warehouse Manager',
    },
    {
      email: 'employee@mining.com',
      password: 'Employee@1234',
      firstName: 'John',
      lastName: 'Employee',
      role: UserRole.EMPLOYEE,
      department: 'General',
      position: 'Employee',
    },
  ];

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log(`✓ User ${userData.email} already exists, skipping...`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        department: userData.department,
        position: userData.position,
        status: UserStatus.ACTIVE,
      },
    });

    console.log(`✓ Created user: ${userData.email} (${userData.role})`);
  }

  console.log('✅ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
