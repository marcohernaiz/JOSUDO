import bcrypt from 'bcrypt';
import { db } from '../db';
import { adminUsers } from '@shared/schema';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 10;

export async function initializeAdminUser() {
  try {
    // Require environment variables - no fallback
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      console.warn('⚠ ADMIN_USERNAME and ADMIN_PASSWORD environment variables are not set.');
      console.warn('⚠ Admin functionality will not be available until these are configured.');
      console.warn('⚠ Set these variables in your environment to enable admin access.');
      return; // Exit without creating admin user
    }

    // Check if admin user already exists
    const [existingAdmin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, adminUsername))
      .limit(1);

    if (!existingAdmin) {
      // Create initial admin user
      const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

      await db.insert(adminUsers).values({
        username: adminUsername,
        passwordHash,
        email: 'admin@josudo.org',
        isActive: true,
      });

      console.log(`✓ Initial admin user created: ${adminUsername}`);
    } else {
      console.log(`✓ Admin user already exists: ${adminUsername}`);
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
}
