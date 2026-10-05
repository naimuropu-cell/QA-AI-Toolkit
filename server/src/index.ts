import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import { errorHandler } from './middleware/errorHandler';
import prisma from './config/db';

import requirementRoutes from './routes/requirementRoutes';
import testDesignRoutes from './routes/testDesignRoutes';
import bugRoutes from './routes/bugRoutes';
import apiTestingRoutes from './routes/apiTestingRoutes';
import automationRoutes from './routes/automationRoutes';
import codebaseRoutes from './routes/codebaseRoutes';
import failureRoutes from './routes/failureRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    service: 'Personal QA AI Toolkit API',
    database: 'Prisma SQLite',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/test-design', testDesignRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/api-testing', apiTestingRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/codebase', codebaseRoutes);
app.use('/api/failures', failureRoutes);

// Error handling middleware
app.use(errorHandler);

// Seed initial data if database is fresh
const initDbAndSeed = async () => {
  try {
    const projectCount = await prisma.project.count();
    if (projectCount === 0) {
      console.log('Seeding initial QA project and baseline knowledge...');
      const project = await prisma.project.create({
        data: {
          name: 'E-Commerce Platform QA Suite',
          description: 'Production QA test suite for storefront checkout, user authentication, and inventory.',
          techStack: 'React / Next.js / TypeScript',
          testFramework: 'Playwright',
          qaStandards: 'Use Page Object Model (POM), prefer getByRole locators, avoid arbitrary sleeps, isolate test data.',
          targetUrl: 'https://demo-ecommerce.example.com'
        }
      });

      await prisma.knowledgeItem.create({
        data: {
          title: 'Core Automation Standards',
          category: 'Automation Rules',
          content: '1. Prefer stable getByRole / getByTestId locators.\n2. Isolate test fixtures.\n3. Assert on visible state, not arbitrary timers.\n4. Follow Page Object Model.',
          tags: 'playwright,pom,standards',
          projectId: project.id
        }
      });

      await prisma.activityLog.create({
        data: {
          action: 'PROJECT_INITIALIZED',
          target: project.name,
          details: 'Initial personal QA workspace seeded successfully.',
          projectId: project.id
        }
      });
      console.log('Seeding completed successfully.');
    }
  } catch (err) {
    console.warn('DB initialization check:', err);
  }
};

app.listen(PORT, async () => {
  console.log(`QA AI Toolkit Server running on http://localhost:${PORT}`);
  await initDbAndSeed();
});

export default app;
