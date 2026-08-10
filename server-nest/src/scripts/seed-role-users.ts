import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { User, UserRole } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';

// Role users to create
const ROLE_USERS = [
  {
    email: 'cto@gmail.com',
    password: 'Cto@2026',
    firstName: 'Sarah',
    lastName: 'Tech',
    role: UserRole.CTO,
  },
  {
    email: 'ciso@gmail.com',
    password: 'Ciso@2026',
    firstName: 'Michael',
    lastName: 'Security',
    role: UserRole.CISO,
  },
  {
    email: 'finance@gmail.com',
    password: 'Finance@2026',
    firstName: 'Emma',
    lastName: 'Money',
    role: UserRole.FINANCE,
  },
];

async function seedRoleUsers() {
  // Create database connection - using SQLite (same as app)
  const dataSource = new DataSource({
    type: 'sqlite',
    database: process.env.DATABASE_PATH || './techos.db',
    entities: [User, Organization],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    const organizationRepo = dataSource.getRepository(Organization);
    const userRepo = dataSource.getRepository(User);

    // Get or create organization
    let organization = await organizationRepo.findOne({
      where: { slug: 'techos-company' },
    });

    if (!organization) {
      organization = organizationRepo.create({
        id: randomUUID(),
        name: 'TechOS Company',
        slug: 'techos-company',
      });
      await organizationRepo.save(organization);
      console.log('✅ Created organization: TechOS Company');
    } else {
      console.log('✅ Found organization: TechOS Company');
    }

    // Create role users
    for (const roleUser of ROLE_USERS) {
      const existingUser = await userRepo.findOne({
        where: { email: roleUser.email },
      });

      if (existingUser) {
        // Update existing user
        existingUser.password_hash = await bcrypt.hash(roleUser.password, 10);
        existingUser.first_name = roleUser.firstName;
        existingUser.last_name = roleUser.lastName;
        existingUser.name = `${roleUser.firstName} ${roleUser.lastName}`;
        existingUser.role = roleUser.role;
        existingUser.status = 'active';
        existingUser.org_id = organization.id;
        await userRepo.save(existingUser);
        console.log(`✅ Updated ${roleUser.role.toUpperCase()} user: ${roleUser.email} / ${roleUser.password}`);
      } else {
        // Create new user
        const passwordHash = await bcrypt.hash(roleUser.password, 10);
        const user = userRepo.create({
          id: randomUUID(),
          org_id: organization.id,
          email: roleUser.email,
          password_hash: passwordHash,
          first_name: roleUser.firstName,
          last_name: roleUser.lastName,
          name: `${roleUser.firstName} ${roleUser.lastName}`,
          role: roleUser.role,
          status: 'active',
        });
        await userRepo.save(user);
        console.log(`✅ Created ${roleUser.role.toUpperCase()} user: ${roleUser.email} / ${roleUser.password}`);
      }
    }

    console.log('\n🎉 All role users created successfully!\n');
    console.log('📝 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CEO:      ceo@gmail.com      / Ceo@2026');
    console.log('CTO:      cto@gmail.com      / Cto@2026');
    console.log('CISO:     ciso@gmail.com     / Ciso@2026');
    console.log('FINANCE:  finance@gmail.com  / Finance@2026');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error seeding role users:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    process.exit(0);
  }
}

// Run the seed
seedRoleUsers();
