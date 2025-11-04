import { Express, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from './db';
import { adminUsers, appSettings, personaTemplates } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from './middleware/adminAuth';

const SALT_ROUNDS = 10;

export function registerAdminRoutes(app: Express) {
  // Admin login
  app.post('/api/admin/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      // Find admin user
      const [adminUser] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.username, username))
        .limit(1);

      if (!adminUser || !adminUser.isActive) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, adminUser.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Set admin session
      req.session.adminUserId = adminUser.id;
      req.session.adminUsername = adminUser.username;
      req.session.adminEmail = adminUser.email || undefined;

      res.json({
        success: true,
        admin: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
        },
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Admin logout
  app.post('/api/admin/logout', requireAdmin, (req: Request, res: Response) => {
    req.session.adminUserId = undefined;
    req.session.adminUsername = undefined;
    req.session.adminEmail = undefined;
    res.json({ success: true });
  });

  // Check admin session
  app.get('/api/admin/session', (req: Request, res: Response) => {
    if (req.session.adminUserId) {
      res.json({
        authenticated: true,
        admin: {
          id: req.session.adminUserId,
          username: req.session.adminUsername,
          email: req.session.adminEmail,
        },
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  // === ADMIN USERS MANAGEMENT ===

  // Get all admin users
  app.get('/api/admin/users', requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await db.select({
        id: adminUsers.id,
        username: adminUsers.username,
        email: adminUsers.email,
        isActive: adminUsers.isActive,
        createdAt: adminUsers.createdAt,
        updatedAt: adminUsers.updatedAt,
      }).from(adminUsers);

      res.json(users);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      res.status(500).json({ error: 'Failed to fetch admin users' });
    }
  });

  // Create admin user
  app.post('/api/admin/users', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { username, password, email } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const [newUser] = await db
        .insert(adminUsers)
        .values({
          username,
          passwordHash,
          email: email || null,
          isActive: true,
        })
        .returning({
          id: adminUsers.id,
          username: adminUsers.username,
          email: adminUsers.email,
          isActive: adminUsers.isActive,
          createdAt: adminUsers.createdAt,
        });

      res.json(newUser);
    } catch (error: any) {
      console.error('Error creating admin user:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: 'Failed to create admin user' });
    }
  });

  // Update admin user
  app.patch('/api/admin/users/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { username, password, email, isActive } = req.body;

      const updateData: any = {};
      if (username) updateData.username = username;
      if (email !== undefined) updateData.email = email || null;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      }
      updateData.updatedAt = new Date();

      const [updatedUser] = await db
        .update(adminUsers)
        .set(updateData)
        .where(eq(adminUsers.id, id))
        .returning({
          id: adminUsers.id,
          username: adminUsers.username,
          email: adminUsers.email,
          isActive: adminUsers.isActive,
          updatedAt: adminUsers.updatedAt,
        });

      if (!updatedUser) {
        return res.status(404).json({ error: 'Admin user not found' });
      }

      res.json(updatedUser);
    } catch (error: any) {
      console.error('Error updating admin user:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: 'Failed to update admin user' });
    }
  });

  // Delete admin user
  app.delete('/api/admin/users/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // Prevent deleting yourself
      if (req.adminUser && req.adminUser.id === id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      await db.delete(adminUsers).where(eq(adminUsers.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting admin user:', error);
      res.status(500).json({ error: 'Failed to delete admin user' });
    }
  });

  // === API KEYS MANAGEMENT ===

  // Get all API keys
  app.get('/api/admin/api-keys', requireAdmin, async (req: Request, res: Response) => {
    try {
      const keys = await db.select().from(appSettings);
      res.json(keys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      res.status(500).json({ error: 'Failed to fetch API keys' });
    }
  });

  // Create or update API key
  app.post('/api/admin/api-keys', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { key, value, isEncrypted } = req.body;

      if (!key || !value) {
        return res.status(400).json({ error: 'Key and value required' });
      }

      // Check if key exists
      const [existing] = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, key))
        .limit(1);

      if (existing) {
        // Update existing
        const [updated] = await db
          .update(appSettings)
          .set({
            value,
            isEncrypted: isEncrypted !== undefined ? isEncrypted : true,
            updatedAt: new Date(),
          })
          .where(eq(appSettings.key, key))
          .returning();

        res.json(updated);
      } else {
        // Create new
        const [newKey] = await db
          .insert(appSettings)
          .values({
            key,
            value,
            isEncrypted: isEncrypted !== undefined ? isEncrypted : true,
          })
          .returning();

        res.json(newKey);
      }
    } catch (error: any) {
      console.error('Error saving API key:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Key already exists' });
      }
      res.status(500).json({ error: 'Failed to save API key' });
    }
  });

  // Delete API key
  app.delete('/api/admin/api-keys/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(appSettings).where(eq(appSettings.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting API key:', error);
      res.status(500).json({ error: 'Failed to delete API key' });
    }
  });

  // === PERSONA TEMPLATES MANAGEMENT ===

  // Get all persona templates
  app.get('/api/admin/persona-templates-full', requireAdmin, async (req: Request, res: Response) => {
    try {
      const templates = await db.select().from(personaTemplates);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching persona templates:', error);
      res.status(500).json({ error: 'Failed to fetch persona templates' });
    }
  });

  // Create persona template
  app.post('/api/admin/persona-templates', requireAdmin, async (req: Request, res: Response) => {
    try {
      const templateData = req.body;

      const [newTemplate] = await db
        .insert(personaTemplates)
        .values(templateData)
        .returning();

      res.json(newTemplate);
    } catch (error) {
      console.error('Error creating persona template:', error);
      res.status(500).json({ error: 'Failed to create persona template' });
    }
  });

  // Update persona template
  app.patch('/api/admin/persona-templates/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const templateData = req.body;

      const [updated] = await db
        .update(personaTemplates)
        .set({
          ...templateData,
          updatedAt: new Date(),
        })
        .where(eq(personaTemplates.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'Persona template not found' });
      }

      res.json(updated);
    } catch (error) {
      console.error('Error updating persona template:', error);
      res.status(500).json({ error: 'Failed to update persona template' });
    }
  });

  // Delete persona template
  app.delete('/api/admin/persona-templates/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(personaTemplates).where(eq(personaTemplates.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting persona template:', error);
      res.status(500).json({ error: 'Failed to delete persona template' });
    }
  });
}
